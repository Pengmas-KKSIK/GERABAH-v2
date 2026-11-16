import { formatDate, formatIDRCompact } from "@/lib/format";
import { orderStatusLabel } from "@/lib/labels";
import { SectionTitle, SeeAll, List, Row, Badge } from "@/components/ui";

type DueOrder = {
  id: string;
  status: string;
  dueDate: Date | null;
  remainingPayment: number;
  customer: { name: string } | null;
  items: { product: { name: string } }[];
};

/** Pesanan yang jatuh tempo dalam 3 hari — tampil di Beranda owner maupun staf. */
export function DueSoon({ orders }: { orders: DueOrder[] }) {
  if (orders.length === 0) return null;
  return (
    <>
      <SectionTitle action={<SeeAll href="/orders" />}>Segera jatuh tempo</SectionTitle>
      <List>
        {orders.slice(0, 4).map((o) => (
          <Row
            key={o.id}
            href={`/orders/${o.id}`}
            title={o.customer?.name ?? "Tanpa nama"}
            meta={`${o.items.map((i) => i.product.name).join(", ")} · ${o.dueDate ? formatDate(o.dueDate) : "-"}`}
            amount={formatIDRCompact(o.remainingPayment)}
            amountTone="out"
            status={<Badge tone="warn">{orderStatusLabel(o.status)}</Badge>}
          />
        ))}
      </List>
    </>
  );
}
