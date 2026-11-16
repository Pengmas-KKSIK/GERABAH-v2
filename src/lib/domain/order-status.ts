/** Alur status pesanan — murni, diuji di order-status.test.ts. */
export const ORDER_STATUS_FLOW = ["New", "Confirmed", "Processing", "Ready", "Completed"] as const;
export type OrderStatus = (typeof ORDER_STATUS_FLOW)[number] | "Cancelled";

export const isOrderOpen = (status: string) => status !== "Completed" && status !== "Cancelled";

/** Langkah berikutnya dalam alur, atau null kalau sudah di akhir / dibatalkan. */
export function nextOrderStatus(current: string): OrderStatus | null {
  const i = ORDER_STATUS_FLOW.indexOf(current as (typeof ORDER_STATUS_FLOW)[number]);
  return i >= 0 && i < ORDER_STATUS_FLOW.length - 1 ? ORDER_STATUS_FLOW[i + 1] : null;
}

/**
 * Pesanan hanya boleh maju dalam alur atau dibatalkan selama masih terbuka.
 * Pesanan Selesai/Dibatalkan sudah final (mencegah stok berkurang dua kali, dsb.).
 */
export function canChangeOrderStatus(current: string, next: string): boolean {
  if (!isOrderOpen(current)) return false;
  if (next === "Cancelled") return true;
  const from = ORDER_STATUS_FLOW.indexOf(current as (typeof ORDER_STATUS_FLOW)[number]);
  const to = ORDER_STATUS_FLOW.indexOf(next as (typeof ORDER_STATUS_FLOW)[number]);
  return from >= 0 && to > from;
}
