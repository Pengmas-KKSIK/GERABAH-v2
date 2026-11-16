import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";

const SESSION_COOKIE = "gerabah_session";
const SESSION_DAYS = 30;
const DEV_SECRET = "dev-only-insecure-secret-change-me";

/**
 * Kunci rahasia untuk menandatangani cookie login & link reset kata sandi.
 * Di produksi WAJIB diset lewat env AUTH_SECRET — tanpa itu siapa pun yang membaca kode ini
 * bisa memalsukan login, jadi aplikasi menolak jalan alih-alih diam-diam memakai kunci bawaan.
 */
export function authSecret(purpose = ""): Uint8Array {
  const value = process.env.AUTH_SECRET;
  if (!value || value.length < 16) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("AUTH_SECRET belum diset (minimal 16 karakter). Isi di environment server.");
    }
    return new TextEncoder().encode(`${DEV_SECRET}${purpose}`);
  }
  return new TextEncoder().encode(`${value}${purpose}`);
}

export type SessionPayload = { userId: string };

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string) {
  const token = await new SignJWT({ userId } satisfies SessionPayload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${SESSION_DAYS}d`)
    .sign(authSecret());

  const store = await cookies();
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * SESSION_DAYS,
  });
}

export async function destroySession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/**
 * Isi cookie login (hanya tanda tangan yang dicek, tanpa database).
 * Untuk tahu user-nya masih ada, pakai getSessionContext() di current-user.ts.
 */
export async function getSession(): Promise<SessionPayload | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, authSecret());
    return typeof payload.userId === "string" ? { userId: payload.userId } : null;
  } catch {
    return null;
  }
}
