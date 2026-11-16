import type { PrismaClient } from "@/generated/prisma/client";

/**
 * Urutan hapus semua data milik usaha — dipakai scripts/reset-account.ts dan scripts/reset-data.ts.
 * Anak dihapus sebelum induk, karena SaleItem/OrderItem/WorkshopGift menunjuk Product tanpa cascade.
 *
 * Setiap tabel baru yang punya `businessId` (atau menunjuk Product/Sale/Order/Workshop) WAJIB
 * ditambahkan di sini. wipe-business.test.ts membaca schema.prisma dan gagal kalau ada yang terlewat.
 */
export const WIPE_ORDER = [
  "payment",
  "financialTransaction",
  "saleItem",
  "orderItem",
  "sale",
  "order",
  "workshopGift",
  "workshop",
  "productChangeRequest",
  "productCostComponent",
  "productMaterial",
  "product",
  "customer",
  "fixedCost",
  "fixedCostCategory",
  "asset",
  "activityLog",
  "productOtherCostCategory",
  "productCategory",
  "expenseCategory",
  "incomeCategory",
  "salesChannel",
  "paymentMethod",
] as const;

export type WipeModel = (typeof WIPE_ORDER)[number];

/** Tabel anak yang tidak punya businessId: disaring lewat induknya. */
const VIA_PARENT: Partial<Record<WipeModel, "sale" | "order" | "workshop" | "product">> = {
  saleItem: "sale",
  orderItem: "order",
  workshopGift: "workshop",
  productCostComponent: "product",
  productMaterial: "product",
};

/** Filter `where` untuk satu tabel. Tanpa businessIds = semua baris (reset total). */
export function wipeFilter(model: WipeModel, businessIds?: string[]) {
  if (!businessIds) return undefined;
  const inBiz = { businessId: { in: businessIds } };
  const parent = VIA_PARENT[model];
  return parent ? { [parent]: inBiz } : inBiz;
}

type DeleteManyDelegate = { deleteMany(args?: { where?: unknown }): Promise<{ count: number }> };

/**
 * Hapus data usaha tertentu (atau semua usaha kalau businessIds tidak diisi), berurutan.
 * Usaha (Business) dan akun (User) TIDAK ikut dihapus — itu urusan pemanggil.
 */
export async function wipeBusinessData(prisma: PrismaClient, businessIds?: string[]) {
  const counts: Partial<Record<WipeModel, number>> = {};
  for (const model of WIPE_ORDER) {
    const delegate = (prisma as unknown as Record<WipeModel, DeleteManyDelegate>)[model];
    const res = await delegate.deleteMany({ where: wipeFilter(model, businessIds) });
    counts[model] = res.count;
  }
  return counts;
}
