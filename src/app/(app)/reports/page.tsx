import { requireOwner } from "@/lib/guards";
import { resolveRange, todayISO, toISODate } from "@/lib/date-range";
import { loadFinancialReport, type CatAmount } from "@/lib/reports";
import { formatIDR } from "@/lib/format";
import { Card, Hero, HeroPanel, SectionTitle } from "@/components/ui";
import { PageHeader } from "@/components/page-header";
import { Segmented } from "@/components/segmented";
import { IconDownload, IconChart } from "@/components/icons";

const PERIODS = [
  { key: "week", label: "Mingguan", href: "/reports?period=week" },
  { key: "month", label: "Bulanan", href: "/reports?period=month" },
  { key: "year", label: "Tahunan", href: "/reports?period=year" },
  { key: "custom", label: "Kustom", href: "/reports?period=custom" },
];

const catRows = (rows: CatAmount[]) =>
  rows.map(({ name, amount }) => (
    <div key={name} className="flex justify-between gap-3 py-2.5 text-[15px]">
      <span className="text-ink-2">{name}</span>
      <span className="tnum font-medium text-ink">{formatIDR(amount)}</span>
    </div>
  ));

export default async function ReportsPage({ searchParams }: PageProps<"/reports">) {
  const { period, from: fromParam, to: toParam } = await searchParams;
  const business = await requireOwner();

  const customFrom = typeof fromParam === "string" ? fromParam : undefined;
  const customTo = typeof toParam === "string" ? toParam : undefined;
  const range = resolveRange(typeof period === "string" ? period : undefined, customFrom, customTo);
  const { from, to, label } = range;
  // Pilihan "Kustom" tetap aktif walau tanggalnya belum diisi (supaya form tanggal muncul).
  const active = period === "custom" ? "custom" : range.key;
  const downloadQuery =
    range.key === "custom" ? `period=custom&from=${toISODate(from)}&to=${toISODate(to)}` : `period=${range.key}`;

  const r = await loadFinancialReport(business.id, from, to);
  const {
    incomeByCat,
    expenseByCat,
    totalIncome,
    totalExpense,
    netProfit,
    margin,
    openingBalance,
    closingBalance,
    salesGross,
    salesDiscount,
    salesNet,
    salesByChannel,
  } = r;

  return (
    <>
      <PageHeader title="Laporan" subtitle={label} />

      <div className="mb-4">
        <Segmented label="Periode laporan" options={PERIODS} active={active} />
      </div>

      {active === "custom" && (
        <form method="get" className="card mb-4 grid grid-cols-2 items-end gap-3 p-4 min-[520px]:grid-cols-[1fr_1fr_auto]">
          <input type="hidden" name="period" value="custom" />
          <label className="block flex-1">
            <span className="field-label">Dari tanggal</span>
            <input type="date" name="from" defaultValue={customFrom ?? todayISO()} max={todayISO()} required className="field" />
          </label>
          <label className="block flex-1">
            <span className="field-label">Sampai tanggal</span>
            <input type="date" name="to" defaultValue={customTo ?? todayISO()} max={todayISO()} required className="field" />
          </label>
          <button type="submit" className="btn btn-primary col-span-2 min-[520px]:col-span-1">
            Tampilkan
          </button>
        </form>
      )}

      {!r.hasActivity ? (
        <div className="card flex flex-col items-center px-6 py-10 text-center">
          <span className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-surface-2 text-ink-2">
            <IconChart className="h-6 w-6" strokeWidth={1.8} />
          </span>
          <p className="text-[17px] font-semibold text-ink">Belum ada transaksi di periode ini</p>
          <p className="mt-1.5 max-w-xs text-[15px] leading-relaxed text-ink-2">
            Pilih periode lain, atau catat dulu uang masuk dan keluar di menu Keuangan.
          </p>
        </div>
      ) : (
        <div>
          <Hero
            label={netProfit >= 0 ? "Laba bersih" : "Rugi bersih"}
            value={formatIDR(netProfit)}
            tone={netProfit >= 0 ? "ink" : "bad"}
          >
            <HeroPanel>
            <p className="text-[15px] leading-relaxed text-ink-2">
              {totalIncome > 0 ? (
                netProfit >= 0 ? (
                  <>
                    Dari setiap Rp 100 pendapatan, <span className="font-semibold text-ink">Rp {margin.toFixed(0)}</span> jadi
                    untung.{" "}
                  </>
                ) : (
                  <>
                    Untuk setiap Rp 100 pendapatan, pengeluarannya lebih{" "}
                    <span className="font-semibold text-bad">Rp {Math.abs(margin).toFixed(0)}</span>. Tinjau harga jual atau
                    biaya produksi.{" "}
                  </>
                )
              ) : null}
              Laba bersih adalah uang yang benar-benar jadi milik usaha setelah semua pengeluaran.
            </p>
            </HeroPanel>
          </Hero>

          {/* Laba Rugi */}
          <section>
            <SectionTitle>Laba rugi sederhana</SectionTitle>
            <Card className="!py-3">
              <p className="text-[15px] font-semibold text-ink">Pendapatan (uang masuk)</p>
              <div className="divide-y divide-line">{catRows(incomeByCat)}</div>
              <div className="flex justify-between gap-3 border-t border-line-strong py-2.5 text-[15px] font-semibold">
                <span>Jumlah pendapatan</span>
                <span className="tnum text-teal">{formatIDR(totalIncome)}</span>
              </div>

              <p className="mt-4 text-[15px] font-semibold text-ink">Pengeluaran (uang keluar)</p>
              <div className="divide-y divide-line">{catRows(expenseByCat)}</div>
              <div className="flex justify-between gap-3 border-t border-line-strong pt-2.5 text-[15px] font-semibold">
                <span>Jumlah pengeluaran</span>
                <span className="tnum text-clay">{formatIDR(totalExpense)}</span>
              </div>
            </Card>
          </section>

          {/* Arus Kas */}
          <section>
            <SectionTitle>Arus kas sederhana</SectionTitle>
            <Card className="!py-1">
              <dl className="flex flex-col divide-y divide-line text-[15px]">
                <div className="flex justify-between gap-3 py-2.5">
                  <dt className="text-ink-2">Saldo awal periode</dt>
                  <dd className="tnum font-medium text-ink">{formatIDR(openingBalance)}</dd>
                </div>
                <div className="flex justify-between gap-3 py-2.5">
                  <dt className="text-ink-2">Kas masuk</dt>
                  <dd className="tnum font-medium text-teal">+{formatIDR(totalIncome)}</dd>
                </div>
                <div className="flex justify-between gap-3 py-2.5">
                  <dt className="text-ink-2">Kas keluar</dt>
                  <dd className="tnum font-medium text-clay">−{formatIDR(totalExpense)}</dd>
                </div>
                <div className="flex justify-between gap-3 py-2.5 font-semibold">
                  <dt>Saldo akhir periode</dt>
                  <dd className={`tnum ${closingBalance >= 0 ? "text-ink" : "text-bad"}`}>{formatIDR(closingBalance)}</dd>
                </div>
              </dl>
            </Card>
          </section>

          {/* Ringkasan Penjualan */}
          <section>
            <SectionTitle>Ringkasan penjualan</SectionTitle>
            <Card className="!py-1">
              <dl className="flex flex-col divide-y divide-line text-[15px]">
                <div className="flex justify-between gap-3 py-2.5">
                  <dt className="text-ink-2">Jumlah transaksi</dt>
                  <dd className="tnum font-medium text-ink">{r.salesCount}</dd>
                </div>
                <div className="flex justify-between gap-3 py-2.5">
                  <dt className="text-ink-2">Penjualan kotor</dt>
                  <dd className="tnum font-medium text-ink">{formatIDR(salesGross)}</dd>
                </div>
                <div className="flex justify-between gap-3 py-2.5">
                  <dt className="text-ink-2">Diskon diberikan</dt>
                  <dd className="tnum font-medium text-clay">−{formatIDR(salesDiscount)}</dd>
                </div>
                <div className="flex justify-between gap-3 py-2.5 font-semibold">
                  <dt>Penjualan bersih</dt>
                  <dd className="tnum text-ink">{formatIDR(salesNet)}</dd>
                </div>
              </dl>
              {salesByChannel.length > 0 && (
                <>
                  <p className="border-t border-line-strong pb-0.5 pt-3 text-[14px] font-semibold text-ink-2">Per tempat jualan</p>
                  <div className="divide-y divide-line pb-1">{catRows(salesByChannel)}</div>
                </>
              )}
            </Card>
          </section>

          {/* Piutang & Persediaan */}
          <section>
            <SectionTitle>Belum lunas dan nilai stok</SectionTitle>
            <Card className="!py-1">
              <dl className="flex flex-col divide-y divide-line text-[15px]">
                <div className="flex justify-between gap-3 py-2.5">
                  <dt className="text-ink-2">Tagihan belum lunas</dt>
                  <dd className="tnum font-medium text-clay">
                    {formatIDR(r.totalReceivable)} <span className="text-ink-3">· {r.receivables.length} tagihan</span>
                  </dd>
                </div>
                <div className="flex justify-between gap-3 py-2.5">
                  <dt className="text-ink-2">Nilai stok (stok × harga jual)</dt>
                  <dd className="tnum font-medium text-ink">{formatIDR(r.totalInventoryValue)}</dd>
                </div>
              </dl>
            </Card>
          </section>

          <SectionTitle>Unduh laporan</SectionTitle>
          <div className="grid grid-cols-2 gap-2.5">
            <a href={`/api/reports/pdf?${downloadQuery}&download=1`} className="btn btn-primary">
              <IconDownload className="h-[18px] w-[18px]" strokeWidth={2} />
              Unduh PDF
            </a>
            <a href={`/api/reports/export?${downloadQuery}`} className="btn btn-secondary">
              <IconDownload className="h-[18px] w-[18px]" strokeWidth={2} />
              Unduh Excel
            </a>
          </div>
          <p className="text-help mt-2.5">
            PDF berisi seluruh laporan di halaman ini. Excel berisi rincian penjualan per baris.
          </p>
        </div>
      )}

    </>
  );
}
