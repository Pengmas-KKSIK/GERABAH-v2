"use client";

import { useState } from "react";
import { adjustProductStock } from "@/lib/actions/products";
import { ActionButton } from "./action-button";
import { ActionForm, SubmitButton } from "./form";

export function StockAdjuster({ productId, stock }: { productId: string; stock: number }) {
  const [mode, setMode] = useState<"quick" | "set">("quick");

  return (
    <div className="card p-4">
      <div className="mb-3 flex items-baseline justify-between">
        <h2 className="text-[17px] font-semibold text-ink">Stok sekarang</h2>
        <p className="figure text-[26px] text-ink" aria-live="polite">{stock}</p>
      </div>

      {mode === "quick" ? (
        <>
          <div className="grid grid-cols-4 gap-2">
            {[-1, +1, +5, +10].map((d) => (
              <ActionButton
                key={d}
                action={adjustProductStock}
                hidden={{ productId, mode: "delta", value: String(d) }}
                className="btn btn-secondary btn-sm !px-0 tnum"
                ariaLabel={d > 0 ? `Tambah stok ${d}` : `Kurangi stok ${-d}`}
                pendingLabel="…"
              >
                {d > 0 ? `+${d}` : d}
              </ActionButton>
            ))}
          </div>
          <button
            type="button"
            onClick={() => setMode("set")}
            className="link mt-1 min-h-[44px] text-[15px]"
          >
            Atur jumlah pasti
          </button>
        </>
      ) : (
        <ActionForm
          action={adjustProductStock}
          hidden={{ productId, mode: "set" }}
          className="flex items-end gap-2"
          footer={
            <>
              <SubmitButton className="btn btn-primary shrink-0" pendingLabel="Menyimpan…">
                Simpan
              </SubmitButton>
              <button type="button" onClick={() => setMode("quick")} className="btn btn-ghost shrink-0 !px-3">
                Batal
              </button>
            </>
          }
        >
          <label className="block flex-1">
            <span className="field-label">Jumlah stok</span>
            <input name="value" type="number" inputMode="numeric" min={0} defaultValue={stock} className="field tnum" autoFocus />
          </label>
        </ActionForm>
      )}
    </div>
  );
}
