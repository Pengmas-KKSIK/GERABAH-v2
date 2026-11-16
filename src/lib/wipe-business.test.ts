import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { WIPE_ORDER, wipeFilter } from "./wipe-business";

// Baca schema.prisma: model mana yang punya businessId, dan model mana menunjuk model lain.
const schema = readFileSync(new URL("../../prisma/schema.prisma", import.meta.url), "utf8").replace(/\r/g, "");
const models = new Map<string, string>();
for (const m of schema.matchAll(/^model (\w+) \{\n([\s\S]*?)^\}/gm)) models.set(m[1], m[2]);
const delegate = (name: string) => name[0].toLowerCase() + name.slice(1);
/** Relasi wajib/opsional ke model lain yang ditulis di model `name` (field dengan @relation(fields: ...)). */
const refs = (name: string) =>
  [...models.get(name)!.matchAll(/^\s+\w+\s+(\w+)\??\s+@relation\([^)]*fields:/gm)].map((r) => r[1]);

describe("WIPE_ORDER", () => {
  it("mencakup semua tabel yang punya businessId (kecuali Business sendiri)", () => {
    const scoped = [...models].filter(([n, body]) => n !== "Business" && /^\s+businessId\s+String/m.test(body)).map(([n]) => delegate(n));
    expect(scoped.filter((m) => !(WIPE_ORDER as readonly string[]).includes(m))).toEqual([]);
  });

  it("mencakup semua tabel anak dari tabel yang dihapus", () => {
    const wiped = new Set<string>(WIPE_ORDER);
    const missing = [...models.keys()].filter(
      (n) => !wiped.has(delegate(n)) && n !== "Business" && n !== "User" && refs(n).some((r) => wiped.has(delegate(r))),
    );
    expect(missing).toEqual([]);
  });

  it("anak selalu dihapus sebelum induk yang ditunjuknya", () => {
    const pos = new Map<string, number>(WIPE_ORDER.map((m, i) => [m, i]));
    for (const [name] of models) {
      const self = pos.get(delegate(name));
      if (self == null) continue;
      for (const parent of refs(name)) {
        const p = pos.get(delegate(parent));
        if (p != null && p !== self) expect(self, `${name} harus sebelum ${parent}`).toBeLessThan(p);
      }
    }
  });
});

describe("wipeFilter", () => {
  it("tanpa businessIds berarti semua baris", () => {
    expect(wipeFilter("sale")).toBeUndefined();
  });
  it("tabel ber-businessId disaring langsung, tabel anak lewat induk", () => {
    expect(wipeFilter("sale", ["b1"])).toEqual({ businessId: { in: ["b1"] } });
    expect(wipeFilter("workshopGift", ["b1"])).toEqual({ workshop: { businessId: { in: ["b1"] } } });
    expect(wipeFilter("productMaterial", ["b1"])).toEqual({ product: { businessId: { in: ["b1"] } } });
  });
});
