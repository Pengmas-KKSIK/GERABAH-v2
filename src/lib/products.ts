import { prisma } from "@/lib/prisma";

/**
 * Produk yang pernah dipakai di penjualan, pesanan, atau workshop tidak boleh dihapus permanen
 * (catatan lama akan rusak) — cukup diarsipkan.
 */
export async function productHasHistory(productId: string) {
  const [sales, orders, gifts] = await Promise.all([
    prisma.saleItem.count({ where: { productId } }),
    prisma.orderItem.count({ where: { productId } }),
    prisma.workshopGift.count({ where: { productId } }),
  ]);
  return sales + orders + gifts > 0;
}
