import type { Prisma } from "@/generated/prisma/client";
import { UserError } from "@/lib/action-state";

type Tx = Prisma.TransactionClient;

const statusFor = (current: string, stock: number) =>
  current === "inactive" ? "inactive" : stock <= 0 ? "out_of_stock" : "active";

/**
 * Kurangi stok di dalam transaksi. Update atomik (`decrement`) mengunci baris produk, jadi dua
 * penjualan bersamaan tidak bisa sama-sama lolos dan membuat stok minus — yang kalah dibatalkan.
 * Produk yang diarsipkan tetap diarsipkan.
 */
export async function takeStock(tx: Tx, productId: string, qty: number) {
  const p = await tx.product.update({ where: { id: productId }, data: { stock: { decrement: qty } } });
  if (p.stock < 0) {
    throw new UserError(`Stok ${p.name} tidak cukup — tersisa ${p.stock + qty}, dibutuhkan ${qty}.`);
  }
  await tx.product.update({ where: { id: productId }, data: { status: statusFor(p.status, p.stock) } });
}

/** Ubah stok (+/−) atau set jumlah pasti; tidak pernah di bawah 0. Mengembalikan stok lama & baru. */
export async function adjustStock(tx: Tx, productId: string, change: { delta: number } | { set: number }) {
  const before = await tx.product.update({
    where: { id: productId },
    data: "set" in change ? { stock: change.set } : { stock: { increment: change.delta } },
  });
  const stock = Math.max(before.stock, 0);
  const after = await tx.product.update({
    where: { id: productId },
    data: { stock, status: statusFor(before.status, stock) },
  });
  const previous = "set" in change ? null : before.stock - change.delta;
  return { previous, product: after };
}

export { statusFor as productStatusForStock };
