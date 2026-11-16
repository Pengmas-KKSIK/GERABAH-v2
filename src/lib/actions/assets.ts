"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { formatIDRPlain } from "@/lib/format";
import { fixedCostPeriodLabel } from "@/lib/labels";
import { wibDate, wibParts } from "@/lib/date-range";
import {
  type FormState,
  UserError,
  run,
  requireOwner,
  findOrCreateFixedCostCategory,
  parseAmount,
  parseDateField,
  parseIntField,
  oneOf,
  text,
  logActivity,
} from "./_helpers";

const PERIODS = ["monthly", "yearly", "one_time"] as const;

/** Tambah bulan menurut kalender WIB; tanggal 31 di bulan pendek jadi akhir bulan itu. */
function addMonths(date: Date, months: number) {
  const p = wibParts(date);
  const lastDay = wibParts(wibDate(p.year, p.month + months + 1, 0)).day;
  return wibDate(p.year, p.month + months, Math.min(p.day, lastDay));
}

export async function createAsset(_prev: FormState, formData: FormData): Promise<FormState> {
  const business = await requireOwner();

  const res = await run(async () => {
    const name = text(formData.get("name")).slice(0, 120);
    // Pilihan di form hanya saran (ASSET_CATEGORIES); kategori sendiri boleh diketik.
    const category = text(formData.get("category")).slice(0, 60) || "Lainnya";
    const purchaseValue = parseAmount(formData.get("purchaseValue"));
    const note = text(formData.get("note"));

    if (!name) throw new UserError("Nama aset wajib diisi.");
    if (purchaseValue <= 0) throw new UserError("Isi nilai/harga asetnya dulu.");

    await prisma.asset.create({
      data: {
        businessId: business.id,
        name,
        category,
        purchaseValue,
        purchaseDate: parseDateField(formData.get("purchaseDate")),
        note: note || null,
      },
    });
    await logActivity(business.id, "asset.create", `Tambah aset ${name} (${formatIDRPlain(purchaseValue)})`);
  });

  if (res.error) return res;
  revalidatePath("/assets");
  return { ok: true };
}

export async function deleteAsset(_prev: FormState, formData: FormData): Promise<FormState> {
  const business = await requireOwner();
  const id = text(formData.get("id"));

  const res = await run(async () => {
    const asset = await prisma.asset.findFirst({ where: { id, businessId: business.id } });
    if (!asset) throw new UserError("Aset tidak ditemukan.");
    await prisma.asset.delete({ where: { id: asset.id } });
    await logActivity(business.id, "asset.delete", `Hapus aset ${asset.name}`);
  });

  if (res.error) return res;
  revalidatePath("/assets");
  return { ok: true };
}

export async function createFixedCost(_prev: FormState, formData: FormData): Promise<FormState> {
  const business = await requireOwner();

  const res = await run(async () => {
    const name = text(formData.get("name")).slice(0, 120);
    const amount = parseAmount(formData.get("amount"));
    const rawPeriod = text(formData.get("period")) || "monthly";
    const durationMonths = parseIntField(formData.get("durationMonths"), { max: 600 }) || null;
    const note = text(formData.get("note"));

    if (!name) throw new UserError("Nama biaya wajib diisi.");
    if (amount <= 0) throw new UserError("Isi jumlah biayanya dulu.");
    if (!(PERIODS as readonly string[]).includes(rawPeriod)) throw new UserError("Periode tidak valid.");
    const period = oneOf(rawPeriod, PERIODS, "monthly");

    const startDate = parseDateField(formData.get("startDate"), new Date())!;
    const categoryId = await findOrCreateFixedCostCategory(business.id, text(formData.get("category")));

    await prisma.fixedCost.create({
      data: {
        businessId: business.id,
        name,
        categoryId,
        amount,
        period,
        startDate,
        endDate: durationMonths ? addMonths(startDate, durationMonths) : null,
        durationMonths,
        note: note || null,
      },
    });
    await logActivity(
      business.id,
      "fixedcost.create",
      `Tambah biaya tetap ${name} (${formatIDRPlain(amount)} · ${fixedCostPeriodLabel(period).toLowerCase()})`
    );
  });

  if (res.error) return res;
  revalidatePath("/assets");
  return { ok: true };
}

export async function toggleFixedCostActive(_prev: FormState, formData: FormData): Promise<FormState> {
  const business = await requireOwner();
  const id = text(formData.get("id"));

  const res = await run(async () => {
    const fc = await prisma.fixedCost.findFirst({ where: { id, businessId: business.id } });
    if (!fc) throw new UserError("Biaya tetap tidak ditemukan.");
    await prisma.fixedCost.update({ where: { id: fc.id }, data: { active: !fc.active } });
    await logActivity(business.id, "fixedcost.toggle", `${fc.active ? "Nonaktifkan" : "Aktifkan"} biaya tetap ${fc.name}`);
  });

  if (res.error) return res;
  revalidatePath("/assets");
  return { ok: true };
}

export async function deleteFixedCost(_prev: FormState, formData: FormData): Promise<FormState> {
  const business = await requireOwner();
  const id = text(formData.get("id"));

  const res = await run(async () => {
    const fc = await prisma.fixedCost.findFirst({ where: { id, businessId: business.id } });
    if (!fc) throw new UserError("Biaya tetap tidak ditemukan.");
    await prisma.fixedCost.delete({ where: { id: fc.id } });
    await logActivity(business.id, "fixedcost.delete", `Hapus biaya tetap ${fc.name}`);
  });

  if (res.error) return res;
  revalidatePath("/assets");
  return { ok: true };
}
