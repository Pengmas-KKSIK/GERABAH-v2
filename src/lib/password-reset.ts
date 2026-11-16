import { createHash } from "node:crypto";
import { SignJWT, jwtVerify } from "jose";
import { headers } from "next/headers";
import { authSecret } from "@/lib/auth";
import { UserError } from "@/lib/action-state";
import { APP_NAME } from "@/lib/brand";

/**
 * Atur ulang kata sandi lewat email — tanpa tabel token di database.
 * Token = JWT bertanda tangan (kunci terpisah dari cookie sesi) berisi id user + sidik jari
 * hash kata sandi saat ini. Begitu kata sandi diganti, sidik jarinya berubah → link otomatis
 * hangus (sekali pakai). Berlaku RESET_TTL_MINUTES menit.
 */
export const RESET_TTL_MINUTES = 30;

const secret = () => authSecret(":password-reset");

function fingerprint(passwordHash: string) {
  return createHash("sha256").update(passwordHash).digest("base64url").slice(0, 16);
}

export async function createResetToken(user: { id: string; passwordHash: string }) {
  return new SignJWT({ purpose: "password-reset", uid: user.id, pf: fingerprint(user.passwordHash) })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${RESET_TTL_MINUTES}m`)
    .sign(secret());
}

/** Id user kalau token sah, belum kedaluwarsa, dan kata sandinya belum diganti sejak token dibuat. */
export async function verifyResetToken(
  token: string,
  loadUser: (id: string) => Promise<{ id: string; passwordHash: string } | null>
): Promise<string | null> {
  try {
    const { payload } = await jwtVerify(token, secret());
    if (payload.purpose !== "password-reset" || typeof payload.uid !== "string") return null;
    const user = await loadUser(payload.uid);
    if (!user || fingerprint(user.passwordHash) !== payload.pf) return null;
    return user.id;
  } catch {
    return null;
  }
}

/** Fitur aktif kalau API key Resend diset. Tanpa itu, halaman Lupa Kata Sandi hanya menawarkan WhatsApp admin. */
export function emailResetEnabled() {
  return Boolean(process.env.RESEND_API_KEY);
}

/** Alamat dasar aplikasi untuk link di email: env APP_URL, atau dari header request. */
async function appUrl() {
  if (process.env.APP_URL) return process.env.APP_URL.replace(/\/+$/, "");
  const h = await headers();
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function sendResetEmail(to: string, name: string, token: string) {
  const link = `${await appUrl()}/reset-password?token=${encodeURIComponent(token)}`;
  const from = process.env.EMAIL_FROM || `${APP_NAME} <onboarding@resend.dev>`;

  const text =
    `Halo ${name},\n\n` +
    `Kami menerima permintaan atur ulang kata sandi akun ${APP_NAME} kamu.\n` +
    `Buka link ini untuk membuat kata sandi baru (berlaku ${RESET_TTL_MINUTES} menit):\n\n${link}\n\n` +
    `Kalau kamu tidak meminta ini, abaikan saja email ini — kata sandimu tidak berubah.`;

  const html = `
<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#1b1a17;max-width:480px">
  <p>Halo ${escapeHtml(name)},</p>
  <p>Kami menerima permintaan atur ulang kata sandi akun ${APP_NAME} kamu.</p>
  <p style="margin:24px 0">
    <a href="${escapeHtml(link)}" style="background:#c2410c;color:#fff;padding:12px 20px;border-radius:999px;text-decoration:none;font-weight:bold">
      Buat Kata Sandi Baru
    </a>
  </p>
  <p style="font-size:13px;color:#6b665e">Link berlaku ${RESET_TTL_MINUTES} menit dan hanya bisa dipakai sekali.<br>
  Kalau tombol tidak bisa diklik, salin link ini:<br><span style="word-break:break-all">${escapeHtml(link)}</span></p>
  <p style="font-size:13px;color:#6b665e">Kalau kamu tidak meminta ini, abaikan saja email ini — kata sandimu tidak berubah.</p>
</div>`;

  const res = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject: `Atur ulang kata sandi ${APP_NAME}`, html, text }),
  });
  if (!res.ok) {
    console.error("[reset-email]", res.status, await res.text().catch(() => ""));
    throw new UserError("Email gagal dikirim. Coba lagi nanti atau hubungi admin lewat WhatsApp.");
  }
}

function escapeHtml(s: string) {
  return s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
