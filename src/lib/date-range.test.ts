import { describe, expect, it } from "vitest";
import { cashflowBuckets, parseDateInput, rangeFileSuffix, resolveRange, toISODate, wibParts } from "./date-range";

// 2 Nov 2026 pukul 05.30 WIB = 1 Nov 2026 22.30 UTC — jam rawan selisih zona waktu.
const EARLY_MORNING_WIB = new Date("2026-11-01T22:30:00Z");

describe("zona waktu WIB", () => {
  it("tanggal kalender mengikuti WIB, bukan UTC", () => {
    expect(wibParts(EARLY_MORNING_WIB)).toEqual({ year: 2026, month: 10, day: 2 });
    expect(toISODate(EARLY_MORNING_WIB)).toBe("2026-11-02");
  });

  it("'Hari Ini' dimulai 00.00 WIB", () => {
    const r = resolveRange("today", undefined, undefined, EARLY_MORNING_WIB);
    expect(r.from.toISOString()).toBe("2026-11-01T17:00:00.000Z");
    expect(r.to).toBe(EARLY_MORNING_WIB);
  });

  it("'Bulan Ini' dimulai tanggal 1 pukul 00.00 WIB", () => {
    const r = resolveRange("month", undefined, undefined, EARLY_MORNING_WIB);
    expect(r.from.toISOString()).toBe("2026-10-31T17:00:00.000Z");
  });

  it("input tanggal dibaca sebagai 00.00 WIB", () => {
    expect(parseDateInput("2026-11-02")?.toISOString()).toBe("2026-11-01T17:00:00.000Z");
  });

  it("tanggal tidak valid ditolak", () => {
    expect(parseDateInput("2026-02-31")).toBeNull();
    expect(parseDateInput("kemarin")).toBeNull();
    expect(parseDateInput("")).toBeNull();
    expect(parseDateInput(undefined)).toBeNull();
  });
});

describe("rentang kustom laporan", () => {
  it("sampai akhir hari terakhir (WIB)", () => {
    const r = resolveRange("custom", "2026-10-01", "2026-10-31", EARLY_MORNING_WIB);
    expect(r.key).toBe("custom");
    expect(r.from.toISOString()).toBe("2026-09-30T17:00:00.000Z");
    expect(r.to.toISOString()).toBe("2026-10-31T16:59:59.999Z");
    expect(rangeFileSuffix(r)).toBe("2026-10-01_2026-10-31");
  });

  it("urutan terbalik ditukar", () => {
    const r = resolveRange("custom", "2026-10-31", "2026-10-01", EARLY_MORNING_WIB);
    expect(toISODate(r.from)).toBe("2026-10-01");
  });

  it("input aneh jatuh ke Bulan Ini (tidak error, tidak bisa menyuntik nama file)", () => {
    const r = resolveRange("custom", 'x";\r\nSet-Cookie: a', undefined, EARLY_MORNING_WIB);
    expect(r.key).toBe("month");
    expect(rangeFileSuffix(r)).toBe("month");
  });
});

describe("grafik arus kas", () => {
  it("bulan terakhir = bulan berjalan menurut WIB", () => {
    const { buckets } = cashflowBuckets("month", EARLY_MORNING_WIB);
    expect(buckets).toHaveLength(6);
    expect(toISODate(buckets[5].start)).toBe("2026-11-01");
    expect(toISODate(buckets[0].start)).toBe("2026-06-01");
  });

  it("7 hari terakhir berakhir hari ini", () => {
    const { buckets } = cashflowBuckets("today", EARLY_MORNING_WIB);
    expect(toISODate(buckets[6].start)).toBe("2026-11-02");
  });
});
