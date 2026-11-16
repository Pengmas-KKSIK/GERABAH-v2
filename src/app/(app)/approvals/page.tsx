import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/guards";
import { approveProductChange, rejectProductChange } from "@/lib/actions/products";
import { formatIDR, formatDateTime } from "@/lib/format";
import { EmptyState, Card } from "@/components/ui";
import { PageHeader } from "@/components/page-header";
import { ActionButton } from "@/components/action-button";
import { IconClipboardCheck, IconCheck, IconX } from "@/components/icons";

export default async function ApprovalsPage() {
  const business = await requireOwner();

  const requests = await prisma.productChangeRequest.findMany({
    where: { businessId: business.id, status: "pending" },
    include: { product: true },
    orderBy: { createdAt: "asc" },
  });

  return (
    <>
      <PageHeader title="Persetujuan" subtitle="Perubahan harga produk yang diajukan staf" />

      {requests.length === 0 ? (
        <EmptyState
          icon={<IconClipboardCheck className="h-6 w-6" strokeWidth={1.8} />}
          title="Tidak ada yang menunggu"
          body="Kalau staf mengubah harga jual produk yang sudah ada, pengajuannya akan muncul di sini sampai kamu setujui atau tolak."
        />
      ) : (
        <div className="flex flex-col gap-3">
          {requests.map((r) => (
            <Card key={r.id}>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-[16px] font-semibold text-ink">{r.product.name}</p>
                  <p className="tnum mt-1 text-[15px] text-ink-2">
                    <span className="line-through decoration-ink-3">{formatIDR(r.oldValue)}</span>{" "}
                    <span className="sr-only">menjadi</span>
                    <span aria-hidden className="text-ink-3">→</span>{" "}
                    <span className="font-semibold text-ink">{formatIDR(r.newValue)}</span>
                  </p>
                  <p className="mt-1 text-[14px] text-ink-3">
                    Diajukan {r.requestedByName} · {formatDateTime(r.createdAt)}
                  </p>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2.5">
                <ActionButton
                  action={rejectProductChange}
                  hidden={{ requestId: r.id }}
                  confirm={{
                    title: `Tolak harga baru ${r.product.name}?`,
                    body: `Harga tetap ${formatIDR(r.oldValue)}. Pengajuan ${formatIDR(r.newValue)} dari ${r.requestedByName} dibatalkan.`,
                    confirmLabel: "Tolak",
                    danger: true,
                  }}
                  className="btn btn-danger btn-sm"
                  pendingLabel="Memproses…"
                >
                  <IconX className="h-4 w-4" strokeWidth={2.2} />
                  Tolak
                </ActionButton>
                <ActionButton
                  action={approveProductChange}
                  hidden={{ requestId: r.id }}
                  className="btn btn-primary btn-sm"
                  pendingLabel="Memproses…"
                >
                  <IconCheck className="h-4 w-4" strokeWidth={2.2} />
                  Setujui
                </ActionButton>
              </div>
            </Card>
          ))}
        </div>
      )}
    </>
  );
}
