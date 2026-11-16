import { prisma } from "@/lib/prisma";

/**
 * Satu sumber kebenaran untuk "tagihan belum lunas", dipakai Beranda, halaman Belum Lunas,
 * dan Laporan (layar + PDF) supaya angkanya selalu sama.
 *
 * Pesanan yang sudah Selesai TIDAK dihitung dari tabel pesanan: sisa tagihannya sudah pindah ke
 * penjualan hasil pesanan itu. Menghitung keduanya membuat tagihan yang sama terhitung dua kali.
 */
export const openOrderWithBalance = (businessId: string) => ({
  businessId,
  remainingPayment: { gt: 0 },
  status: { notIn: ["Completed", "Cancelled"] },
});

export const saleWithBalance = (businessId: string) => ({
  businessId,
  outstandingBalance: { gt: 0 },
});

export type Receivable = {
  id: string;
  kind: "order" | "sale";
  href: string;
  customerName: string | null;
  /** Untuk tautan "Tambah nomor HP" di halaman Belum Lunas (hanya tampilan). */
  customerId: string | null;
  phone: string | null;
  amount: number;
  dueDate: Date | null;
  status: string;
};

export async function loadReceivables(businessId: string): Promise<Receivable[]> {
  const [orders, sales] = await Promise.all([
    prisma.order.findMany({
      where: openOrderWithBalance(businessId),
      include: { customer: true },
      orderBy: [{ dueDate: "asc" }, { date: "desc" }],
    }),
    prisma.sale.findMany({
      where: saleWithBalance(businessId),
      include: { customer: true },
      orderBy: { date: "desc" },
    }),
  ]);

  return [
    ...orders.map((o) => ({
      id: o.id,
      kind: "order" as const,
      href: `/orders/${o.id}`,
      customerName: o.customer?.name ?? null,
      customerId: o.customerId ?? null,
      phone: o.customer?.phone ?? null,
      amount: o.remainingPayment,
      dueDate: o.dueDate,
      status: o.paymentStatus,
    })),
    ...sales.map((s) => ({
      id: s.id,
      kind: "sale" as const,
      href: `/sales/${s.id}`,
      customerName: s.customer?.name ?? null,
      customerId: s.customerId ?? null,
      phone: s.customer?.phone ?? null,
      amount: s.outstandingBalance,
      dueDate: null,
      status: s.paymentStatus,
    })),
  ].sort((a, b) => {
    if (a.dueDate && b.dueDate) return a.dueDate.getTime() - b.dueDate.getTime();
    if (a.dueDate) return -1;
    if (b.dueDate) return 1;
    return 0;
  });
}

/**
 * Sisa tagihan pesanan untuk ditampilkan. Setelah pesanan Selesai, penjualannya yang dipakai —
 * pelunasan dicatat di sana, termasuk untuk data lama sebelum keduanya disinkronkan.
 */
export function orderBalance(order: {
  downPayment: number;
  remainingPayment: number;
  paymentStatus: string;
  sale?: { amountPaid: number; outstandingBalance: number; paymentStatus: string } | null;
}) {
  if (order.sale) {
    return { paid: order.sale.amountPaid, remaining: order.sale.outstandingBalance, status: order.sale.paymentStatus };
  }
  return { paid: order.downPayment, remaining: order.remainingPayment, status: order.paymentStatus };
}
