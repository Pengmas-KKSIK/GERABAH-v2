"use server";

import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { hashPassword, verifyPassword } from "@/lib/auth";
import { rateLimit } from "@/lib/rate-limit";
import { flash } from "@/lib/flash";
import { newPasswordError } from "@/lib/domain/password";
import { type FormState, UserError, run, requireContext, logActivity } from "./_helpers";

const MINUTE = 60_000;
const str = (v: FormDataEntryValue | null) => (typeof v === "string" ? v : "");

/** Pengguna yang sedang masuk (pemilik maupun staf) mengganti kata sandinya sendiri. */
export async function changeOwnPassword(_prev: FormState, formData: FormData): Promise<FormState> {
  const { user, business } = await requireContext();

  const res = await run(async () => {
    const current = str(formData.get("currentPassword"));
    const password = str(formData.get("password"));
    const confirm = str(formData.get("confirmPassword"));
    if (!current) throw new UserError("Isi kata sandi yang sekarang.");
    await rateLimit("change-password", user.id, 5, 15 * MINUTE);

    const fresh = await prisma.user.findUnique({ where: { id: user.id } });
    if (!fresh || !(await verifyPassword(current, fresh.passwordHash))) {
      throw new UserError("Kata sandi yang sekarang salah.");
    }
    const err = newPasswordError(password, confirm, current);
    if (err) throw new UserError(err);

    await prisma.user.update({ where: { id: user.id }, data: { passwordHash: await hashPassword(password) } });
    await logActivity(business.id, "account.password", "Ganti kata sandi akun sendiri");
  });

  if (res.error) return res;
  await flash("Kata sandi berhasil diganti");
  redirect("/more");
}
