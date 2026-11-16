"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { flash } from "@/lib/flash";
import { prisma } from "@/lib/prisma";
import { getSessionContext } from "@/lib/current-user";
import { seedBusinessDefaults } from "@/lib/seed-defaults";
import { type FormState, UserError, run, requireOwner, text } from "./_helpers";

function readBusiness(formData: FormData) {
  const name = text(formData.get("name")).slice(0, 120);
  if (!name) throw new UserError("Isi nama usahanya dulu.");
  return {
    name,
    location: text(formData.get("location")).slice(0, 200) || null,
    description: text(formData.get("description")).slice(0, 500) || null,
  };
}

export async function createBusiness(_prev: FormState, formData: FormData): Promise<FormState> {
  const ctx = await getSessionContext();
  if (!ctx) redirect("/login");
  if (ctx.user.memberOfBusinessId) redirect("/dashboard"); // staf tidak membuat usaha sendiri

  const res = await run(async () => {
    const data = readBusiness(formData);
    const business = ctx.business ?? (await prisma.business.create({ data: { ownerId: ctx.user.id, ...data } }));
    // idempotent — aman diulang kalau langkah ini gagal separuh jalan
    await seedBusinessDefaults(business.id);
  });

  if (res.error) return res;
  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function updateBusiness(_prev: FormState, formData: FormData): Promise<FormState> {
  const business = await requireOwner();

  const res = await run(async () => {
    await prisma.business.update({ where: { id: business.id }, data: readBusiness(formData) });
  });

  if (res.error) return res;
  revalidatePath("/settings");
  revalidatePath("/dashboard");
  await flash("Data usaha disimpan");
  redirect("/settings");
}
