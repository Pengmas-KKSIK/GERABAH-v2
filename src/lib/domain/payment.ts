/**
 * Aturan uang penjualan & pesanan — murni, tanpa database, diuji di payment.test.ts.
 * Status pembayaran selalu dihitung dari angka, tidak dipercaya mentah dari form.
 */
export type PaymentStatus = "Paid" | "Partially Paid" | "Unpaid";
export const PAYMENT_STATUSES: readonly PaymentStatus[] = ["Paid", "Partially Paid", "Unpaid"];

export function paymentStatusFor(total: number, paid: number): PaymentStatus {
  if (paid >= total) return "Paid";
  return paid > 0 ? "Partially Paid" : "Unpaid";
}

/** Harga satuan efektif: kolom harga kosong/0 berarti pakai harga jual produk. */
export function effectiveUnitPrice(entered: number, sellingPrice: number): number {
  return entered > 0 ? entered : sellingPrice;
}

export type PricedLine = { quantity: number; unitPrice: number };

/** Subtotal, total setelah diskon (diskon tidak boleh melebihi subtotal). */
export function totals(lines: PricedLine[], discount: number) {
  const subtotal = lines.reduce((s, l) => s + l.quantity * l.unitPrice, 0);
  const appliedDiscount = Math.min(Math.max(discount, 0), subtotal);
  return { subtotal, discount: appliedDiscount, total: subtotal - appliedDiscount };
}

/**
 * Pembayaran saat penjualan dicatat. Pilihan "Lunas" / "Belum" di form menentukan jumlah;
 * "Sebagian" memakai jumlah yang diketik, lalu statusnya dihitung ulang dari angka itu.
 */
export function salePayment(total: number, chosen: string, amountTyped: number) {
  const amountPaid =
    chosen === "Paid" ? total : chosen === "Unpaid" ? 0 : Math.min(Math.max(amountTyped, 0), total);
  return {
    amountPaid,
    outstandingBalance: total - amountPaid,
    paymentStatus: paymentStatusFor(total, amountPaid),
  };
}

/** DP pesanan dibatasi maksimal sebesar total. */
export function orderPayment(total: number, downPaymentTyped: number) {
  const downPayment = Math.min(Math.max(downPaymentTyped, 0), total);
  return {
    downPayment,
    remainingPayment: total - downPayment,
    paymentStatus: paymentStatusFor(total, downPayment),
  };
}

/** Total utang satu pelanggan — aturan yang sama dengan loadReceivables (pesanan Selesai tidak dihitung dua kali). */
export function customerOwed(
  sales: { outstandingBalance: number }[],
  orders: { remainingPayment: number; status: string }[],
) {
  const fromSales = sales.reduce((s, x) => s + x.outstandingBalance, 0);
  const fromOpenOrders = orders
    .filter((o) => o.status !== "Completed" && o.status !== "Cancelled")
    .reduce((s, o) => s + o.remainingPayment, 0);
  return fromSales + fromOpenOrders;
}
