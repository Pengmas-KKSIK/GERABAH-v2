export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  Paid: "Lunas",
  Unpaid: "Belum Lunas",
  "Partially Paid": "Dibayar Sebagian",
  Cancelled: "Dibatalkan",
};

export const ORDER_STATUS_LABEL: Record<string, string> = {
  New: "Baru",
  Confirmed: "Dikonfirmasi",
  Processing: "Diproses",
  Ready: "Siap Diambil",
  Completed: "Selesai",
  Cancelled: "Dibatalkan",
};

export { ORDER_STATUS_FLOW } from "@/lib/domain/order-status";

export function paymentStatusLabel(status: string): string {
  return PAYMENT_STATUS_LABEL[status] ?? status;
}

export function orderStatusLabel(status: string): string {
  return ORDER_STATUS_LABEL[status] ?? status;
}

export const CUSTOMER_TYPE_LABEL: Record<string, string> = {
  New: "Baru",
  Returning: "Pelanggan Tetap",
  Reseller: "Reseller",
  Wholesale: "Grosir",
  Other: "Lainnya",
};

export const CUSTOMER_TYPES = ["New", "Returning", "Reseller", "Wholesale", "Other"] as const;

export function customerTypeLabel(type: string): string {
  return CUSTOMER_TYPE_LABEL[type] ?? type;
}

export const COST_LABEL: Record<string, string> = {
  "Material Cost": "Bahan Baku",
  "Labor Cost": "Tenaga Kerja",
  "Packaging Cost": "Kemasan",
  "Other Cost": "Lain-lain",
};

export function costLabel(label: string): string {
  return COST_LABEL[label] ?? label;
}

export const FIXED_COST_PERIOD_LABEL: Record<string, string> = {
  monthly: "Bulanan",
  yearly: "Tahunan",
  one_time: "Sekali Bayar",
};

export function fixedCostPeriodLabel(period: string): string {
  return FIXED_COST_PERIOD_LABEL[period] ?? period;
}

export const ASSET_CATEGORIES = ["Alat Produksi", "Kendaraan", "Bangunan", "Elektronik", "Lainnya"] as const;

export type StatusTone = "good" | "warn" | "bad" | "clay" | "neutral" | "info";

export function paymentStatusTone(status: string): StatusTone {
  if (status === "Paid") return "good";
  if (status === "Partially Paid") return "warn";
  if (status === "Cancelled") return "neutral";
  return "clay";
}

export function orderStatusTone(status: string): StatusTone {
  if (status === "Completed" || status === "Ready") return "good";
  if (status === "Cancelled" || status === "New") return "neutral";
  if (status === "Confirmed") return "info";
  return "warn";
}
