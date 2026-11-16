import { DAY_MS, parseDateInput, wibDate, wibParts, toISODate } from "./date-range";

/**
 * Filter tanggal untuk halaman daftar (Penjualan, Pesanan, Keuangan).
 *
 * Alamat halaman memakai dua bentuk, supaya mudah dibaca dan bisa dibagikan:
 *   ?tanggal=2026-11-10                  → satu hari tepat
 *   ?dari=2026-11-01&sampai=2026-11-10   → rentang hari (kedua ujung ikut dihitung)
 * Tanpa keduanya → semua tanggal. Nilai yang tidak valid diabaikan (dianggap tanpa filter).
 */
export type DateFilterParams = {
  tanggal?: string | string[];
  dari?: string | string[];
  sampai?: string | string[];
};

export type DateFilter =
  | { mode: "all" }
  | { mode: "day" | "range"; fromISO: string; toISO: string; from: Date; to: Date; label: string };

const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);

export function parseDateFilter(params: DateFilterParams): DateFilter {
  const day = first(params.tanggal);
  if (parseDateInput(day)) return build("day", day!, day!);

  const dari = first(params.dari);
  const sampai = first(params.sampai);
  const okFrom = parseDateInput(dari) ? dari! : null;
  const okTo = parseDateInput(sampai) ? sampai! : null;
  // Salah satu ujung kosong → pakai ujung yang ada sebagai satu hari.
  const a = okFrom ?? okTo;
  const b = okTo ?? okFrom;
  if (!a || !b) return { mode: "all" };
  const [fromISO, toISO] = a <= b ? [a, b] : [b, a]; // urutan terbalik ditukar
  return build(fromISO === toISO ? "day" : "range", fromISO, toISO);
}

function build(mode: "day" | "range", fromISO: string, toISO: string): DateFilter {
  const from = parseDateInput(fromISO)!;
  const to = new Date(parseDateInput(toISO)!.getTime() + DAY_MS - 1); // 23.59.59,999 WIB
  const label = mode === "day" ? longDate(fromISO) : `${longDate(fromISO)} – ${longDate(toISO)}`;
  return { mode, fromISO, toISO, from, to, label };
}

function longDate(iso: string): string {
  return parseDateInput(iso)!.toLocaleDateString("id-ID", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
}

/** Potongan `where` Prisma untuk kolom tanggal; kosong bila tanpa filter. */
export function dateWhere(filter: DateFilter): { date?: { gte: Date; lte: Date } } {
  return filter.mode === "all" ? {} : { date: { gte: filter.from, lte: filter.to } };
}

/** Pintasan cepat yang paling sering dipakai: mengembalikan nilai dari/sampai (ISO). */
export function datePresets(now: Date = new Date()): { key: string; label: string; dari: string; sampai: string }[] {
  const p = wibParts(now);
  const iso = (y: number, m: number, d: number) => toISODate(wibDate(y, m, d));
  const today = toISODate(now);
  return [
    { key: "today", label: "Hari ini", dari: today, sampai: today },
    { key: "yesterday", label: "Kemarin", dari: iso(p.year, p.month, p.day - 1), sampai: iso(p.year, p.month, p.day - 1) },
    { key: "week", label: "7 hari terakhir", dari: iso(p.year, p.month, p.day - 6), sampai: today },
    { key: "month", label: "Bulan ini", dari: iso(p.year, p.month, 1), sampai: today },
  ];
}

/** Query string filter aktif ("tanggal=…" atau "dari=…&sampai=…"), agar tab lain tidak menghilangkannya. */
export function dateQuery(filter: DateFilter): string {
  if (filter.mode === "all") return "";
  return filter.mode === "day" ? `tanggal=${filter.fromISO}` : `dari=${filter.fromISO}&sampai=${filter.toISO}`;
}

/** Gabungkan path + parameter tab + filter tanggal menjadi satu alamat. */
export function withDate(path: string, filter: DateFilter, ...params: string[]): string {
  const qs = [...params, dateQuery(filter)].filter(Boolean).join("&");
  return qs ? `${path}?${qs}` : path;
}
