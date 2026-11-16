import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/current-user";
import { advanceOrderStatus, recordOrderPayment } from "@/lib/actions/orders";
import { formatIDR, formatDateLong, invoiceNumber } from "@/lib/format";
import { waUrl, reminderMessage } from "@/lib/whatsapp";
import { orderStatusLabel } from "@/lib/labels";
import { PaymentBadge } from "@/components/status-badge";
import { ORDER_STATUS_FLOW, nextOrderStatus } from "@/lib/domain/order-status";
import { orderBalance } from "@/lib/receivables";
import { PageHeader } from "@/components/page-header";
import { Hero, HeroNote, Badge, List, Row, Callout, DetailList, SectionTitle } from "@/components/ui";
import { ActionButton } from "@/components/action-button";
import { ActionForm, SubmitButton } from "@/components/form";
import { MoneyInput } from "@/components/money-input";
import { InvoiceActions } from "@/components/invoice-actions";
import { IconCheck, IconChevronRight, IconMessage } from "@/components/icons";

export default async function OrderDetailPage({ params }: PageProps<"/orders/[id]">) {
  const { id } = await params;
  const business = await getCurrentBusiness();
  if (!business) return null;

  const order = await prisma.order.findFirst({
    where: { id, businessId: business.id },
    include: { customer: true, channel: true, items: { include: { product: true } }, sale: true },
  });
  if (!order) notFound();

  const number = invoiceNumber("ORD", order.id, order.date);
  const stepIndex = ORDER_STATUS_FLOW.indexOf(order.status as (typeof ORDER_STATUS_FLOW)[number]);
  const nextStatus = nextOrderStatus(order.status);
  const balance = orderBalance(order);
  const done = order.status === "Completed";
  const cancelled = order.status === "Cancelled";
  const active = !done && !cancelled;

  const qtyByProduct = new Map<string, { name: string; need: number; stock: number }>();
  for (const it of order.items) {
    const e = qtyByProduct.get(it.productId) ?? { name: it.product.name, need: 0, stock: it.product.stock };
    e.need += it.quantity;
    qtyByProduct.set(it.productId, e);
  }
  const shortItems = [...qtyByProduct.values()].filter((e) => e.need > e.stock);
  const stockShort = nextStatus === "Completed" && shortItems.length > 0;

  return (
    <>
      <PageHeader title={order.customer?.name ?? "Pesanan"} subtitle={number} back="/orders" />

      {/* Tahap pesanan */}
      {!cancelled && (
        <div className="mb-4">
          <p className="mb-2 text-[15px] text-ink-2">
            {done ? (
              <span className="font-semibold text-good">Selesai</span>
            ) : (
              <>
                Tahap {stepIndex + 1} dari {ORDER_STATUS_FLOW.length} ·{" "}
                <span className="font-semibold text-ink">{orderStatusLabel(order.status)}</span>
              </>
            )}
          </p>
          <ol className="flex gap-1.5" aria-label="Tahap pesanan">
            {ORDER_STATUS_FLOW.map((s, i) => {
              const reached = i <= (done ? ORDER_STATUS_FLOW.length : stepIndex);
              return (
                <li key={s} className={`h-1.5 flex-1 rounded-full ${reached ? "bg-clay" : "bg-line-strong"}`}>
                  <span className="sr-only">
                    {orderStatusLabel(s)}
                    {i === stepIndex && !done ? " (sekarang)" : reached ? " (sudah)" : ""}
                  </span>
                </li>
              );
            })}
          </ol>
        </div>
      )}

      <Hero
        label="Total pesanan"
        value={formatIDR(order.total)}
        aside={<PaymentBadge status={balance.status} />}
      >
        {balance.remaining > 0 ? (
          <HeroNote>
            Sudah dibayar {formatIDR(balance.paid)} · sisa{" "}
            <span className="font-extrabold text-white">{formatIDR(balance.remaining)}</span>
          </HeroNote>
        ) : null}
      </Hero>

      <SectionTitle>Barang</SectionTitle>
      <List>
        {order.items.map((it) => (
          <Row
            key={it.id}
            title={it.product.name}
            meta={`${it.quantity} × ${formatIDR(it.price)}`}
            amount={formatIDR(it.quantity * it.price - it.discount)}
            chevron={false}
          />
        ))}
      </List>

      <SectionTitle>Rincian</SectionTitle>
      <DetailList
        className="mb-6"
        rows={[
          ["Dibuat", formatDateLong(order.date)],
          ["Jatuh tempo", order.dueDate ? formatDateLong(order.dueDate) : "—"],
          ["Tempat pesan", order.channel?.name ?? "—"],
          ...(cancelled ? ([["Status", orderStatusLabel(order.status)]] as [string, string][]) : []),
          ...(order.notes ? ([["Catatan", order.notes]] as [string, string][]) : []),
        ]}
      />

      {stockShort && (
        <div className="mb-3">
          <Callout tone="warn">
            Stok belum cukup untuk menyelesaikan pesanan:{" "}
            {shortItems.map((e) => `${e.name} (ada ${e.stock}, butuh ${e.need})`).join(", ")}. Tambah stok dulu di
            halaman Produk.
          </Callout>
        </div>
      )}

      {active && (
        <div className="flex flex-col gap-2.5">
          {nextStatus && (
            <ActionButton
              action={advanceOrderStatus}
              hidden={{ id: order.id, status: nextStatus }}
              className="btn btn-primary w-full"
              pendingLabel="Memproses…"
              confirm={
                nextStatus === "Completed"
                  ? {
                      title: "Selesaikan pesanan ini?",
                      body: "Stok produk akan berkurang dan pesanan ini otomatis menjadi penjualan.",
                      confirmLabel: "Selesaikan",
                    }
                  : undefined
              }
            >
              {nextStatus === "Completed" ? (
                <IconCheck className="h-4 w-4" strokeWidth={2.2} />
              ) : (
                <IconChevronRight className="h-4 w-4" strokeWidth={2.2} />
              )}
              {nextStatus === "Completed" ? "Selesaikan Pesanan" : `Tandai ${orderStatusLabel(nextStatus)}`}
            </ActionButton>
          )}

          {order.remainingPayment > 0 && order.customer?.phone && (
            <a
              href={
                waUrl(
                  order.customer.phone,
                  reminderMessage({
                    businessName: business.name,
                    customerName: order.customer.name,
                    amount: order.remainingPayment,
                    dueDate: order.dueDate,
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

          {order.remainingPayment > 0 && (
            <ActionForm
              action={recordOrderPayment}
              hidden={{ orderId: order.id }}
              className="card flex flex-col gap-3 p-4"
              footer={
                <SubmitButton className="btn btn-secondary w-full" pendingLabel="Menyimpan…">
                  Catat Pembayaran
                </SubmitButton>
              }
            >
              <label htmlFor="order-payment" className="field-label !mb-0">
                Terima pembayaran
              </label>
              <MoneyInput id="order-payment" name="amount" placeholder="0" />
            </ActionForm>
          )}

        </div>
      )}

      {cancelled && <Callout tone="warn">Pesanan ini dibatalkan.</Callout>}

      {done && order.sale && (
        <div className="mt-3">
          <List>
            <Row href={`/sales/${order.sale.id}`} title="Lihat penjualannya" meta="Pesanan ini sudah menjadi penjualan" />
          </List>
        </div>
      )}

      <div className="mt-4">
        <InvoiceActions url={`/api/invoice/order/${order.id}`} filename={`Nota-${number.replace(/\//g, "-")}.pdf`} />
      </div>

      {active && (
        <div className="mt-6">
          <ActionButton
            action={advanceOrderStatus}
            hidden={{ id: order.id, status: "Cancelled" }}
            className="btn btn-ghost w-full !text-bad"
            confirm={{
              title: "Batalkan pesanan ini?",
              body: "Pesanan akan ditandai dibatalkan dan tidak bisa dilanjutkan lagi.",
              confirmLabel: "Batalkan Pesanan",
              cancelLabel: "Jangan",
              danger: true,
            }}
            pendingLabel="Membatalkan…"
          >
            Batalkan Pesanan
          </ActionButton>
        </div>
      )}
    </>
  );
}
