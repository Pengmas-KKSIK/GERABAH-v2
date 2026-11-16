import Link from "next/link";
import { requireBusiness } from "@/lib/guards";
import { loadReceivables } from "@/lib/receivables";
import { formatIDR, formatDate } from "@/lib/format";
import { waUrl, reminderMessage } from "@/lib/whatsapp";
import { Hero, HeroNote, EmptyState, Callout } from "@/components/ui";
import { PaymentBadge } from "@/components/status-badge";
import { PageHeader } from "@/components/page-header";
import { IconCheck, IconMessage, IconPhone } from "@/components/icons";

export default async function ReceivablesPage() {
  const business = await requireBusiness();
  const bills = await loadReceivables(business.id);
  const total = bills.reduce((s, b) => s + b.amount, 0);

  return (
    <>
      <PageHeader
        title="Belum Lunas"
        subtitle="Pesanan dan penjualan yang belum dibayar penuh"
        back="/more"
        backLabel="Menu"
        backMobileOnly
      />

      {bills.length === 0 ? (
        <EmptyState
          icon={<IconCheck className="h-6 w-6" strokeWidth={2} />}
          title="Semua sudah lunas"
          body="Tagihan yang belum dibayar penuh akan muncul di sini, lengkap dengan tombol pengingat WhatsApp."
        />
      ) : (
        <>
          <Hero label="Total belum lunas" value={formatIDR(total)} className="!mb-4">
            <HeroNote>{bills.length} tagihan menunggu dibayar</HeroNote>
          </Hero>

          <Callout>
            Tombol <strong>Kirim Pengingat</strong> membuka WhatsApp dengan pesan yang sudah siap dikirim.
          </Callout>

          <ul className="mt-4 flex flex-col gap-3">
            {bills.map((b) => {
              const link =
                b.phone &&
                waUrl(
                  b.phone,
                  reminderMessage({
                    businessName: business.name,
                    customerName: b.customerName,
                    amount: b.amount,
                    dueDate: b.dueDate,
                  })
                );
              const kind = b.kind === "order" ? "Pesanan" : "Penjualan";
              return (
                <li key={`${b.kind}-${b.id}`} className="card flex flex-col gap-3.5 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex min-w-0 flex-col items-start gap-1.5">
                      <div>
                        <p className="text-[18px] font-bold leading-snug text-ink">{b.customerName ?? "Tanpa nama"}</p>
                        <p className="text-[15px] text-ink-2">
                          {kind}
                          {b.dueDate ? ` · jatuh tempo ${formatDate(b.dueDate)}` : ""}
                        </p>
                      </div>
                      <PaymentBadge status={b.status} />
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="text-[14px] text-ink-2">Sisa</p>
                      <p className="tnum text-[20px] font-extrabold text-clay">{formatIDR(b.amount)}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2.5">
                    <Link href={b.href} className="btn btn-secondary btn-sm !min-h-[48px]">
                      Lihat Detail
                    </Link>
                    {link ? (
                      <a href={link} target="_blank" rel="noreferrer" className="btn btn-secondary btn-sm !min-h-[48px]">
                        <IconMessage className="h-5 w-5" strokeWidth={2} />
                        Kirim Pengingat
                      </a>
                    ) : b.customerId ? (
                      <Link href={`/customers/${b.customerId}/edit`} className="btn btn-secondary btn-sm !min-h-[48px]">
                        <IconPhone className="h-5 w-5" strokeWidth={2} />
                        Tambah Nomor HP
                      </Link>
                    ) : (
                      <span className="flex items-center text-[14px] leading-snug text-ink-2">
                        Tanpa data pelanggan, tidak bisa diingatkan lewat WhatsApp
                      </span>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </>
      )}
    </>
  );
}
