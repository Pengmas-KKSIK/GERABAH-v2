/**
 * Pembaca input form yang murni (tanpa database) — semua input dari browser dianggap tidak
 * tepercaya, jadi di sini dirapikan dan dibatasi. Diuji di form-parse.test.ts.
 */
import { parseDateInput, toISODate } from "./date-range";

type Raw = FormDataEntryValue | null | undefined;

export const text = (raw: Raw) => (typeof raw === "string" ? raw.trim() : "");

/** "1.250.000" / "Rp 1.250.000" / "1250000" -> 1250000. Selalu bilangan bulat ≥ 0. */
export function parseAmount(raw: Raw): number {
  const digits = String(raw ?? "").replace(/[^\d]/g, "");
  if (!digits) return 0;
  return Math.min(Number(digits), Number.MAX_SAFE_INTEGER);
}

/** Bilangan bulat dari input angka biasa (stok, jumlah). Desimal dibulatkan ke bawah. */
export function parseIntField(raw: Raw, { min = 0, max = 1_000_000_000 } = {}): number {
  const n = Math.floor(Number(String(raw ?? "").trim()));
  if (!Number.isFinite(n)) return min;
  return Math.min(Math.max(n, min), max);
}

/** Tanggal dari <input type="date">; kosong/tidak valid → `fallback`. */
export function parseDateField(raw: Raw, fallback: Date | null = null): Date | null {
  return parseDateInput(text(raw)) ?? fallback;
}

/**
 * Tanggal transaksi: kalau yang dipilih hari ini, pakai jam sekarang (urutan catatan hari ini
 * tetap benar); tanggal lain → 00.00 WIB; kosong/tidak valid → sekarang.
 */
export function parseTransactionDate(raw: Raw, now: Date = new Date()): Date {
  const d = parseDateInput(text(raw));
  if (!d || toISODate(d) === toISODate(now)) return now;
  return d;
}

/** Ambil nilai hanya kalau ada di daftar yang diizinkan. */
export function oneOf<T extends string>(raw: Raw, allowed: readonly T[], fallback: T): T {
  const v = text(raw);
  return (allowed as readonly string[]).includes(v) ? (v as T) : fallback;
}

function parseJsonArray(raw: Raw): unknown[] {
  try {
    const arr = JSON.parse(String(raw ?? "[]"));
    return Array.isArray(arr) ? arr.slice(0, 200) : [];
  } catch {
    return [];
  }
}

const field = (x: unknown, key: string): unknown =>
  typeof x === "object" && x !== null ? (x as Record<string, unknown>)[key] : undefined;

const wholeNumber = (v: unknown) => Math.max(0, Math.floor(Number(v) || 0));

export type LineItemInput = { productId: string; quantity: number; unitPrice: number };

/** Daftar barang dari field JSON tersembunyi form penjualan/pesanan. */
export function parseItems(raw: Raw): LineItemInput[] {
  return parseJsonArray(raw)
    .map((x) => ({
      productId: String(field(x, "productId") ?? ""),
      quantity: wholeNumber(field(x, "quantity")),
      unitPrice: wholeNumber(field(x, "unitPrice")),
    }))
    .filter((x) => x.productId && x.quantity > 0);
}

/** Jumlahkan kuantitas per produk (produk yang sama bisa muncul di beberapa baris). */
export function sumQtyByProduct(items: { productId: string; quantity: number }[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const it of items) m.set(it.productId, (m.get(it.productId) ?? 0) + it.quantity);
  return m;
}

export type MaterialInput = { name: string; quantity: number; unit: string; unitCost: number };

/** Rincian bahan baku dari field JSON tersembunyi form produk. */
export function parseMaterials(raw: Raw): MaterialInput[] {
  return parseJsonArray(raw)
    .map((x) => ({
      name: String(field(x, "name") ?? "").trim(),
      quantity: Math.max(0, Number(field(x, "quantity")) || 0),
      unit: String(field(x, "unit") ?? "pcs").trim() || "pcs",
      unitCost: Math.max(0, Number(field(x, "unitCost")) || 0),
    }))
    .filter((m) => m.name);
}

export type GiftInput = { productId: string; quantity: number; unitCost: number };

/** Daftar produk gift dari field JSON tersembunyi form workshop. */
export function parseGifts(raw: Raw): GiftInput[] {
  return parseJsonArray(raw)
    .map((x) => ({
      productId: String(field(x, "productId") ?? ""),
      quantity: wholeNumber(field(x, "quantity")),
      unitCost: wholeNumber(field(x, "unitCost")),
    }))
    .filter((x) => x.productId && x.quantity > 0);
}
