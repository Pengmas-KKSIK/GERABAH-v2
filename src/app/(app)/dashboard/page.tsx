import { prisma } from "@/lib/prisma";
import { getSessionContext } from "@/lib/current-user";
import { resolveRange, previousRange, daysFromNow, cashflowBuckets, BUSINESS_TIME_ZONE } from "@/lib/date-range";
import { loadReceivables } from "@/lib/receivables";
import { formatIDR, formatIDRCompact, formatDate } from "@/lib/format";
import { SectionTitle, SeeAll, StatGroup, List, Row, EmptyState, Badge, Hero, FlowPair, FlowChip, ProductThumb } from "@/components/ui";
import { PageHeader } from "@/components/page-header";
import { CashflowChart } from "@/components/cashflow-chart";
import { DueSoon } from "./due-soon";
import { Segmented } from "@/components/segmented";
import { IconBox, IconWallet, IconClipboard, IconHourglass } from "@/components/icons";

const RANGES = [
  { key: "today", label: "Hari Ini" },
  { key: "week", label: "7 Hari" },
  { key: "month", label: "Bulan Ini" },
  { key: "year", label: "Tahun Ini" },
];

function pctChange(cur: number, prev: number) {
  if (prev === 0) return cur > 0 ? 100 : 0;
  return ((cur - prev) / prev) * 100;
}

/** Sapaan sesuai jam di WIB. */
function greeting(now = new Date()) {
  const h = Number(
    new Intl.DateTimeFormat("en-GB", { timeZone: BUSINESS_TIME_ZONE, hour: "2-digit", hourCycle: "h23" }).format(now),
  );
  if (h < 11) return "Selamat pagi";
  if (h < 15) return "Selamat siang";
  if (h < 18) return "Selamat sore";
  return "Selamat malam";
}

export default async function DashboardPage({ searchParams }: PageProps<"/dashboard">) {
  const { range } = await searchParams;
  const activeRange = typeof range === "string" ? range : "month";
  const ctx = await getSessionContext();
  if (!ctx?.business) return null;
  const business = ctx.business;
  const isStaff = ctx.role === "staff";
  const firstName = ctx.user.name.trim().split(/\s+/)[0] || ctx.user.name;

  const { from, to, label } = resolveRange(activeRange);
  const prev = previousRange(from, to);
  const { buckets, windowLabel } = cashflowBuckets(activeRange);
  const chartFrom = buckets[0].start;

  const [sales, txs, prevTxs, chartTxs, activeOrders, products, receivables] = await Promise.all([
    prisma.sale.findMany({
      where: { businessId: business.id, date: { gte: from, lte: to } },
      include: { items: { include: { product: true } } },
    }),
    prisma.financialTransaction.findMany({
      where: { businessId: business.id, date: { gte: from, lte: to } },
      orderBy: { date: "desc" },
      include: { incomeCategory: true, expenseCategory: true },
    }),
    prisma.financialTransaction.findMany({
      where: { businessId: business.id, date: { gte: prev.from, lte: prev.to } },
      select: { type: true, amount: true },
    }),
    prisma.financialTransaction.findMany({
      where: { businessId: business.id, date: { gte: chartFrom, lte: to } },
      select: { type: true, amount: true, date: true },
    }),
    prisma.order.findMany({
      where: { businessId: business.id, status: { notIn: ["Completed", "Cancelled"] } },
      include: { customer: true, items: { include: { product: true } } },
      orderBy: { dueDate: "asc" },
    }),
    prisma.product.findMany({ where: { businessId: business.id } }),
    loadReceivables(business.id),
  ]);

  // Sama persis dengan halaman Belum Lunas & Laporan (lihat lib/receivables.ts).
  const outstandingAmount = receivables.reduce((s, r) => s + r.amount, 0);
  const lowStock = products.filter((p) => p.status !== "inactive" && p.stock <= p.minStock);
  const dueSoon = activeOrders.filter((o) => o.dueDate && o.dueDate <= daysFromNow(3));

  const stats = (
    <StatGroup
      items={[
        {
          label: "Pesanan aktif",
          value: `${activeOrders.length} pesanan`,
          href: "/orders",
          icon: <IconClipboard className="h-6 w-6" strokeWidth={1.75} />,
          marker: "clay",
        },
        {
          label: "Belum lunas",
          value: formatIDRCompact(outstandingAmount),
          tone: outstandingAmount > 0 ? "out" : "ink",
          href: "/receivables",
          icon: <IconHourglass className="h-6 w-6" strokeWidth={1.75} />,
          marker: "teal",
        },
        {
          label: "Stok menipis",
          value: `${lowStock.length} produk`,
          tone: lowStock.length > 0 ? "warn" : "ink",
          href: "/products?filter=low",
          icon: <IconBox className="h-6 w-6" strokeWidth={1.75} />,
          marker: "ochre",
        },
      ]}
    />
  );
  const header = <PageHeader eyebrow={`${greeting()}, ${firstName}`} title={business.name} />;

  // ── Beranda staf: harga & stok produk, tanpa angka keuangan ──
  if (isStaff) {
    const catalog = products
      .filter((p) => p.status !== "inactive")
      .sort((a, b) => a.name.localeCompare(b.name));
    return (
      <>
        {header}
        <div>
          {stats}
          <DueSoon orders={dueSoon} />
          <div>
            <SectionTitle action={<SeeAll href="/products" />}>Harga dan stok produk</SectionTitle>
            {catalog.length === 0 ? (
              <EmptyState
                icon={<IconBox className="h-6 w-6" strokeWidth={1.8} />}
                title="Belum ada produk"
                body="Tambahkan produk beserta harga jual dan stoknya."
                actionLabel="Tambah Produk"
                actionHref="/products/new"
              />
            ) : (
              <List>
                {catalog.map((p) => (
                  <Row
                    key={p.id}
                    href={`/products/${p.id}`}
                    title={p.name}
                    amount={formatIDR(p.sellingPrice)}
                    amountSub={`stok ${p.stock}`}
                    trailing={
                      p.stock <= 0 ? (
                        <Badge tone="bad">Habis</Badge>
                      ) : p.stock <= p.minStock ? (
                        <Badge tone="warn">Menipis</Badge>
                      ) : undefined
                    }
                  />
                ))}
              </List>
            )}
          </div>
        </div>
      </>
    );
  }

  // ── Beranda pemilik ──
  const income = txs.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
  const expense = txs.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);
  const prevIncome = prevTxs.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
  const profit = income - expense;
  const change = prevIncome > 0 ? pctChange(income, prevIncome) : null;

  const chartData = buckets.map((b) => {
    const inB = chartTxs.filter((t) => t.date >= b.start && t.date < b.end);
    return {
      label: b.label,
      fullLabel: b.fullLabel,
      income: inB.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0),
      expense: inB.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0),
    };
  });
  const chartHasData = chartData.some((b) => b.income > 0 || b.expense > 0);

  const productTotals = new Map<string, { units: number; revenue: number; photoUrl: string | null }>();
  for (const s of sales)
    for (const it of s.items) {
      const e = productTotals.get(it.product.name) ?? { units: 0, revenue: 0, photoUrl: it.product.photoUrl };
      e.units += it.quantity;
      e.revenue += it.lineTotal;
      productTotals.set(it.product.name, e);
    }
  const topProducts = [...productTotals.entries()].sort((a, b) => b[1].revenue - a[1].revenue).slice(0, 3);

  const hasData = sales.length > 0 || txs.length > 0 || activeOrders.length > 0 || receivables.length > 0;

  return (
    <>
      {header}

      <div className="mb-4">
        <Segmented
          label="Periode"
          active={activeRange}
          options={RANGES.map((r) => ({ ...r, href: `/dashboard?range=${r.key}` }))}
        />
      </div>

      {!hasData ? (
        <EmptyState
          icon={<IconWallet className="h-6 w-6" strokeWidth={1.8} />}
          title="Mulai dari satu catatan"
          body="Catat uang yang masuk dan keluar hari ini. Setelah beberapa catatan, untung rugi usaha akan terlihat sendiri di sini."
          actionLabel="Catat Uang Masuk"
          actionHref="/finance/new?type=INCOME"
        />
      ) : (
        <div>
          <Hero
            label={`${profit >= 0 ? "Untung" : "Rugi"} ${label.toLowerCase()}`}
            value={formatIDR(profit)}
            tone={profit >= 0 ? "ink" : "bad"}
            aside={
              change !== null ? (
                <Badge tone={change >= 0 ? "info" : "warn"}>
                  Masuk {change >= 0 ? "naik" : "turun"} {Math.abs(change).toFixed(0)}%
                </Badge>
              ) : undefined
            }
          >
            <FlowPair income={formatIDR(income)} expense={formatIDR(expense)} incomeLabel="Uang masuk" expenseLabel="Uang keluar" />
          </Hero>

          {stats}

          {chartHasData && (
            <div className="mt-8">
              <CashflowChart buckets={chartData} windowLabel={windowLabel} />
            </div>
          )}

          <DueSoon orders={dueSoon} />

          {topProducts.length > 0 && (
            <div>
              <SectionTitle action={<SeeAll href="/products" />}>Produk terlaris</SectionTitle>
              <List>
                {topProducts.map(([name, d]) => (
                  <Row
                    key={name}
                    leading={<ProductThumb name={name} photoUrl={d.photoUrl} />}
                    title={name}
                    meta={`${d.units} unit terjual`}
                    amount={formatIDR(d.revenue)}
                    chevron={false}
                  />
                ))}
              </List>
            </div>
          )}

          {txs.length > 0 && (
            <div>
              <SectionTitle action={<SeeAll href="/finance" />}>Catatan terakhir</SectionTitle>
              <List>
                {txs.slice(0, 5).map((t) => (
                  <Row
                    key={t.id}
                    href={`/finance/${t.id}`}
                    leading={<FlowChip dir={t.type === "INCOME" ? "in" : "out"} />}
                    title={t.description || t.incomeCategory?.name || t.expenseCategory?.name || "Transaksi"}
                    meta={`${formatDate(t.date)} · ${t.incomeCategory?.name ?? t.expenseCategory?.name ?? "Lainnya"}`}
                    amount={`${t.type === "INCOME" ? "+" : "−"}${formatIDR(t.amount)}`}
                    amountTone={t.type === "INCOME" ? "in" : "out"}
                    chevron={false}
                  />
                ))}
              </List>
            </div>
          )}
        </div>
      )}
    </>
  );
}
