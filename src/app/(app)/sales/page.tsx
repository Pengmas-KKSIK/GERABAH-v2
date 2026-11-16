import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/current-user";
import { formatIDR, formatDate } from "@/lib/format";
import { toISODate } from "@/lib/date-range";
import { EmptyState, List, Row, Hero, HeroNote, HeroLink, Tile } from "@/components/ui";
import { PaymentBadge } from "@/components/status-badge";
import { PageHeader } from "@/components/page-header";
import { IconReceipt, IconPlus, IconHourglass } from "@/components/icons";

export default async function SalesPage() {
  const business = await getCurrentBusiness();
  if (!business) return null;

  const sales = await prisma.sale.findMany({
    where: { businessId: business.id },
    include: { customer: true, items: { include: { product: true } } },
    orderBy: { date: "desc" },
  });

  const total = sales.reduce((s, x) => s + x.total, 0);
  const unpaid = sales.reduce((s, x) => s + x.outstandingBalance, 0);

  // Dikelompokkan per tanggal, seperti halaman Keuangan.
  const byDay = new Map<string, typeof sales>();
  for (const s of sales) {
    const key = toISODate(s.date);
    byDay.set(key, [...(byDay.get(key) ?? []), s]);
  }

  return (
    <>
      <PageHeader
        title="Penjualan"
        subtitle="Barang yang sudah terjual"
        back="/more"
        backLabel="Menu"
        backMobileOnly
        action={
          <Link href="/sales/new" className="btn btn-primary btn-sm">
            <IconPlus className="h-4 w-4" strokeWidth={2.4} />
            Catat
          </Link>
        }
      />

      {sales.length > 0 && (
        <Hero label="Total penjualan" value={formatIDR(total)} className="!mb-6">
          <div className="flex flex-col gap-2.5">
            <HeroNote>{sales.length} penjualan tercatat</HeroNote>
            {unpaid > 0 ? (
              <HeroLink
                href="/receivables"
                icon={<IconHourglass className="h-[22px] w-[22px]" strokeWidth={2} />}
                label="Belum lunas"
                value={formatIDR(unpaid)}
              />
            ) : (
              <HeroNote>Semua penjualan sudah lunas</HeroNote>
            )}
          </div>
        </Hero>
      )}

      {sales.length === 0 ? (
        <EmptyState
          icon={<IconReceipt className="h-6 w-6" strokeWidth={1.8} />}
          title="Belum ada penjualan"
          body="Catat penjualan di sini. Stok produk berkurang otomatis dan uang masuk tercatat di Keuangan."
          actionLabel="Catat Penjualan"
          actionHref="/sales/new"
        />
      ) : (
        <div className="flex flex-col gap-5">
          {[...byDay.entries()].map(([day, items]) => {
            const dayTotal = items.reduce((s, x) => s + x.total, 0);
            return (
              <section key={day}>
                <div className="mb-2 flex items-baseline justify-between gap-3 px-1">
                  <h2 className="text-[16px] font-bold text-ink">{formatDate(items[0].date)}</h2>
                  <span className="tnum text-[14px] font-semibold text-ink-2">{formatIDR(dayTotal)}</span>
                </div>
                <List>
                  {items.map((s) => (
                    <Row
                      key={s.id}
                      href={`/sales/${s.id}`}
                      leading={
                        <Tile tone="clay">
                          <IconReceipt className="h-6 w-6" strokeWidth={1.75} />
                        </Tile>
                      }
                      title={s.items.map((i) => `${i.quantity}× ${i.product.name}`).join(", ")}
                      meta={s.customer?.name ?? "Pelanggan umum"}
                      amount={formatIDR(s.total)}
                      stackAmount
                      status={<PaymentBadge status={s.paymentStatus} />}
                    />
                  ))}
                </List>
              </section>
            );
          })}
        </div>
      )}
    </>
  );
}
