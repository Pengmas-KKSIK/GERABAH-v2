"use client";

import { useMemo, useState } from "react";
import { formatIDR } from "@/lib/format";
import { Card, Callout } from "./ui";
import { ActionForm, SubmitButton } from "./form";
import { RpField } from "./rp-field";
import { QtyStepper } from "./qty-stepper";
import { IconPlus, IconTrash } from "./icons";
import type { FormState } from "@/lib/action-state";

type Action = (prev: FormState, formData: FormData) => Promise<FormState>;
export type WorkshopProduct = { id: string; name: string; sellingPrice: number };
type GiftRow = { productId: string; quantity: number; unitCost: number };

export function WorkshopForm({ action, products }: { action: Action; products: WorkshopProduct[] }) {
  const first = products[0];
  const [organizer, setOrganizer] = useState("");
  const [date, setDate] = useState("");
  const [participants, setParticipants] = useState(0);
  const [gifts, setGifts] = useState<GiftRow[]>(
    first ? [{ productId: first.id, quantity: 1, unitCost: first.sellingPrice }] : []
  );
  const [operational, setOperational] = useState(0);
  const [profitMode, setProfitMode] = useState<"percent" | "nominal">("percent");
  const [profitValue, setProfitValue] = useState(0);
  const [notes, setNotes] = useState("");

  const byId = useMemo(() => new Map(products.map((p) => [p.id, p])), [products]);
  const setGift = (i: number, patch: Partial<GiftRow>) =>
    setGifts((g) => g.map((x, idx) => (idx === i ? { ...x, ...patch } : x)));

  const calc = useMemo(() => {
    const giftCost = gifts.reduce((s, g) => s + g.quantity * g.unitCost, 0);
    const totalCost = giftCost + operational;
    const profit = profitMode === "percent" ? Math.round((totalCost * profitValue) / 100) : profitValue;
    const offer = totalCost + profit;
    const perPerson = participants > 0 ? Math.round(offer / participants) : 0;
    return { giftCost, totalCost, profit, offer, perPerson };
  }, [gifts, operational, profitMode, profitValue, participants]);

  if (products.length === 0) {
    return (
      <Callout tone="warn">
        Belum ada produk. Tambahkan produk dulu di menu Produk supaya bisa dipilih sebagai suvenir.
      </Callout>
    );
  }

  return (
    <ActionForm action={action} footer={<SubmitButton>Simpan Workshop</SubmitButton>}>
      <input type="hidden" name="gifts" value={JSON.stringify(gifts)} readOnly />
      <input type="hidden" name="participants" value={participants} readOnly />
      <input type="hidden" name="operationalCost" value={operational || ""} readOnly />
      <input type="hidden" name="profitMode" value={profitMode} readOnly />
      <input type="hidden" name="profitValue" value={profitValue || ""} readOnly />

      <Card>
        <div className="flex flex-col gap-4">
          <label className="block">
            <span className="field-label">Nama instansi / penyelenggara</span>
            <input
              name="organizer"
              required
              value={organizer}
              onChange={(e) => setOrganizer(e.target.value)}
              className="field"
              placeholder="mis. SD Negeri 1"
            />
          </label>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="field-label">Tanggal kegiatan</span>
              <input name="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="field" />
            </label>
            <div>
              <span className="field-label">Jumlah peserta</span>
              <QtyStepper value={participants} onChange={setParticipants} min={0} />
            </div>
          </div>
        </div>
      </Card>

      <h2 className="form-section">Suvenir untuk peserta</h2>
      <div className="flex flex-col gap-3">
        {gifts.map((g, i) => {
          const p = byId.get(g.productId);
          return (
            <Card key={i}>
              <div className="flex flex-col gap-3">
                <div className="-mb-1 -mt-1 flex min-h-[44px] items-center justify-between">
                  <span className="text-[15px] font-semibold text-ink">Produk {i + 1}</span>
                  {gifts.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setGifts((x) => x.filter((_, idx) => idx !== i))}
                      className="icon-btn icon-btn-danger -mr-2.5"
                      aria-label={`Hapus produk ${i + 1}`}
                    >
                      <IconTrash className="h-[18px] w-[18px]" strokeWidth={2} />
                    </button>
                  )}
                </div>
                <label className="block">
                  <span className="sr-only">Produk</span>
                  <select
                    value={g.productId}
                    onChange={(e) => {
                      const np = byId.get(e.target.value);
                      setGift(i, { productId: e.target.value, unitCost: np?.sellingPrice ?? 0 });
                    }}
                    className="field"
                  >
                    {products.map((prod) => (
                      <option key={prod.id} value={prod.id}>
                        {prod.name}
                      </option>
                    ))}
                  </select>
                </label>
                <div>
                  <span className="field-label">Jumlah suvenir</span>
                  <QtyStepper value={g.quantity} onChange={(n) => setGift(i, { quantity: n })} />
                </div>
                <label className="block">
                  <span className="field-label">Biaya / produk (dari harga jual)</span>
                  <RpField
                    value={g.unitCost}
                    onChange={(n) => setGift(i, { unitCost: n })}
                    placeholder={p ? String(p.sellingPrice) : "0"}
                  />
                </label>
                <p className="text-right text-[14px] text-ink-3">
                  Subtotal <span className="tnum font-medium text-ink-2">{formatIDR(g.quantity * g.unitCost)}</span>
                </p>
              </div>
            </Card>
          );
        })}
        <button
          type="button"
          onClick={() =>
            setGifts((g) => [
              ...g,
              { productId: first?.id ?? "", quantity: 1, unitCost: first?.sellingPrice ?? 0 },
            ])
          }
          className="btn btn-secondary w-full"
        >
          <IconPlus className="h-4 w-4" strokeWidth={2.4} />
          Tambah Suvenir
        </button>
      </div>

      <h2 className="form-section">Biaya dan keuntungan</h2>
      <Card>
        <div className="flex flex-col gap-4">
          <label className="block">
            <span className="field-label">Biaya bahan &amp; operasional workshop</span>
            <RpField value={operational} onChange={setOperational} />
            <span className="mt-1.5 block text-[14px] text-ink-3">Tanah liat, glasir, sewa tempat, transport, tenaga, dll.</span>
          </label>
          <div>
            <span className="field-label" id="profit-mode-label">Target keuntungan</span>
            <div className="segment mb-2" role="group" aria-labelledby="profit-mode-label">
              {(["percent", "nominal"] as const).map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setProfitMode(m)}
                  aria-pressed={profitMode === m}
                  className="segment-item"
                >
                  {m === "percent" ? "Persen (%)" : "Nominal (Rp)"}
                </button>
              ))}
            </div>
            {profitMode === "percent" ? (
              <div className="relative">
                <input
                  inputMode="numeric"
                  aria-label="Target keuntungan dalam persen"
                  value={profitValue || ""}
                  onChange={(e) => setProfitValue(Number(e.target.value.replace(/\D/g, "")) || 0)}
                  className="field tnum !pr-9 font-semibold"
                  placeholder="0"
                />
                <span className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 font-semibold text-ink-3">%</span>
              </div>
            ) : (
              <RpField value={profitValue} onChange={setProfitValue} ariaLabel="Target keuntungan dalam rupiah" />
            )}
          </div>
          <label className="block">
            <span className="field-label">Catatan (opsional)</span>
            <textarea name="notes" rows={2} value={notes} onChange={(e) => setNotes(e.target.value)} className="field" />
          </label>
        </div>
      </Card>

      <h2 className="form-section">Harga yang disarankan</h2>
      <section className="card p-5" aria-live="polite">
        <p className="text-[14px] font-medium text-ink-2">Harga penawaran workshop</p>
        <p className="figure mt-1.5 text-[clamp(30px,8.5vw,36px)] text-ink">{formatIDR(calc.offer)}</p>
        <p className="mt-1 text-[15px] text-ink-2">
          {participants > 0 ? `${formatIDR(calc.perPerson)} per peserta` : "Isi jumlah peserta untuk melihat harga per orang"}
        </p>
        <dl className="mt-4 flex flex-col gap-2 border-t border-line pt-4 text-[15px]">
          <div className="flex justify-between gap-3">
            <dt className="text-ink-3">Total biaya</dt>
            <dd className="tnum font-medium text-ink">{formatIDR(calc.totalCost)}</dd>
          </div>
          <div className="flex justify-between gap-3">
            <dt className="text-ink-3">Keuntungan</dt>
            <dd className="tnum font-medium text-ink">{formatIDR(calc.profit)}</dd>
          </div>
        </dl>
      </section>

      <Callout>
        Setelah disimpan, tekan &quot;Catat ke Keuangan&quot; di halaman detail untuk mencatat biaya (uang keluar) dan
        harga penawaran (uang masuk) sekaligus.
      </Callout>
    </ActionForm>
  );
}
