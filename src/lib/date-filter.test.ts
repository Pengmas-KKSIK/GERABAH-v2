import { describe, expect, it } from "vitest";
import { dateQuery, datePresets, dateWhere, parseDateFilter, withDate } from "./date-filter";

describe("parseDateFilter", () => {
  it("tanpa parameter → semua tanggal", () => {
    expect(parseDateFilter({})).toEqual({ mode: "all" });
    expect(dateWhere(parseDateFilter({}))).toEqual({});
  });

  it("satu hari tepat: 00.00 sampai 23.59.59 WIB", () => {
    const f = parseDateFilter({ tanggal: "2026-11-10" });
    expect(f.mode).toBe("day");
    if (f.mode === "all") throw new Error();
    expect(f.from.toISOString()).toBe("2026-11-09T17:00:00.000Z");
    expect(f.to.toISOString()).toBe("2026-11-10T16:59:59.999Z");
  });

  it("rentang hari: kedua ujung ikut dihitung", () => {
    const f = parseDateFilter({ dari: "2026-11-01", sampai: "2026-11-10" });
    expect(f.mode).toBe("range");
    if (f.mode === "all") throw new Error();
    expect(f.from.toISOString()).toBe("2026-10-31T17:00:00.000Z");
    expect(f.to.toISOString()).toBe("2026-11-10T16:59:59.999Z");
  });

  it("urutan terbalik ditukar", () => {
    const f = parseDateFilter({ dari: "2026-11-10", sampai: "2026-11-01" });
    if (f.mode === "all") throw new Error();
    expect(f.fromISO).toBe("2026-11-01");
    expect(f.toISO).toBe("2026-11-10");
  });

  it("dari = sampai dianggap satu hari", () => {
    expect(parseDateFilter({ dari: "2026-11-05", sampai: "2026-11-05" }).mode).toBe("day");
  });

  it("salah satu ujung kosong → satu hari dari ujung yang ada", () => {
    const f = parseDateFilter({ dari: "2026-11-05" });
    expect(f.mode).toBe("day");
  });

  it("nilai tidak valid diabaikan", () => {
    expect(parseDateFilter({ tanggal: "kemarin" })).toEqual({ mode: "all" });
    expect(parseDateFilter({ dari: "2026-02-31", sampai: "abc" })).toEqual({ mode: "all" });
  });

  it("tanggal tepat menang atas dari/sampai", () => {
    const f = parseDateFilter({ tanggal: "2026-11-03", dari: "2026-11-01", sampai: "2026-11-10" });
    expect(f.mode).toBe("day");
  });
});

describe("alamat & pintasan", () => {
  it("dateQuery & withDate", () => {
    expect(dateQuery(parseDateFilter({}))).toBe("");
    const day = parseDateFilter({ tanggal: "2026-11-10" });
    const range = parseDateFilter({ dari: "2026-11-01", sampai: "2026-11-10" });
    expect(withDate("/finance", day)).toBe("/finance?tanggal=2026-11-10");
    expect(withDate("/finance", range, "type=INCOME")).toBe("/finance?type=INCOME&dari=2026-11-01&sampai=2026-11-10");
    expect(withDate("/orders", { mode: "all" })).toBe("/orders");
  });

  it("pintasan memakai kalender WIB", () => {
    // 2 Nov 2026 05.30 WIB (masih 1 Nov di UTC)
    const p = datePresets(new Date("2026-11-01T22:30:00Z"));
    expect(p.find((x) => x.key === "today")).toMatchObject({ dari: "2026-11-02", sampai: "2026-11-02" });
    expect(p.find((x) => x.key === "yesterday")).toMatchObject({ dari: "2026-11-01", sampai: "2026-11-01" });
    expect(p.find((x) => x.key === "week")).toMatchObject({ dari: "2026-10-27", sampai: "2026-11-02" });
    expect(p.find((x) => x.key === "month")).toMatchObject({ dari: "2026-11-01", sampai: "2026-11-02" });
  });
});
