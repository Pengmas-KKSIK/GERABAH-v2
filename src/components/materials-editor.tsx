"use client";

import { formatIDR } from "@/lib/format";
import { RpField } from "./rp-field";
import { IconPlus, IconTrash } from "./icons";

export type MaterialRow = { name: string; quantity: number; unit: string; unitCost: number };

const UNITS = ["pcs", "kg", "gram", "liter", "meter", "lembar", "paket"];

/** Rincian bahan baku per produk — user bisa menambah baris sendiri. */
export function MaterialsEditor({ value, onChange }: { value: MaterialRow[]; onChange: (rows: MaterialRow[]) => void }) {
  const setRow = (i: number, patch: Partial<MaterialRow>) =>
    onChange(value.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const addRow = () => onChange([...value, { name: "", quantity: 1, unit: "pcs", unitCost: 0 }]);

  const total = value.reduce((s, r) => s + r.quantity * r.unitCost, 0);

  return (
    <div className="flex flex-col gap-3">
      {value.map((row, i) => (
        <div key={i} className="rounded-[var(--radius-md)] border border-line p-3">
          <div className="flex items-center justify-between gap-2">
            <input
              value={row.name}
              onChange={(e) => setRow(i, { name: e.target.value })}
              placeholder="mis. Tanah liat"
              aria-label={`Nama bahan ${i + 1}`}
              className="field !min-h-[44px] flex-1"
            />
            <button
              type="button"
              onClick={() => onChange(value.filter((_, idx) => idx !== i))}
              className="icon-btn icon-btn-danger -mr-1"
              aria-label={`Hapus bahan ${row.name || i + 1}`}
            >
              <IconTrash className="h-4 w-4" strokeWidth={2} />
            </button>
          </div>
          <div className="mt-2 grid grid-cols-[1fr_1fr_1.4fr] gap-2">
            <input
              type="number"
              inputMode="decimal"
              min={0}
              step="any"
              value={row.quantity || ""}
              onChange={(e) => setRow(i, { quantity: Math.max(0, Number(e.target.value) || 0) })}
              placeholder="Jumlah"
              aria-label="Jumlah"
              className="field tnum !min-h-[44px] !px-3"
            />
            <select
              value={row.unit}
              onChange={(e) => setRow(i, { unit: e.target.value })}
              aria-label="Satuan"
              className="field !min-h-[44px] !px-3"
            >
              {UNITS.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
            <RpField value={row.unitCost} onChange={(n) => setRow(i, { unitCost: n })} ariaLabel="Harga per satuan" className="!min-h-[44px]" />
          </div>
          {row.quantity > 0 && row.unitCost > 0 && (
            <p className="mt-2 text-right text-[14px] text-ink-3">
              Subtotal: <span className="tnum font-medium text-ink-2">{formatIDR(row.quantity * row.unitCost)}</span>
            </p>
          )}
        </div>
      ))}

      <button type="button" onClick={addRow} className="btn btn-secondary w-full">
        <IconPlus className="h-4 w-4" strokeWidth={2.4} />
        Tambah Bahan Baku
      </button>

      {total > 0 && (
        <div className="flex justify-between rounded-[var(--radius-md)] bg-surface-2 px-3 py-2.5 text-[15px]">
          <span className="text-ink-2">Total bahan baku</span>
          <span className="tnum font-semibold text-ink">{formatIDR(total)}</span>
        </div>
      )}
    </div>
  );
}
