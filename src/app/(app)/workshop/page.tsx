import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/current-user";
import { formatIDR, formatDate } from "@/lib/format";
import { EmptyState, List, Row, Badge } from "@/components/ui";
import { PageHeader } from "@/components/page-header";
import { IconCalculator, IconPlus } from "@/components/icons";

export default async function WorkshopPage() {
  const business = await getCurrentBusiness();
  if (!business) return null;

  const workshops = await prisma.workshop.findMany({
    where: { businessId: business.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <>
      <PageHeader
        title="Workshop"
        subtitle="Hitung harga workshop, lalu catat biaya dan pemasukannya"
        action={
          <Link href="/workshop/new" className="btn btn-primary btn-sm">
            <IconPlus className="h-4 w-4" strokeWidth={2.4} />
            Hitung
          </Link>
        }
      />

      {workshops.length === 0 ? (
        <EmptyState
          icon={<IconCalculator className="h-6 w-6" strokeWidth={1.8} />}
          title="Belum ada workshop"
          body="Hitung perkiraan harga workshop, simpan, lalu catat biaya dan pemasukannya ke Keuangan."
          actionLabel="Hitung Workshop"
          actionHref="/workshop/new"
        />
      ) : (
        <List>
          {workshops.map((w) => (
            <Row
              key={w.id}
              href={`/workshop/${w.id}`}
              title={w.organizer}
              meta={
                <>
                  {w.date ? formatDate(w.date) : "tanpa tanggal"} · {w.participants} peserta
                </>
              }
              amount={formatIDR(w.offerPrice)}
              amountSub={`untung ${formatIDR(w.targetProfit)}`}
              trailing={
                w.status === "recorded" ? (
                  <Badge tone="good">Tercatat</Badge>
                ) : (
                  <Badge tone="neutral">Draf</Badge>
                )
              }
            />
          ))}
        </List>
      )}
    </>
  );
}
