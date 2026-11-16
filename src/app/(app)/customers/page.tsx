import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/current-user";
import { formatIDR } from "@/lib/format";
import { customerOwed } from "@/lib/domain/payment";
import { matchesQuery, queryParam } from "@/lib/search";
import { EmptyState, List, Row, Avatar, Badge } from "@/components/ui";
import { PageHeader } from "@/components/page-header";
import { SearchBox } from "@/components/search-box";
import { IconUsers, IconPlus } from "@/components/icons";

export default async function CustomersPage({ searchParams }: PageProps<"/customers">) {
  const q = queryParam((await searchParams).q);
  const business = await getCurrentBusiness();
  if (!business) return null;

  const customers = await prisma.customer.findMany({
    where: { businessId: business.id },
    include: {
      sales: { select: { total: true, outstandingBalance: true } },
      orders: { select: { remainingPayment: true, status: true } },
    },
    orderBy: { name: "asc" },
  });
  const shown = customers.filter((c) => matchesQuery(q, c.name, c.phone, c.address));

  return (
    <>
      <PageHeader
        title="Pelanggan"
        subtitle="Riwayat belanja dan tagihan yang belum lunas"
        action={
          <Link href="/customers/new" className="btn btn-primary btn-sm">
            <IconPlus className="h-4 w-4" strokeWidth={2.4} />
            Tambah
          </Link>
        }
      />

      {customers.length > 0 && (
        <div className="mb-4">
          <SearchBox placeholder="Cari nama atau nomor HP…" />
        </div>
      )}

      {shown.length === 0 ? (
        <EmptyState
          icon={<IconUsers className="h-6 w-6" strokeWidth={1.8} />}
          title={q ? `Tidak ada pelanggan "${q}"` : "Belum ada pelanggan"}
          body={
            q
              ? "Coba ketik sebagian nama atau nomor HP-nya."
              : "Simpan data pelanggan tetap supaya riwayat belanja dan sisa tagihannya gampang dilihat."
          }
          actionLabel={q ? undefined : "Tambah Pelanggan"}
          actionHref={q ? undefined : "/customers/new"}
        />
      ) : (
        <List>
          {shown.map((c) => {
            const spent = c.sales.reduce((s, x) => s + x.total, 0);
            const owed = customerOwed(c.sales, c.orders);
            return (
              <Row
                key={c.id}
                href={`/customers/${c.id}`}
                leading={<Avatar name={c.name} />}
                title={c.name}
                meta={`${c.sales.length} pembelian · ${formatIDR(spent)}`}
                status={owed > 0 ? <Badge tone="warn">Belum lunas {formatIDR(owed)}</Badge> : undefined}
              />
            );
          })}
        </List>
      )}
    </>
  );
}
