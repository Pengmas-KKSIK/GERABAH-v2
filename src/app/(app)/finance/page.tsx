import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getSessionContext } from "@/lib/current-user";
import { formatIDR, formatDate } from "@/lib/format";
import { toISODate, todayISO } from "@/lib/date-range";
import { parseDateFilter, datePresets, withDate } from "@/lib/date-filter";
import { DateFilter } from "@/components/date-filter";
import { Hero, FlowPair, EmptyState, List, Row, FlowChip, StatGroup } from "@/components/ui";
import { PageHeader } from "@/components/page-header";
import { Segmented } from "@/components/segmented";
import { IconArrowDown, IconArrowUp, IconWallet } from "@/components/icons";

export default async function FinancePage({ searchParams }: PageProps<"/finance">) {
  const sp = await searchParams;
  const { type } = sp;
  const dateFilter = parseDateFilter(sp);
  const ctx = await getSessionContext();
  if (!ctx?.business) return null;
  const business = ctx.business;
  const isStaff = ctx.role === "staff";

  const allTx = await prisma.financialTransaction.findMany({
    where: { businessId: business.id, ...(isStaff ? { type: "EXPENSE" } : {}) },
    include: { incomeCategory: true, expenseCategory: true, paymentMethod: true },
    orderBy: { date: "desc" },
  });

  const totalIncome = allTx.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
  const totalExpense = allTx.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);
  const balance = totalIncome - totalExpense;

  const TABS = isStaff
    ? [{ key: "EXPENSE", label: "Uang Keluar", href: withDate("/finance", dateFilter) }]
    : [
        { key: "ALL", label: "Semua", href: withDate("/finance", dateFilter) },
        { key: "INCOME", label: "Uang Masuk", href: withDate("/finance", dateFilter, "type=INCOME") },
        { key: "EXPENSE", label: "Uang Keluar", href: withDate("/finance", dateFilter, "type=EXPENSE") },
      ];

  const activeTab = isStaff ? "EXPENSE" : type === "EXPENSE" ? "EXPENSE" : type === "INCOME" ? "INCOME" : "ALL";
  const byType = activeTab === "ALL" ? allTx : allTx.filter((t) => t.type === activeTab);
  // Saldo kas di atas selalu total keseluruhan; filter tanggal hanya mempersempit daftar di bawah.
  const filtered =
    dateFilter.mode === "all" ? byType : byType.filter((t) => t.date >= dateFilter.from && t.date <= dateFilter.to);
  const rangeIncome = filtered.filter((t) => t.type === "INCOME").reduce((s, t) => s + t.amount, 0);
  const rangeExpense = filtered.filter((t) => t.type === "EXPENSE").reduce((s, t) => s + t.amount, 0);

  const byDay = new Map<string, typeof filtered>();
  for (const t of filtered) {
    const key = toISODate(t.date);
    byDay.set(key, [...(byDay.get(key) ?? []), t]);
  }

  return (
    <>
      <PageHeader
        title="Keuangan"
        subtitle={isStaff ? "Catat uang yang dikeluarkan untuk usaha" : "Semua uang masuk dan keluar usaha"}
      />

      {isStaff ? (
        <Hero label="Total uang keluar" value={formatIDR(totalExpense)} tone="out" />
      ) : (
        <Hero label="Saldo kas usaha" value={formatIDR(balance)} tone={balance < 0 ? "bad" : "ink"}>
          <FlowPair income={formatIDR(totalIncome)} expense={formatIDR(totalExpense)} incomeLabel="Total masuk" expenseLabel="Total keluar" />
        </Hero>
      )}

      <div className={`mb-8 grid gap-2.5 ${isStaff ? "grid-cols-1" : "grid-cols-2"}`}>
        {!isStaff && (
          <Link href="/finance/new?type=INCOME" className={`btn ${activeTab === "EXPENSE" ? "btn-secondary" : "btn-primary"}`}>
            <IconArrowDown className="h-[18px] w-[18px]" strokeWidth={2.2} />
            Uang Masuk
          </Link>
        )}
        <Link
          href="/finance/new?type=EXPENSE"
          className={`btn ${isStaff || activeTab === "EXPENSE" ? "btn-primary" : "btn-secondary"}`}
        >
          <IconArrowUp className="h-[18px] w-[18px]" strokeWidth={2.2} />
          Uang Keluar
        </Link>
      </div>

      {!isStaff && (
        <div className="mb-4">
          <Segmented label="Jenis catatan" options={TABS} active={activeTab} />
        </div>
      )}

      <DateFilter
        basePath="/finance"
        keep={!isStaff && activeTab !== "ALL" ? { type: activeTab } : {}}
        active={dateFilter}
        presets={datePresets()}
        today={todayISO()}
      />

      {dateFilter.mode !== "all" && filtered.length > 0 && (
        <StatGroup
          className="mb-6"
          items={
            isStaff
              ? [{ label: "Uang keluar", value: formatIDR(rangeExpense), tone: "out" }]
              : [
                  { label: "Masuk", value: formatIDR(rangeIncome), tone: "in" },
                  { label: "Keluar", value: formatIDR(rangeExpense), tone: "out" },
                  { label: "Selisih", value: `${rangeIncome - rangeExpense < 0 ? "−" : ""}${formatIDR(Math.abs(rangeIncome - rangeExpense))}` },
                ]
          }
        />
      )}

      {filtered.length === 0 && dateFilter.mode !== "all" && byType.length > 0 ? (
        <EmptyState
          icon={<IconWallet className="h-6 w-6" strokeWidth={1.8} />}
          title="Tidak ada catatan di tanggal ini"
          body="Coba pilih tanggal lain, atau tekan Semua tanggal."
        />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon={<IconWallet className="h-6 w-6" strokeWidth={1.8} />}
          title={activeTab === "ALL" ? "Belum ada catatan" : `Belum ada ${activeTab === "INCOME" ? "uang masuk" : "uang keluar"}`}
          body={
            isStaff
              ? "Setiap kali mengeluarkan uang untuk usaha, catat di sini. Sekali sehari juga cukup."
              : "Setiap kali menerima atau mengeluarkan uang untuk usaha, catat di sini. Sekali sehari juga cukup."
          }
          actionLabel={activeTab === "INCOME" ? "Catat Uang Masuk" : "Catat Uang Keluar"}
          actionHref={activeTab === "INCOME" ? "/finance/new?type=INCOME" : "/finance/new?type=EXPENSE"}
        />
      ) : (
        <div className="flex flex-col gap-6">
          {[...byDay.entries()].map(([day, items]) => {
            const net = items.reduce((s, t) => s + (t.type === "INCOME" ? t.amount : -t.amount), 0);
            return (
              <div key={day}>
                <div className="mb-2 flex items-baseline justify-between px-1">
                  <h2 className="text-[15px] font-semibold text-ink">{formatDate(items[0].date)}</h2>
                  <span className={`tnum text-[14px] font-semibold ${net >= 0 ? "text-teal" : "text-clay"}`}>
                    {net >= 0 ? "+" : "−"}
                    {formatIDR(Math.abs(net))}
                  </span>
                </div>
                <List>
                  {items.map((t) => (
                    <Row
                      key={t.id}
                      href={`/finance/${t.id}`}
                      leading={<FlowChip dir={t.type === "INCOME" ? "in" : "out"} />}
                      title={t.description || t.incomeCategory?.name || t.expenseCategory?.name || "Transaksi"}
                      meta={`${t.incomeCategory?.name ?? t.expenseCategory?.name ?? "Lainnya"} · ${t.paymentMethod?.name ?? "Tunai"}`}
                      amount={`${t.type === "INCOME" ? "+" : "−"}${formatIDR(t.amount)}`}
                      amountTone={t.type === "INCOME" ? "in" : "out"}
                      chevron={false}
                    />
                  ))}
                </List>
              </div>
            );
          })}
        </div>
      )}

    </>
  );
}
