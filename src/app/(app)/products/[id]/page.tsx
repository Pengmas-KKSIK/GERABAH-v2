import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { getSessionContext } from "@/lib/current-user";
import { deleteProduct, restoreProduct } from "@/lib/actions/products";
import { productHasHistory } from "@/lib/products";
import { formatIDR, formatDate } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { Card, Badge, Callout, List, Row, SectionTitle, Hero, HeroPanel } from "@/components/ui";
import { StockAdjuster } from "@/components/stock-adjuster";
import { ActionButton } from "@/components/action-button";
import { IconEdit, IconTrash } from "@/components/icons";

export default async function ProductDetailPage({ params }: PageProps<"/products/[id]"> ) {
  const { id } = await params;
  const ctx = await getSessionContext();
  const business = ctx?.business;
  if (!business) return null;

  const product = await prisma.product.findFirst({
    where: { id, businessId: business.id },
    include: {
      category: true,
      costComponents: { include: { otherCategory: true } },
      materials: true,
      changeRequests: { where: { status: "pending", field: "sellingPrice" }, orderBy: { createdAt: "desc" }, take: 1 },
      saleItems: { include: { sale: true }, orderBy: { sale: { date: "desc" } }, take: 5 },
    },
  });
  if (!product) notFound();

  const materialCost = product.materials.reduce((s, m) => s + m.quantity * m.unitCost, 0);
  const costRows = [
    ...(materialCost > 0 ? [{ label: "Bahan Baku", amount: materialCost }] : []),
    ...product.costComponents.map((c) => ({
      label: c.label === "Other Cost" ? c.otherCategory?.name ?? "Lain-lain" : "Kemasan",
      amount: c.amount,
    })),
  ];
  const totalCost = materialCost + product.costComponents.reduce((s, c) => s + c.amount, 0);
  const profit = product.sellingPrice - totalCost;
  const margin = product.sellingPrice > 0 ? (profit / product.sellingPrice) * 100 : 0;
  const archived = product.status === "inactive";
  const hasHistory = await productHasHistory(product.id);
  const pending = product.changeRequests[0];

  return (
    <>
      <PageHeader
        title={product.name}
        subtitle={product.category?.name ?? undefined}
        back="/products"
        action={
          !archived && (
            <Link href={`/products/${id}/edit`} className="btn btn-secondary btn-sm">
              <IconEdit className="h-4 w-4" strokeWidth={2} />
              Ubah
            </Link>
          )
        }
      />

      {archived && (
        <div className="mb-4">
          <Callout tone="warn">Produk ini diarsipkan — tidak muncul di katalog dan tidak bisa dijual.</Callout>
        </div>
      )}

      {pending && (
        <div className="mb-4">
          <Callout tone="warn">
            Perubahan harga jadi <strong>{formatIDR(pending.newValue)}</strong> (diajukan {pending.requestedByName})
            sedang menunggu persetujuan pemilik.
            {ctx.role === "owner" && (
              <>
                {" "}
                <Link href="/approvals" className="font-semibold underline">
                  Tinjau di Persetujuan
                </Link>
                .
              </>
            )}
          </Callout>
        </div>
      )}

      {product.photoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={product.photoUrl}
          alt={product.name}
          className="mb-4 aspect-[4/3] w-full rounded-[var(--radius-lg)] border border-line bg-surface-2 object-cover"
        />
      )}

      <Hero
        label="Harga jual"
        value={formatIDR(product.sellingPrice)}
        aside={
          totalCost > 0 ? (
            <Badge tone={profit >= 0 ? "good" : "bad"}>
              {profit >= 0 ? "Untung" : "Rugi"} {formatIDR(Math.abs(profit))}
            </Badge>
          ) : undefined
        }
      >
        {totalCost > 0 || product.material || product.description ? (
          <HeroPanel>
            {totalCost > 0 && (
              <dl className="flex flex-col gap-2 text-[15px]">
                {costRows.map((c, i) => (
                  <div key={i} className="flex justify-between gap-3">
                    <dt className="text-ink-3">{c.label}</dt>
                    <dd className="tnum text-ink-2">{formatIDR(c.amount)}</dd>
                  </div>
                ))}
                <div className="flex justify-between gap-3 border-t border-line pt-2 font-semibold">
                  <dt className="text-ink">Total biaya</dt>
                  <dd className="tnum text-ink">{formatIDR(totalCost)}</dd>
                </div>
                <div className="flex justify-between gap-3">
                  <dt className="text-ink-3">Untung dari harga jual</dt>
                  <dd className="tnum text-ink-2">{margin.toFixed(0)}%</dd>
                </div>
              </dl>
            )}
            {product.material && (
              <p className={`text-[15px] text-ink-2 ${totalCost > 0 ? "mt-3" : ""}`}>Bahan: {product.material}</p>
            )}
            {product.description && <p className="mt-1 text-[15px] text-ink-2">{product.description}</p>}
          </HeroPanel>
        ) : null}
      </Hero>

      {product.materials.length > 0 && (
        <>
          <SectionTitle>Rincian bahan baku</SectionTitle>
          <Card className="mb-3 !py-1">
            <dl className="flex flex-col divide-y divide-line text-[15px]">
              {product.materials.map((m) => (
                <div key={m.id} className="flex justify-between gap-3 py-2.5">
                  <dt className="text-ink-2">
                    {m.name} <span className="text-ink-3">({m.quantity} {m.unit})</span>
                  </dt>
                  <dd className="tnum text-ink-2">{formatIDR(m.quantity * m.unitCost)}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </>
      )}

      {!archived && (
        <div className="mb-3 mt-8">
          <StockAdjuster productId={product.id} stock={product.stock} />
        </div>
      )}

      {product.saleItems.length > 0 && (
        <>
          <SectionTitle>Penjualan terakhir</SectionTitle>
          <List>
            {product.saleItems.map((si) => (
              <Row
                key={si.id}
                href={`/sales/${si.saleId}`}
                title={`${si.quantity} unit`}
                meta={formatDate(si.sale.date)}
                amount={formatIDR(si.lineTotal)}
              />
            ))}
          </List>
        </>
      )}

      <div className="mt-10">
        {archived ? (
          <ActionButton action={restoreProduct} hidden={{ id: product.id }} className="btn btn-secondary w-full">
            Aktifkan Kembali
          </ActionButton>
        ) : (
          <ActionButton
            action={deleteProduct}
            hidden={{ id: product.id }}
            confirm={
              hasHistory
                ? {
                    title: `Arsipkan ${product.name}?`,
                    body: "Produk ini punya riwayat penjualan, jadi diarsipkan (bukan dihapus) supaya laporan lama tetap benar. Bisa diaktifkan kembali kapan saja.",
                    confirmLabel: "Arsipkan",
                    danger: true,
                  }
                : {
                    title: `Hapus ${product.name}?`,
                    body: "Produk akan dihapus permanen dan tidak bisa dikembalikan.",
                    confirmLabel: "Hapus",
                    danger: true,
                  }
            }
            className="btn btn-danger w-full"
            pendingLabel="Memproses…"
          >
            {!hasHistory && <IconTrash className="h-4 w-4" strokeWidth={2} />}
            {hasHistory ? "Arsipkan Produk" : "Hapus Produk"}
          </ActionButton>
        )}
      </div>
    </>
  );
}
