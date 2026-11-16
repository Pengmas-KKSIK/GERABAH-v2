"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { flash } from "@/lib/flash";
import { prisma } from "@/lib/prisma";
import { formatIDRPlain } from "@/lib/format";
import { computeWorkshop } from "@/lib/domain/workshop";
import {
  type FormState,
  UserError,
  run,
  requireBusiness,
  requireContext,
  requireOwner,
  findOrCreateIncomeCategory,
  findOrCreateExpenseCategory,
  parseAmount,
  parseDateField,
  parseGifts,
  parseIntField,
  oneOf,
  text,
  logActivity,
} from "./_helpers";

export async function createWorkshop(_prev: FormState, formData: FormData): Promise<FormState> {
  const business = await requireBusiness();
  let newId = "";

  const res = await run(async () => {
    const organizer = text(formData.get("organizer")).slice(0, 160);
    const participants = parseIntField(formData.get("participants"));
    const operationalCost = parseAmount(formData.get("operationalCost"));
    const profitMode = oneOf(formData.get("profitMode"), ["percent", "nominal"] as const, "percent");
    const profitValue = parseAmount(formData.get("profitValue"));
    const notes = text(formData.get("notes"));
    const gifts = parseGifts(formData.get("gifts"));

    if (!organizer) throw new UserError("Isi nama instansi / penyelenggara.");
    if (gifts.length === 0) throw new UserError("Pilih minimal satu produk untuk suvenir.");

    const ids = [...new Set(gifts.map((g) => g.productId))];
    const found = await prisma.product.count({ where: { id: { in: ids }, businessId: business.id } });
    if (found !== ids.length) throw new UserError("Ada produk yang tidak ditemukan.");

    const c = computeWorkshop(gifts, operationalCost, profitMode, profitValue, participants);
    const ws = await prisma.workshop.create({
      data: {
        businessId: business.id,
        organizer,
        date: parseDateField(formData.get("date")),
        participants,
        operationalCost,
        profitMode,
        profitValue,
        notes: notes || null,
        ...c,
        gifts: { create: gifts },
      },
    });
    newId = ws.id;
    await logActivity(business.id, "workshop.create", `Buat workshop ${organizer} — penawaran ${formatIDRPlain(c.offerPrice)}`);
  });

  if (res.error) return res;
  revalidatePath("/workshop");
  await flash("Workshop tersimpan");
  redirect(`/workshop/${newId}`);
}

/** Mencatat uang masuk ke Keuangan — khusus owner (staf tidak boleh mencatat uang masuk). */
export async function recordWorkshopToFinance(_prev: FormState, formData: FormData): Promise<FormState> {
  const business = await requireOwner();
  const id = text(formData.get("id"));

  const res = await run(async () => {
    const ws = await prisma.workshop.findFirst({ where: { id, businessId: business.id } });
    if (!ws) throw new UserError("Workshop tidak ditemukan.");
    if (ws.status === "recorded") throw new UserError("Workshop ini sudah dicatat ke Keuangan.");

    const [incomeCategoryId, expenseCategoryId] = await Promise.all([
      findOrCreateIncomeCategory(business.id, "Workshop"),
      findOrCreateExpenseCategory(business.id, "Workshop"),
    ]);
    const when = ws.date ?? new Date();

    await prisma.$transaction(async (tx) => {
      // Bersyarat: klik ganda tidak bisa mencatat biaya & pemasukan dua kali.
      const { count } = await tx.workshop.updateMany({
        where: { id: ws.id, status: { not: "recorded" } },
        data: { status: "recorded", recordedAt: new Date() },
      });
      if (count === 0) throw new UserError("Workshop ini sudah dicatat ke Keuangan.");

      const base = { businessId: business.id, date: when, relatedWorkshopId: ws.id };
      if (ws.totalCost > 0) {
        await tx.financialTransaction.create({
          data: { ...base, type: "EXPENSE", expenseCategoryId, description: `Biaya workshop ${ws.organizer}`, amount: ws.totalCost },
        });
      }
      if (ws.offerPrice > 0) {
        await tx.financialTransaction.create({
          data: { ...base, type: "INCOME", incomeCategoryId, description: `Workshop ${ws.organizer}`, amount: ws.offerPrice },
        });
      }
    });
    await logActivity(
      business.id,
      "workshop.record",
      `Catat workshop ${ws.organizer} ke Keuangan — keluar ${formatIDRPlain(ws.totalCost)}, masuk ${formatIDRPlain(ws.offerPrice)}`
    );
  });

  if (res.error) return res;
  revalidatePath(`/workshop/${id}`);
  revalidatePath("/workshop");
  revalidatePath("/finance");
  revalidatePath("/dashboard");
  return { ok: true };
}

export async function deleteWorkshop(_prev: FormState, formData: FormData): Promise<FormState> {
  const { business, role } = await requireContext();
  const id = text(formData.get("id"));

  const res = await run(async () => {
    const ws = await prisma.workshop.findFirst({ where: { id, businessId: business.id } });
    if (!ws) throw new UserError("Workshop tidak ditemukan.");
    if (ws.status === "recorded" && role === "staff") {
      throw new UserError("Workshop ini sudah tercatat di Keuangan — hanya pemilik yang bisa menghapusnya.");
    }

    await prisma.$transaction(async (tx) => {
      // hapus juga catatan keuangan yang tertaut (kalau sudah dicatat)
      await tx.financialTransaction.deleteMany({ where: { relatedWorkshopId: ws.id } });
      await tx.workshop.delete({ where: { id: ws.id } }); // gift ikut terhapus (cascade)
    });
    await logActivity(business.id, "workshop.delete", `Hapus workshop ${ws.organizer}`);
  });

  if (res.error) return res;
  revalidatePath("/workshop");
  revalidatePath("/finance");
  revalidatePath("/dashboard");
  await flash("Workshop dihapus");
  redirect("/workshop");
}
