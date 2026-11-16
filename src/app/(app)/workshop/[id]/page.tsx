import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireContext } from "@/lib/guards";
import { recordWorkshopToFinance, deleteWorkshop } from "@/lib/actions/workshop";
import { formatIDR, formatDateLong } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { Card, Badge, List, Row, Callout, Hero, HeroNote, SectionTitle } from "@/components/ui";
import { ActionButton } from "@/components/action-button";
import { IconCheck } from "@/components/icons";

export default async function WorkshopDetailPage({ params }: PageProps<"/workshop/[id]">) {
  const { id } = await params;
  const { business, role } = await requireContext();
  const isOwner = role === "owner";

  const w = await prisma.workshop.findFirst({
    where: { id, businessId: business.id },
    include: { gifts: { include: { product: true } } },
  });
  if (!w) notFound();

  const recorded = w.status === "recorded";

  return (
    <>
      <PageHeader
        title={w.organizer}
        subtitle={w.date ? formatDateLong(w.date) : "tanpa tanggal"}
        back="/workshop"
        action={recorded ? <Badge tone="good">Tercatat</Badge> : <Badge tone="neutral">Draf</Badge>}
      />

      <Hero label="Harga penawaran workshop" value={formatIDR(w.offerPrice)}>
        <HeroNote>
          {w.participants} peserta · {formatIDR(w.pricePerPerson)} per peserta
        </HeroNote>
      </Hero>

      <SectionTitle>Suvenir untuk peserta</SectionTitle>
      <List>
        {w.gifts.map((g) => (
          <Row
            key={g.id}
            title={g.product.name}
            meta={`${g.quantity} × ${formatIDR(g.unitCost)}`}
            amount={formatIDR(g.quantity * g.unitCost)}
            chevron={false}
          />
        ))}
      </List>

      <SectionTitle>Rincian biaya</SectionTitle>
      <Card className="mb-6 !py-1">
        <dl className="flex flex-col divide-y divide-line text-[15px]">
          <div className="flex justify-between gap-3 py-2.5">
            <dt className="text-ink-3">Biaya suvenir</dt>
            <dd className="tnum font-medium text-ink">{formatIDR(w.giftCost)}</dd>
          </div>
          <div className="flex justify-between gap-3 py-2.5">
            <dt className="text-ink-3">Biaya bahan & operasional</dt>
            <dd className="tnum font-medium text-ink">{formatIDR(w.operationalCost)}</dd>
          </div>
          <div className="flex justify-between gap-3 py-2.5 font-semibold">
            <dt>Total biaya (uang keluar)</dt>
            <dd className="tnum text-clay">{formatIDR(w.totalCost)}</dd>
          </div>
          <div className="flex justify-between gap-3 py-2.5">
            <dt className="text-ink-3">
              Target keuntungan {w.profitMode === "percent" ? `(${w.profitValue}%)` : ""}
            </dt>
            <dd className="tnum font-medium text-ink">{formatIDR(w.targetProfit)}</dd>
          </div>
          <div className="flex justify-between gap-3 py-2.5 font-semibold">
            <dt>Harga penawaran (uang masuk)</dt>
            <dd className="tnum text-teal">{formatIDR(w.offerPrice)}</dd>
          </div>
        </dl>
        {w.notes && <p className="border-t border-line py-3 text-[15px] text-ink-2">{w.notes}</p>}
      </Card>

      {recorded ? (
        <Callout>
          Biaya dan pemasukan workshop ini sudah dicatat ke Keuangan
          {w.recordedAt ? ` pada ${formatDateLong(w.recordedAt)}` : ""}.{" "}
          <Link href="/finance" className="link">
            Lihat di Keuangan
          </Link>
        </Callout>
      ) : !isOwner ? (
        <Callout>Pemilik yang mencatat workshop ini ke Keuangan setelah selesai.</Callout>
      ) : (
        <ActionButton
          action={recordWorkshopToFinance}
          hidden={{ id: w.id }}
          className="btn btn-primary w-full"
          pendingLabel="Mencatat…"
          confirm={{
            title: "Catat workshop ini ke Keuangan?",
            body: `Dua catatan akan dibuat: uang keluar ${formatIDR(w.totalCost)} dan uang masuk ${formatIDR(w.offerPrice)}.`,
            confirmLabel: "Catat ke Keuangan",
          }}
        >
          <IconCheck className="h-4 w-4" strokeWidth={2.2} />
          Catat ke Keuangan
        </ActionButton>
      )}

      {(isOwner || !recorded) && (
      <div className="mt-3">
        <ActionButton
          action={deleteWorkshop}
          hidden={{ id: w.id }}
          className="btn btn-ghost w-full !text-bad"
          confirm={{
            title: "Hapus workshop ini?",
            body: recorded
              ? "Catatan uang masuk dan keluar dari workshop ini juga ikut terhapus. Tidak bisa dikembalikan."
              : "Hitungan workshop ini akan dihapus. Tidak bisa dikembalikan.",
            confirmLabel: "Hapus",
            danger: true,
          }}
          pendingLabel="Menghapus…"
        >
          Hapus Workshop
        </ActionButton>
      </div>
      )}
    </>
  );
}
