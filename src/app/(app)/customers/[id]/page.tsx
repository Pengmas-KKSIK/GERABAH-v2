import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/current-user";
import { formatIDR, formatDate } from "@/lib/format";
import { customerTypeLabel } from "@/lib/labels";
import { PaymentBadge } from "@/components/status-badge";
import { waUrl } from "@/lib/whatsapp";
import { customerOwed } from "@/lib/domain/payment";
import { PageHeader } from "@/components/page-header";
import { Card, Badge, List, Row, EmptyState, StatGroup, SectionTitle } from "@/components/ui";
import { IconEdit, IconReceipt, IconMessage } from "@/components/icons";

export default async function CustomerDetailPage({ params }: PageProps<"/customers/[id]">) {
  const { id } = await params;
  const business = await getCurrentBusiness();
  if (!business) return null;

  const customer = await prisma.customer.findFirst({
    where: { id, businessId: business.id },
    include: {
      sales: { include: { items: { include: { product: true } } }, orderBy: { date: "desc" } },
      orders: { orderBy: { date: "desc" } },
    },
  });
  if (!customer) notFound();

  const spent = customer.sales.reduce((s, x) => s + x.total, 0);
  const owed = customerOwed(customer.sales, customer.orders);
  const waLink = waUrl(customer.phone);

  return (
    <>
      <PageHeader
        title={customer.name}
        subtitle={customerTypeLabel(customer.type)}
        back="/customers"
        action={
          <Link href={`/customers/${id}/edit`} className="btn btn-secondary btn-sm">
            <IconEdit className="h-4 w-4" strokeWidth={2} />
            Ubah
          </Link>
        }
      />

      <StatGroup
        className="mb-3"
        items={[
          { label: "Total belanja", value: formatIDR(spent) },
          { label: "Belum lunas", value: formatIDR(owed), tone: owed > 0 ? "out" : "ink" },
        ]}
      />

      {(customer.phone || customer.address || customer.notes) && (
        <Card className="mb-3">
          <dl className="flex flex-col gap-3 text-[15px]">
            {customer.phone && (
              <div>
                <dt className="label">Nomor HP</dt>
                <dd className="tnum mt-0.5 text-ink">{customer.phone}</dd>
              </div>
            )}
            {customer.address && (
              <div>
                <dt className="label">Alamat</dt>
                <dd className="mt-0.5 text-ink">{customer.address}</dd>
              </div>
            )}
            {customer.notes && (
              <div>
                <dt className="label">Catatan</dt>
                <dd className="mt-0.5 text-ink-2">{customer.notes}</dd>
              </div>
            )}
          </dl>
        </Card>
      )}

      {waLink && (
        <a href={waLink} target="_blank" rel="noreferrer" className="btn btn-secondary w-full">
          <IconMessage className="h-[18px] w-[18px]" strokeWidth={2} />
          Chat WhatsApp
        </a>
      )}

      <SectionTitle>Riwayat pembelian</SectionTitle>
      {customer.sales.length === 0 ? (
        <EmptyState icon={<IconReceipt className="h-6 w-6" strokeWidth={1.8} />} title="Belum ada pembelian" body="Penjualan atas nama pelanggan ini akan muncul di sini." />
      ) : (
        <List>
          {customer.sales.map((s) => (
            <Row
              key={s.id}
              href={`/sales/${s.id}`}
              title={s.items.map((i) => `${i.quantity}× ${i.product.name}`).join(", ")}
              meta={formatDate(s.date)}
              amount={formatIDR(s.total)}
              status={<PaymentBadge status={s.paymentStatus} />}
            />
          ))}
        </List>
      )}
    </>
  );
}
