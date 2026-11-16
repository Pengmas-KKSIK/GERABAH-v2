/**
 * Semua perhitungan tanggal memakai zona waktu usaha (WIB, UTC+7) — bukan zona waktu server.
 * Server Vercel/VPS biasanya berjalan di UTC; tanpa ini "hari ini" baru dimulai pukul 07.00 WIB
 * dan transaksi dini hari masuk ke tanggal kemarin.
 *
 * Trik: geser waktu +7 jam lalu baca dengan getter UTC → hasilnya angka kalender WIB.
 */
export const BUSINESS_TIME_ZONE = "Asia/Jakarta";
const OFFSET_MS = 7 * 60 * 60 * 1000; // WIB tidak punya musim panas, jadi selisihnya tetap.

type Parts = { year: number; month: number; day: number };

/** Angka kalender WIB dari sebuah waktu (month mulai 0, seperti Date). */
export function wibParts(d: Date): Parts {
  const s = new Date(d.getTime() + OFFSET_MS);
  return { year: s.getUTCFullYear(), month: s.getUTCMonth(), day: s.getUTCDate() };
}

/** Waktu pukul 00.00 WIB pada tanggal kalender tertentu (angka di luar rentang ikut digeser, mis. day 0). */
export function wibDate(year: number, month: number, day: number): Date {
  return new Date(Date.UTC(year, month, day) - OFFSET_MS);
}

export function startOfWibDay(d: Date): Date {
  const p = wibParts(d);
  return wibDate(p.year, p.month, p.day);
}

/** "YYYY-MM-DD" menurut kalender WIB. */
export function toISODate(d: Date): string {
  return new Date(d.getTime() + OFFSET_MS).toISOString().slice(0, 10);
}

export function todayISO(): string {
  return toISODate(new Date());
}

/** Baca "YYYY-MM-DD" dari <input type="date"> sebagai 00.00 WIB. Tidak valid → null. */
export function parseDateInput(value: string | null | undefined): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value ?? "");
  if (!m) return null;
  const [year, month, day] = [Number(m[1]), Number(m[2]) - 1, Number(m[3])];
  const d = wibDate(year, month, day);
  const p = wibParts(d);
  // tolak tanggal mustahil seperti 2026-02-31
  return p.year === year && p.month === month && p.day === day ? d : null;
}

export type RangeKey = "today" | "week" | "month" | "year" | "custom";

/**
 * `customFrom`/`customTo` (format "YYYY-MM-DD") dipakai kalau key === "custom" — rentang tanggal
 * bebas untuk laporan. Input tidak valid jatuh ke "Bulan Ini"; urutan terbalik ditukar.
 */
export function resolveRange(
  key: string | undefined,
  customFrom?: string,
  customTo?: string,
  now: Date = new Date()
): { from: Date; to: Date; label: string; key: RangeKey } {
  const p = wibParts(now);

  if (key === "today") return { from: wibDate(p.year, p.month, p.day), to: now, label: "Hari Ini", key: "today" };
  if (key === "week") return { from: new Date(now.getTime() - 7 * DAY_MS), to: now, label: "7 Hari Terakhir", key: "week" };
  if (key === "year") return { from: wibDate(p.year, 0, 1), to: now, label: "Tahun Ini", key: "year" };

  if (key === "custom") {
    let fromISO = parseDateInput(customFrom) ? customFrom! : null;
    let toISO = parseDateInput(customTo) ? customTo! : fromISO;
    if (fromISO && toISO) {
      if (fromISO > toISO) [fromISO, toISO] = [toISO, fromISO];
      const from = parseDateInput(fromISO)!;
      const to = new Date(parseDateInput(toISO)!.getTime() + DAY_MS - 1); // 23.59.59,999 WIB
      const label = toISO !== fromISO ? `${fromISO} s/d ${toISO}` : fromISO;
      return { from, to, label: `Kustom · ${label}`, key: "custom" };
    }
  }

  return { from: wibDate(p.year, p.month, 1), to: now, label: "Bulan Ini", key: "month" };
}

/** Akhiran nama file unduhan laporan — hanya dari nilai yang sudah divalidasi. */
export function rangeFileSuffix(range: { key: RangeKey; from: Date; to: Date }): string {
  return range.key === "custom" ? `${toISODate(range.from)}_${toISODate(range.to)}` : range.key;
}

export const DAY_MS = 24 * 60 * 60 * 1000;

export function previousRange(from: Date, to: Date): { from: Date; to: Date } {
  const span = to.getTime() - from.getTime();
  return { from: new Date(from.getTime() - span), to: new Date(from.getTime()) };
}

export function daysFromNow(days: number): Date {
  return new Date(Date.now() + days * DAY_MS);
}

export type Bucket = { start: Date; end: Date; label: string; fullLabel: string };

const fmt = (d: Date, opts: Intl.DateTimeFormatOptions) =>
  d.toLocaleDateString("id-ID", { ...opts, timeZone: BUSINESS_TIME_ZONE });

/** Kelompok waktu untuk grafik arus kas, ukurannya mengikuti rentang yang dipilih. */
export function cashflowBuckets(
  rangeKey: string | undefined,
  now: Date = new Date()
): { buckets: Bucket[]; windowLabel: string } {
  const { year, month, day } = wibParts(now);
  const buckets: Bucket[] = [];

  if (rangeKey === "today") {
    for (let i = 6; i >= 0; i--) {
      const start = wibDate(year, month, day - i);
      buckets.push({
        start,
        end: new Date(start.getTime() + DAY_MS),
        label: fmt(start, { weekday: "short" }),
        fullLabel: fmt(start, { weekday: "long", day: "numeric", month: "short" }),
      });
    }
    return { buckets, windowLabel: "7 hari terakhir" };
  }

  if (rangeKey === "week") {
    for (let i = 7; i >= 0; i--) {
      const start = wibDate(year, month, day - i * 7 - 6);
      const last = new Date(start.getTime() + 6 * DAY_MS);
      const s = wibParts(start);
      buckets.push({
        start,
        end: new Date(start.getTime() + 7 * DAY_MS),
        label: `${s.day}/${s.month + 1}`,
        fullLabel: `${s.day}–${wibParts(last).day} ${fmt(last, { month: "short" })}`,
      });
    }
    return { buckets, windowLabel: "8 minggu terakhir" };
  }

  if (rangeKey === "year") {
    for (let i = 4; i >= 0; i--) {
      const y = year - i;
      buckets.push({ start: wibDate(y, 0, 1), end: wibDate(y + 1, 0, 1), label: String(y), fullLabel: `Tahun ${y}` });
    }
    return { buckets, windowLabel: "5 tahun terakhir" };
  }

  for (let i = 5; i >= 0; i--) {
    const start = wibDate(year, month - i, 1);
    const s = wibParts(start);
    buckets.push({
      start,
      end: wibDate(s.year, s.month + 1, 1),
      label: fmt(start, { month: "short" }),
      fullLabel: fmt(start, { month: "long", year: "numeric" }),
    });
  }
  return { buckets, windowLabel: "6 bulan terakhir" };
}
