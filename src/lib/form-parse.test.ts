import { describe, expect, it } from "vitest";
import {
  oneOf,
  parseAmount,
  parseGifts,
  parseIntField,
  parseItems,
  parseMaterials,
  parseTransactionDate,
  sumQtyByProduct,
} from "./form-parse";
import { toISODate } from "./date-range";

describe("parseAmount", () => {
  it("membaca format rupiah", () => {
    expect(parseAmount("1.250.000")).toBe(1_250_000);
    expect(parseAmount("Rp 75.000")).toBe(75_000);
    expect(parseAmount("")).toBe(0);
    expect(parseAmount(null)).toBe(0);
  });
  it("tidak pernah minus", () => {
    expect(parseAmount("-5000")).toBe(5000);
  });
});

describe("parseIntField", () => {
  it("bilangan bulat dalam batas", () => {
    expect(parseIntField("12")).toBe(12);
    expect(parseIntField("1.9")).toBe(1);
    expect(parseIntField("-3")).toBe(0);
    expect(parseIntField("abc")).toBe(0);
    expect(parseIntField("-3", { min: -10 })).toBe(-3);
    expect(parseIntField("99999999999")).toBe(1_000_000_000);
  });
});

describe("parseItems", () => {
  it("membuang baris rusak dan membulatkan angka", () => {
    const raw = JSON.stringify([
      { productId: "a", quantity: 2.7, unitPrice: 1000.5 },
      { productId: "", quantity: 1 },
      { productId: "b", quantity: 0 },
      { productId: "c", quantity: -4 },
      null,
    ]);
    expect(parseItems(raw)).toEqual([{ productId: "a", quantity: 2, unitPrice: 1000 }]);
  });
  it("JSON rusak → daftar kosong", () => {
    expect(parseItems("{oops")).toEqual([]);
    expect(parseItems('{"a":1}')).toEqual([]);
  });
  it("jumlah per produk", () => {
    const m = sumQtyByProduct([
      { productId: "a", quantity: 2 },
      { productId: "a", quantity: 3 },
      { productId: "b", quantity: 1 },
    ]);
    expect([...m]).toEqual([
      ["a", 5],
      ["b", 1],
    ]);
  });
});

describe("parseMaterials & parseGifts", () => {
  it("bahan baku", () => {
    expect(parseMaterials(JSON.stringify([{ name: " Tanah liat ", quantity: 1.5, unitCost: 2000 }, { name: "" }]))).toEqual([
      { name: "Tanah liat", quantity: 1.5, unit: "pcs", unitCost: 2000 },
    ]);
  });
  it("gift workshop", () => {
    expect(parseGifts(JSON.stringify([{ productId: "p", quantity: 3, unitCost: 5000 }]))).toEqual([
      { productId: "p", quantity: 3, unitCost: 5000 },
    ]);
  });
});

describe("parseTransactionDate", () => {
  const now = new Date("2026-11-02T03:00:00Z"); // 10.00 WIB
  it("hari ini memakai jam sekarang", () => {
    expect(parseTransactionDate("2026-11-02", now)).toBe(now);
  });
  it("tanggal lain jadi 00.00 WIB", () => {
    expect(toISODate(parseTransactionDate("2026-10-15", now))).toBe("2026-10-15");
  });
  it("kosong / rusak → sekarang", () => {
    expect(parseTransactionDate("", now)).toBe(now);
    expect(parseTransactionDate("31/10/2026", now)).toBe(now);
  });
});

describe("oneOf", () => {
  it("hanya nilai yang diizinkan", () => {
    expect(oneOf("Reseller", ["New", "Reseller"] as const, "New")).toBe("Reseller");
    expect(oneOf("<script>", ["New", "Reseller"] as const, "New")).toBe("New");
  });
});
