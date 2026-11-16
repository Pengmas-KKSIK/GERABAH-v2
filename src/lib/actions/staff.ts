"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/auth";
import { type FormState, UserError, run, requireOwner, text, logActivity } from "./_helpers";

const staffSchema = z
  .object({
    name: z.string().trim().min(1, "Isi nama staf.").max(120),
    email: z.string().trim().toLowerCase().email("Email tidak valid.").max(120),
    password: z.string().min(8, "Kata sandi minimal 8 karakter.").max(72, "Kata sandi maksimal 72 karakter."),
    confirmPassword: z.string().min(1, "Ulangi kata sandinya."),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: "Konfirmasi kata sandi tidak sama.",
    path: ["confirmPassword"],
  });

export async function addStaff(_prev: FormState, formData: FormData): Promise<FormState> {
  const business = await requireOwner();

  const res = await run(async () => {
    const parsed = staffSchema.safeParse({
      name: formData.get("name"),
      email: formData.get("email"),
      password: formData.get("password"),
      confirmPassword: formData.get("confirmPassword"),
    });
    if (!parsed.success) throw new UserError(parsed.error.issues[0]?.message ?? "Data tidak valid.");

    const existing = await prisma.user.findUnique({ where: { email: parsed.data.email } });
    if (existing) throw new UserError("Email ini sudah terpakai. Pakai email lain.");

    await prisma.user.create({
      data: {
        name: parsed.data.name,
        email: parsed.data.email,
        passwordHash: await hashPassword(parsed.data.password),
        role: "staff",
        memberOfBusinessId: business.id,
      },
    });
    await logActivity(business.id, "staff.add", `Tambah akun staf ${parsed.data.name} (${parsed.data.email})`);
  });

  if (res.error) return res;
  revalidatePath("/settings");
  return { ok: true, message: "Akun staf dibuat. Beri tahu mereka email dan kata sandinya." };
}

export async function removeStaff(_prev: FormState, formData: FormData): Promise<FormState> {
  const business = await requireOwner();
  const id = text(formData.get("id"));

  const res = await run(async () => {
    const staff = await prisma.user.findFirst({ where: { id, memberOfBusinessId: business.id } });
    if (!staff) throw new UserError("Staf tidak ditemukan.");
    await prisma.user.delete({ where: { id: staff.id } });
    await logActivity(business.id, "staff.remove", `Hapus akun staf ${staff.name}`);
  });

  if (res.error) return res;
  revalidatePath("/settings");
  return { ok: true };
}
