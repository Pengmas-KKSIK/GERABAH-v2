"use server";

import { redirect } from "next/navigation";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword, createSession, destroySession } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import {
  createResetToken,
  emailResetEnabled,
  RESET_TTL_MINUTES,
  sendResetEmail,
  verifyResetToken,
} from "@/lib/password-reset";
import { type FormState, UserError, run } from "./_helpers";

const MINUTE = 60_000;

const email = z.string().trim().toLowerCase().email("Email tidak valid.").max(120);
const newPassword = z.string().min(8, "Kata sandi minimal 8 karakter.").max(72, "Kata sandi maksimal 72 karakter.");

/** Baca form dengan skema zod; pesan error pertama ditampilkan ke pengguna. */
function parse<T>(schema: z.ZodType<T>, data: unknown): T {
  const parsed = schema.safeParse(data);
  if (!parsed.success) throw new UserError(parsed.error.issues[0]?.message ?? "Data tidak valid.");
  return parsed.data;
}

const withConfirm = <T extends { password: string; confirmPassword: string }>(schema: z.ZodType<T>) =>
  schema.refine((d) => d.password === d.confirmPassword, {
    message: "Konfirmasi kata sandi tidak sama.",
    path: ["confirmPassword"],
  });

const signupSchema = withConfirm(
  z.object({
    name: z.string().trim().min(1, "Isi namamu.").max(120),
    email,
    phone: z.string().trim().max(30).optional(),
    password: newPassword,
    confirmPassword: z.string().min(1, "Ulangi kata sandinya."),
  })
);

/** Ke mana user diarahkan setelah masuk: punya/terhubung ke usaha → Beranda, belum → pendaftaran usaha. */
async function landingFor(user: { id: string; memberOfBusinessId: string | null }) {
  if (user.memberOfBusinessId) return "/dashboard";
  const owned = await prisma.business.findFirst({ where: { ownerId: user.id }, select: { id: true } });
  return owned ? "/dashboard" : "/onboarding";
}

export async function signup(_prev: FormState, formData: FormData): Promise<FormState> {
  const res = await run(async () => {
    await rateLimit("signup", "", 10, 60 * MINUTE);
    const { name, email, phone, password } = parse(signupSchema, {
      name: formData.get("name"),
      email: formData.get("email"),
      phone: formData.get("phone") ?? undefined,
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    });
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) throw new UserError("Email ini sudah terdaftar. Coba masuk.");

    const user = await prisma.user.create({
      data: { name, email, phone: phone || null, passwordHash: await hashPassword(password) },
    });
    await createSession(user.id);
  });

  if (res.error) return res;
  redirect("/onboarding");
}

const loginSchema = z.object({ email, password: z.string().min(1, "Isi kata sandi.").max(200) });

export async function login(_prev: FormState, formData: FormData): Promise<FormState> {
  let target = "/dashboard";

  const res = await run(async () => {
    const data = parse(loginSchema, { email: formData.get("email"), password: formData.get("password") });
    await rateLimit("login", data.email, 10, 15 * MINUTE);

    const user = await prisma.user.findUnique({ where: { email: data.email } });
    if (!user || !(await verifyPassword(data.password, user.passwordHash))) {
      throw new UserError("Email atau kata sandi salah.");
    }
    await createSession(user.id);
    target = await landingFor(user);
  });

  if (res.error) return res;
  redirect(target);
}

export async function requestPasswordReset(_prev: FormState, formData: FormData): Promise<FormState> {
  const res = await run(async () => {
    if (!emailResetEnabled()) throw new UserError("Atur ulang lewat email belum diaktifkan. Hubungi admin lewat WhatsApp.");
    const address = parse(email, formData.get("email"));
    await rateLimit("reset", address, 3, 15 * MINUTE);

    const user = await prisma.user.findUnique({ where: { email: address } });
    // Jangan bocorkan apakah email terdaftar: pesan sukses tetap sama.
    if (user) await sendResetEmail(user.email, user.name, await createResetToken(user));
  });

  if (res.error) return res;
  return {
    ok: true,
    message: `Kalau email itu terdaftar, link atur ulang sudah dikirim. Cek kotak masuk & folder Spam — berlaku ${RESET_TTL_MINUTES} menit.`,
  };
}

const resetSchema = withConfirm(
  z.object({
    token: z.string().min(1, "Link tidak valid.").max(2000),
    password: newPassword,
    confirmPassword: z.string().min(1, "Ulangi kata sandinya."),
  })
);

export async function resetPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  let target = "/dashboard";

  const res = await run(async () => {
    const data = parse(resetSchema, {
      token: formData.get("token"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    });
    const userId = await verifyResetToken(data.token, (id) => prisma.user.findUnique({ where: { id } }));
    if (!userId) throw new UserError("Link sudah kedaluwarsa atau sudah dipakai. Minta link baru.");

    const user = await prisma.user.update({
      where: { id: userId },
      data: { passwordHash: await hashPassword(data.password) },
    });
    await createSession(user.id);
    target = await landingFor(user);
  });

  if (res.error) return res;
  redirect(target);
}

export async function logout() {
  await destroySession();
  redirect("/login");
}
