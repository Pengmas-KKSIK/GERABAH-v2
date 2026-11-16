"use client";

import Link from "next/link";
import { useState } from "react";

type Preset = { key: string; label: string; dari: string; sampai: string };

type Props = {
  /** Alamat halaman, mis. "/sales". */
  basePath: string;
  /** Parameter lain yang harus ikut terbawa (mis. tab `type`). */
  keep?: Record<string, string>;
  /** Filter yang sedang aktif (dari alamat halaman). */
  active: { mode: "all" } | { mode: "day" | "range"; fromISO: string; toISO: string; label: string };
  presets: Preset[];
  today: string;
};

function href(basePath: string, keep: Record<string, string>, p: { dari?: string; sampai?: string; tanggal?: string }) {
  const q = new URLSearchParams(keep);
  if (p.tanggal) q.set("tanggal", p.tanggal);
  if (p.dari) q.set("dari", p.dari);
  if (p.sampai) q.set("sampai", p.sampai);
  const s = q.toString();
  return s ? `${basePath}?${s}` : basePath;
}

/**
 * Filter tanggal: pintasan cepat, pilih satu hari tepat, atau rentang hari (dari–sampai).
 * Memakai form GET biasa — hasilnya ada di alamat halaman, jadi tombol Kembali dan bagikan tautan tetap jalan.
 */
export function DateFilter({ basePath, keep = {}, active, presets, today }: Props) {
  const isActive = active.mode !== "all";
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"day" | "range">(active.mode === "range" ? "range" : "day");
  const clearHref = href(basePath, keep, {});

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setOpen((o) => !o)}
          aria-expanded={open}
          aria-controls="date-filter-panel"
          className="btn btn-secondary btn-sm"
        >
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" aria-hidden>
            <rect x="3" y="5" width="18" height="16" rx="2" />
            <path d="M3 10h18M8 3v4M16 3v4" />
          </svg>
          {isActive ? "Ubah tanggal" : "Pilih tanggal"}
        </button>
        {isActive && (
          <Link href={clearHref} scroll={false} className="btn btn-ghost btn-sm">
            Semua tanggal
          </Link>
        )}
      </div>

      {isActive && (
        <p className="mt-2 px-1 text-[15px] text-ink-2" aria-live="polite">
          Menampilkan: <span className="font-semibold text-ink">{active.label}</span>
        </p>
      )}

      {open && (
        <div id="date-filter-panel" className="card mt-3 p-4">
          <p className="label mb-2">Pilih cepat</p>
          <div className="mb-4 flex flex-wrap gap-2">
            {presets.map((p) => (
              <Link
                key={p.key}
                href={p.dari === p.sampai ? href(basePath, keep, { tanggal: p.dari }) : href(basePath, keep, { dari: p.dari, sampai: p.sampai })}
                scroll={false}
                onClick={() => setOpen(false)}
                className="btn btn-secondary btn-sm"
              >
                {p.label}
              </Link>
            ))}
          </div>

          <p className="label mb-2">Atau pilih sendiri</p>
          <div className="segment mb-3" role="group" aria-label="Cara memilih tanggal">
            <button type="button" className="segment-item" aria-pressed={mode === "day"} onClick={() => setMode("day")}>
              Satu hari
            </button>
            <button type="button" className="segment-item" aria-pressed={mode === "range"} onClick={() => setMode("range")}>
              Rentang hari
            </button>
          </div>

          <form method="get" action={basePath}>
            {Object.entries(keep).map(([k, v]) => (
              <input key={k} type="hidden" name={k} value={v} />
            ))}
            {mode === "day" ? (
              <label className="block">
                <span className="field-label">Tanggal</span>
                <input
                  type="date"
                  name="tanggal"
                  required
                  defaultValue={active.mode === "day" ? active.fromISO : today}
                  className="field"
                />
              </label>
            ) : (
              <div className="grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="field-label">Dari tanggal</span>
                  <input
                    type="date"
                    name="dari"
                    required
                    defaultValue={active.mode !== "all" ? active.fromISO : today}
                    className="field"
                  />
                </label>
                <label className="block">
                  <span className="field-label">Sampai tanggal</span>
                  <input
                    type="date"
                    name="sampai"
                    required
                    defaultValue={active.mode !== "all" ? active.toISO : today}
                    className="field"
                  />
                </label>
              </div>
            )}
            <div className="mt-4 grid grid-cols-2 gap-2.5">
              <button type="submit" className="btn btn-secondary">
                Tampilkan
              </button>
              <Link href={clearHref} scroll={false} onClick={() => setOpen(false)} className="btn btn-ghost">
                Hapus pilihan
              </Link>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
