"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { flash } from "@/lib/flash";
import { prisma } from "@/lib/prisma";
import { CUSTOMER_TYPES } from "@/lib/labels";
import { type FormState, UserError, run, requireBusiness, oneOf, text, logActivity } from "./_helpers";

function readCustomer(formData: FormData) {
  const d = {
    name: text(formData.get("name")).slice(0, 120),
    phone: text(formData.get("phone")).slice(0, 30),
    email: text(formData.get("email")).slice(0, 120),
    address: text(formData.get("address")).slice(0, 300),
    type: oneOf(formData.get("type"), CUSTOMER_TYPES, "New"),
    notes: text(formData.get("notes")),
  };
  if (!d.name) throw new UserError("Nama pelanggan wajib diisi.");
  return d;
}

/** Satu nomor HP hanya untuk satu pelanggan per usaha (supaya pengingat WA tidak salah orang). */
async function assertPhoneFree(businessId: string, phone: string, exceptId?: string) {
  if (!phone) return;
  const existing = await prisma.customer.findFirst({
    where: { businessId, phone, ...(exceptId ? { id: { not: exceptId } } : {}) },
  });
  if (existing) throw new UserError(`Nomor ini sudah terdaftar atas nama ${existing.name}.`);
}

export async function createCustomer(_prev: FormState, formData: FormData): Promise<FormState> {
  const business = await requireBusiness();
  let newId = "";

  const res = await run(async () => {
    const d = readCustomer(formData);
    await assertPhoneFree(business.id, d.phone);
    const customer = await prisma.customer.create({
      data: {
        businessId: business.id,
        name: d.name,
        phone: d.phone || null,
        email: d.email || null,
        address: d.address || null,
        type: d.type,
        notes: d.notes || null,
      },
    });
    newId = customer.id;
    await logActivity(business.id, "customer.create", `Tambah pelanggan ${d.name}${d.phone ? ` (${d.phone})` : ""}`);
  });

  if (res.error) return res;
  revalidatePath("/customers");
  await flash("Pelanggan ditambahkan");
  redirect(`/customers/${newId}`);
}

export async function updateCustomer(_prev: FormState, formData: FormData): Promise<FormState> {
  const business = await requireBusiness();
  const id = text(formData.get("id"));

  const res = await run(async () => {
    const customer = await prisma.customer.findFirst({ where: { id, businessId: business.id } });
    if (!customer) throw new UserError("Pelanggan tidak ditemukan.");
    const d = readCustomer(formData);
    await assertPhoneFree(business.id, d.phone, customer.id);
    await prisma.customer.update({
      where: { id: customer.id },
      data: {
        name: d.name,
        phone: d.phone || null,
        email: d.email || null,
        address: d.address || null,
        type: d.type,
        notes: d.notes || null,
      },
    });
    await logActivity(business.id, "customer.update", `Ubah data pelanggan ${d.name}`);
  });

  if (res.error) return res;
  revalidatePath("/customers");
  revalidatePath(`/customers/${id}`);
  await flash("Data pelanggan diperbarui");
  redirect(`/customers/${id}`);
}
