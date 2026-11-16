"use client";

import { groupDigits } from "@/lib/format";
import { Card } from "./ui";
import { RpField } from "./rp-field";
import { QtyStepper } from "./qty-stepper";
import { IconPlus, IconTrash } from "./icons";

export type ItemRow = { productId: string; quantity: number; unitPrice: number };
export type EditorProduct = { id: string; name: string; sellingPrice: number; stock?: number };

export function ItemsEditor({
  products,
  value,
  onChange,
  showStock = false,
}: {
  products: EditorProduct[];
  value: ItemRow[];
  onChange: (rows: ItemRow[]) => void;
  showStock?: boolean;
}) {
  const byId = new Map(products.map((p) => [p.id, p]));

  const setRow = (i: number, patch: Partial<ItemRow>) =>
    onChange(value.map((r, idx) => (idx === i ? { ...r, ...patch } : r)));

  const addRow = () => {
    const p = (showStock ? products.find((x) => (x.stock ?? 0) > 0) : undefined) ?? products[0];
    onChange([...value, { productId: p?.id ?? "", quantity: 1, unitPrice: p?.sellingPrice ?? 0 }]);
  };

  return (
    <div className="flex flex-col gap-3">
      {value.map((row, i) => {
        const p = byId.get(row.productId);
        const over = showStock && p?.stock != null && row.quantity > p.stock;
        return (
          <Card key={i}>
            <div className="flex flex-col gap-3">
              <div className="-mb-1 -mt-1 flex min-h-[44px] items-center justify-between">
                <span className="text-[15px] font-semibold text-ink">Barang {i + 1}</span>
                {value.length > 1 && (
                  <button
                    type="button"
                    onClick={() => onChange(value.filter((_, idx) => idx !== i))}
                    className="icon-btn icon-btn-danger -mr-2.5"
                    aria-label={`Hapus barang ${i + 1}`}
                  >
                    <IconTrash className="h-[18px] w-[18px]" strokeWidth={2} />
                  </button>
                )}
              </div>
              <label className="block">
                <span className="sr-only">Produk</span>
                <select
                  value={row.productId}
                  onChange={(e) => {
                    const np = byId.get(e.target.value);
                    setRow(i, { productId: e.target.value, unitPrice: np?.sellingPrice ?? 0 });
                  }}
                  className="field"
                >
                  {products.map((prod) => (
                    <option key={prod.id} value={prod.id} disabled={showStock && (prod.stock ?? 0) <= 0}>
                      {prod.name}
                      {showStock && prod.stock != null ? ` — stok ${prod.stock}` : ""}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid gap-3 min-[420px]:grid-cols-2">
              <div>
                <span className="field-label">
                  Jumlah{showStock && p?.stock != null ? ` (stok ${p.stock})` : ""}
                </span>
                <QtyStepper
                  value={row.quantity}
                  onChange={(n) => setRow(i, { quantity: n })}
                  max={showStock ? p?.stock : undefined}
                  invalid={over}
                />
              </div>
              <label className="block">
                <span className="field-label">Harga satuan</span>
                <RpField
                  value={row.unitPrice}
                  onChange={(n) => setRow(i, { unitPrice: n })}
                  placeholder={p ? groupDigits(String(p.sellingPrice)) : "0"}
                />
              </label>
              </div>

              {over && (
                <p role="alert" className="text-[14px] font-medium text-bad">
                  Jumlah melebihi stok ({p?.stock}). Kurangi atau tambah stok dulu.
                </p>
              )}
            </div>
          </Card>
        );
      })}

      {value.length < 30 && (
        <button type="button" onClick={addRow} className="btn btn-secondary w-full">
          <IconPlus className="h-4 w-4" strokeWidth={2.4} />
          Tambah Barang
        </button>
      )}
    </div>
  );
}
