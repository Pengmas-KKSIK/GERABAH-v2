import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/current-user";
import { markSalePaid } from "@/lib/actions/sales";
import { formatIDR, formatDateLong, invoiceNumber } from "@/lib/format";
import { waUrl, reminderMessage } from "@/lib/whatsapp";
import { PageHeader } from "@/components/page-header";
import { Hero, HeroNote, List, Row, DetailList, SectionTitle } from "@/components/ui";
import { PaymentBadge } from "@/components/status-badge";
import { InvoiceActions } from "@/components/invoice-actions";
import { ActionButton } from "@/components/action-button";
import { IconCheck, IconMessage } from "@/components/icons";

export default async function SaleDetailPage({ params }: PageProps<"/sales/[id]">) {
  const { id } = await params;
  const business = await getCurrentBusiness();
  if (!business) return null;

  const sale = await prisma.sale.findFirst({
    where: { id, businessId: business.id },
    include: { customer: true, channel: true, paymentMethod: true, items: { include: { product: true } }, order: true },
  });
  if (!sale) notFound();

  const number = invoiceNumber("INV", sale.id, sale.date);

  return (
    <>
      <PageHeader title="Penjualan" subtitle={number} back="/sales" />

      <Hero
        label="Total"
        value={formatIDR(sale.total)}
        aside={<PaymentBadge status={sale.paymentStatus} />}
      >
        {sale.outstandingBalance > 0 ? (
          <HeroNote>
            Sudah dibayar {formatIDR(sale.amountPaid)} · sisa{" "}
            <span className="font-extrabold text-white">{formatIDR(sale.outstandingBalance)}</span>
          </HeroNote>
        ) : null}
      </Hero>

      <SectionTitle>Barang</SectionTitle>
      <List>
        {sale.items.map((it) => (
          <Row
            key={it.id}
            title={it.product.name}
            meta={`${it.quantity} × ${formatIDR(it.unitPrice)}`}
            amount={formatIDR(it.lineTotal)}
            chevron={false}
          />
        ))}
        {sale.discount > 0 && <Row title="Diskon" amount={`−${formatIDR(sale.discount)}`} amountTone="out" chevron={false} />}
      </List>

      <SectionTitle>Rincian</SectionTitle>
      <DetailList
        className="mb-6"
        rows={[
          ["Tanggal", formatDateLong(sale.date)],
          ["Pelanggan", sale.customer?.name ?? "Pelanggan umum"],
          ["Tempat jualan", sale.channel?.name ?? "—"],
          ["Bayar pakai", sale.paymentMethod?.name ?? "—"],
          ["Sudah dibayar", formatIDR(sale.amountPaid)],
          ...(sale.notes ? ([["Catatan", sale.notes]] as [string, string][]) : []),
        ]}
      />

      {sale.outstandingBalance > 0 && (
        <div className="mb-3 flex flex-col gap-2.5">
          {sale.customer?.phone && (
            <a
              href={
                waUrl(
                  sale.customer.phone,
                  reminderMessage({
                    businessName: business.name,
                    customerName: sale.customer.name,
                    amount: sale.outstandingBalance,
                    ref: number,
                  })
                ) ?? undefined
              }
              target="_blank"
              rel="noreferrer"
              className="btn btn-secondary w-full"
            >
              <IconMessage className="h-[18px] w-[18px]" strokeWidth={2} />
              Ingatkan lewat WhatsApp
            </a>
          )}
          <ActionButton
            action={markSalePaid}
            hidden={{ id: sale.id }}
            className="btn btn-secondary w-full"
            pendingLabel="Menyimpan…"
            confirm={{
              title: "Tandai penjualan ini lunas?",
              body: `Sisa tagihan ${formatIDR(sale.outstandingBalance)} akan dicatat sebagai uang masuk.`,
              confirmLabel: "Tandai Lunas",
            }}
          >
            <IconCheck className="h-4 w-4" strokeWidth={2.2} />
            Tandai Lunas
          </ActionButton>
        </div>
      )}

      <InvoiceActions url={`/api/invoice/sale/${sale.id}`} filename={`Invoice-${number.replace(/\//g, "-")}.pdf`} />
    </>
  );
}
