import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/current-user";
import { formatIDR, formatDate } from "@/lib/format";
import { EmptyState, Callout } from "@/components/ui";
import { OrderBadge } from "@/components/status-badge";
import { PageHeader } from "@/components/page-header";
import { Segmented } from "@/components/segmented";
import { IconCalendar, IconCheckCircle, IconChevronRight, IconClipboard, IconPlus } from "@/components/icons";

const TABS = [
  { key: "active", label: "Aktif", href: "/orders" },
  { key: "done", label: "Selesai", href: "/orders?filter=done" },
  { key: "all", label: "Semua", href: "/orders?filter=all" },
];

export default async function OrdersPage({ searchParams }: PageProps<"/orders">) {
  const { filter } = await searchParams;
  const business = await getCurrentBusiness();
  if (!business) return null;

  const orders = await prisma.order.findMany({
    where: { businessId: business.id },
    include: { customer: true, items: { include: { product: true } } },
    orderBy: [{ status: "asc" }, { dueDate: "asc" }, { date: "desc" }],
  });

  const active = filter === "done" ? "done" : filter === "all" ? "all" : "active";
  const shown = orders.filter((o) => {
    if (active === "done") return o.status === "Completed";
    if (active === "all") return true;
    return o.status !== "Completed" && o.status !== "Cancelled";
  });

  return (
    <>
      <PageHeader
        title="Pesanan"
        subtitle="Dibuat dulu, dibayar kemudian"
        action={
          <Link href="/orders/new" className="btn btn-primary btn-sm">
            <IconPlus className="h-4 w-4" strokeWidth={2.4} />
            Buat
          </Link>
        }
      />

      <div className="mb-4">
        <Segmented label="Tampilkan pesanan" options={TABS} active={active} />
      </div>

      {shown.length === 0 ? (
        <EmptyState
          icon={<IconClipboard className="h-6 w-6" strokeWidth={1.8} />}
          title={active === "active" ? "Tidak ada pesanan aktif" : active === "done" ? "Belum ada pesanan selesai" : "Belum ada pesanan"}
          body="Pakai Pesanan untuk barang yang harus dibuat dulu. Saat ditandai Selesai, otomatis jadi penjualan."
          actionLabel={active === "done" ? undefined : "Buat Pesanan"}
          actionHref={active === "done" ? undefined : "/orders/new"}
        />
      ) : (
        <>
          <ul className="flex flex-col gap-3">
            {shown.map((o) => {
              const name = o.customer?.name ?? "Tanpa nama";
              return (
                <li key={o.id}>
                  <Link
                    href={`/orders/${o.id}`}
                    className="card flex flex-col gap-3 p-4 transition-colors hover:bg-canvas active:bg-surface-2"
                  >
                    <span className="flex items-start gap-3">
                      <span
                        aria-hidden
                        className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-leaf-soft text-[20px] font-extrabold text-leaf"
                      >
                        {name.trim()[0]?.toUpperCase() ?? "?"}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block text-[18px] font-bold leading-snug text-ink">{name}</span>
                        <span className="block text-[15px] leading-snug text-ink-2">
                          {o.items.map((i) => `${i.quantity}× ${i.product.name}`).join(", ")}
                        </span>
                      </span>
                      <IconChevronRight className="mt-3 h-5 w-5 shrink-0 text-ink-3" strokeWidth={2} />
                    </span>

                    <span className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                      <OrderBadge status={o.status} />
                      {o.dueDate && (
                        <span className="flex items-center gap-1.5 text-[15px] font-semibold text-ink-2">
                          <IconCalendar className="h-[18px] w-[18px]" strokeWidth={2} />
                          Jatuh tempo {formatDate(o.dueDate)}
                        </span>
                      )}
                    </span>

                    <span className="flex items-end justify-between gap-3 border-t border-line pt-3">
                      <span>
                        <span className="block text-[14px] text-ink-2">Total</span>
                        <span className="tnum block text-[17px] font-bold text-ink">{formatIDR(o.total)}</span>
                      </span>
                      {o.remainingPayment > 0 ? (
                        <span className="text-right">
                          <span className="block text-[14px] text-ink-2">Sisa yang harus dibayar</span>
                          <span className="tnum block text-[17px] font-extrabold text-clay">
                            {formatIDR(o.remainingPayment)}
                          </span>
                        </span>
                      ) : (
                        <span className="flex items-center gap-1.5 text-[16px] font-bold text-leaf">
                          <IconCheckCircle className="h-5 w-5" strokeWidth={2.2} />
                          Sudah lunas
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <div className="mt-4">
            <Callout>
              Pakai Pesanan untuk barang yang harus dibuat dulu. Saat ditandai <strong>Selesai</strong>, pesanan otomatis
              menjadi penjualan.
            </Callout>
          </div>
        </>
      )}
    </>
  );
}
