"use client";

import { useState } from "react";
import { formatIDR, formatIDRCompact } from "@/lib/format";

export type ChartBucket = { label: string; fullLabel: string; income: number; expense: number };

/**
 * Batang berpasangan uang masuk (teal) dan keluar (tanah liat) per periode.
 * Warna tidak berdiri sendiri: legenda, ringkasan teks, dan nama tiap batang ikut menjelaskan.
 */
export function CashflowChart({ buckets, windowLabel }: { buckets: ChartBucket[]; windowLabel: string }) {
  const [active, setActive] = useState<number | null>(null);
  const max = Math.max(1, ...buckets.map((b) => Math.max(b.income, b.expense)));
  const shown = active != null ? buckets[active] : null;

  return (
    <section className="card p-4" aria-labelledby="chart-title">
      <div className="mb-4 flex items-baseline justify-between gap-3">
        <h2 id="chart-title" className="text-[19px] font-bold text-ink">
          Uang masuk dan keluar
        </h2>
        <p className="text-[14px] text-ink-2">{windowLabel}</p>
      </div>

      <div className="flex items-end gap-1.5 border-b border-line-strong" style={{ height: 144 }}>
        {buckets.map((b, i) => (
          <button
            key={i}
            type="button"
            onClick={() => setActive(active === i ? null : i)}
            aria-pressed={active === i}
            aria-label={`${b.fullLabel}: masuk ${formatIDR(b.income)}, keluar ${formatIDR(b.expense)}`}
            className="flex h-full flex-1 items-end justify-center gap-[3px] rounded-t-[4px] transition-colors hover:bg-canvas"
          >
            <span
              className={`w-full max-w-[22px] rounded-t-[6px] ${active === null || active === i ? "bg-chart-in" : "bg-chart-in/35"}`}
              style={{ height: `${Math.max((b.income / max) * 100, b.income > 0 ? 3 : 0)}%` }}
            />
            <span
              className={`w-full max-w-[22px] rounded-t-[6px] ${active === null || active === i ? "bg-chart-out" : "bg-chart-out/35"}`}
              style={{ height: `${Math.max((b.expense / max) * 100, b.expense > 0 ? 3 : 0)}%` }}
            />
          </button>
        ))}
      </div>
      <div className="mt-1.5 flex gap-1.5" aria-hidden>
        {buckets.map((b, i) => (
          <span
            key={i}
            className={`flex-1 truncate text-center text-[13px] ${active === i ? "font-bold text-ink" : "text-ink-2"}`}
          >
            {b.label}
          </span>
        ))}
      </div>

      <div className="mt-3 flex min-h-[28px] items-center justify-between gap-3 border-t border-line pt-3 text-[14px]">
        {shown ? (
          <>
            <span className="font-semibold text-ink">{shown.fullLabel}</span>
            <span className="flex gap-3">
              <span className="tnum font-bold text-chart-in">+{formatIDRCompact(shown.income)}</span>
              <span className="tnum font-bold text-clay">−{formatIDRCompact(shown.expense)}</span>
            </span>
          </>
        ) : (
          <>
            <span className="flex items-center gap-4 text-ink-2">
              <span className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 rounded-[4px] bg-chart-in" aria-hidden /> Masuk
              </span>
              <span className="flex items-center gap-1.5">
                <span className="h-3.5 w-3.5 rounded-[4px] bg-chart-out" aria-hidden /> Keluar
              </span>
            </span>
            <span className="text-ink-2">Pilih batang untuk rincian</span>
          </>
        )}
      </div>
    </section>
  );
}
