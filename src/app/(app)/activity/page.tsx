import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/guards";
import { formatDate, formatDateTime } from "@/lib/format";
import { toISODate } from "@/lib/date-range";
import { EmptyState, List, Row, Badge } from "@/components/ui";
import { PageHeader } from "@/components/page-header";
import { IconClock } from "@/components/icons";

export default async function ActivityPage() {
  const business = await requireOwner();

  const logs = await prisma.activityLog.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: "desc" },
    take: 200,
  });

  const byDay = new Map<string, typeof logs>();
  for (const l of logs) {
    const key = toISODate(l.createdAt);
    byDay.set(key, [...(byDay.get(key) ?? []), l]);
  }

  return (
    <>
      <PageHeader title="Log Aktivitas" subtitle="Apa yang diubah, kapan, dan oleh siapa" />

      {logs.length === 0 ? (
        <EmptyState
          icon={<IconClock className="h-6 w-6" strokeWidth={1.8} />}
          title="Belum ada aktivitas"
          body="Setiap kali kamu atau staf mencatat penjualan, mengubah stok/harga, atau mencatat pengeluaran, tercatat di sini."
        />
      ) : (
        <div className="flex flex-col gap-6">
          {[...byDay.entries()].map(([day, items]) => (
            <div key={day}>
              <h2 className="mb-2 px-1 text-[15px] font-semibold text-ink">{formatDate(items[0].createdAt)}</h2>
              <List>
                {items.map((l) => (
                  <Row
                    key={l.id}
                    title={l.summary}
                    meta={`${formatDateTime(l.createdAt).split(", ").pop()} · ${l.userName}`}
                    trailing={
                      l.role === "staff" ? (
                        <Badge tone="info">Staf</Badge>
                      ) : (
                        <Badge tone="neutral">Pemilik</Badge>
                      )
                    }
                    chevron={false}
                  />
                ))}
              </List>
            </div>
          ))}
        </div>
      )}
    </>
  );
}
