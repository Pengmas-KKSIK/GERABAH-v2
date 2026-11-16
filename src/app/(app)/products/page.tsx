import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getCurrentBusiness } from "@/lib/current-user";
import { formatIDR } from "@/lib/format";
import { matchesQuery, queryParam } from "@/lib/search";
import { Hero, HeroNote, EmptyState, List, Row, Badge, ProductThumb } from "@/components/ui";
import { PageHeader } from "@/components/page-header";
import { Segmented } from "@/components/segmented";
import { SearchBox } from "@/components/search-box";
import { IconBox, IconPlus } from "@/components/icons";

export default async function ProductsPage({ searchParams }: PageProps<"/products">) {
  const sp = await searchParams;
  const q = queryParam(sp.q);
  const business = await getCurrentBusiness();
  if (!business) return null;

  const products = await prisma.product.findMany({
    where: { businessId: business.id },
    include: { category: true, costComponents: true },
    orderBy: { createdAt: "desc" },
  });

  const active = sp.filter === "archived" ? "archived" : sp.filter === "low" ? "low" : "active";
  const qs = q ? `&q=${encodeURIComponent(q)}` : "";
  const TABS = [
    { key: "active", label: "Aktif", href: `/products?filter=active${qs}` },
    { key: "low", label: "Stok Menipis", href: `/products?filter=low${qs}` },
    { key: "archived", label: "Arsip", href: `/products?filter=archived${qs}` },
  ];

  const shown = products.filter((p) => {
    if (!matchesQuery(q, p.name, p.category?.name, p.material)) return false;
    if (active === "archived") return p.status === "inactive";
    if (active === "low") return p.status !== "inactive" && p.stock <= p.minStock;
    return p.status !== "inactive";
  });

  const live = products.filter((p) => p.status !== "inactive");
  const totalStockValue = live.reduce((s, p) => s + p.stock * p.sellingPrice, 0);
  const totalUnits = live.reduce((s, p) => s + p.stock, 0);

  return (
    <>
      <PageHeader
        title="Produk"
        subtitle="Katalog, stok, dan untung per barang"
        action={
          <Link href="/products/new" className="btn btn-primary btn-sm">
            <IconPlus className="h-4 w-4" strokeWidth={2.4} />
            Tambah
          </Link>
        }
      />

      {products.length > 0 && (
        <Hero label="Nilai stok (harga jual)" value={formatIDR(totalStockValue)} className="!mb-5">
          <HeroNote>
            {live.length} produk aktif · {totalUnits.toLocaleString("id-ID")} barang di gudang
          </HeroNote>
        </Hero>
      )}

      {products.length > 0 && (
        <div className="mb-3">
          <SearchBox placeholder="Cari nama produk…" />
        </div>
      )}
      <div className="mb-4">
        <Segmented label="Tampilkan produk" options={TABS} active={active} />
      </div>

      {shown.length === 0 ? (
        <EmptyState
          icon={<IconBox className="h-6 w-6" strokeWidth={1.8} />}
          title={q ? `Tidak ada produk "${q}"` : active === "active" ? "Belum ada produk" : "Tidak ada produk di sini"}
          body={
            q
              ? "Coba kata lain, atau periksa tab Stok Menipis dan Arsip."
              : "Tambahkan produk beserta biaya produksinya, supaya untung tiap barang dihitung otomatis."
          }
          actionLabel={active === "active" && !q ? "Tambah Produk" : undefined}
          actionHref={active === "active" && !q ? "/products/new" : undefined}
        />
      ) : (
        <List>
          {shown.map((p) => {
            const cost = p.costComponents.reduce((s, c) => s + c.amount, 0);
            const profit = p.sellingPrice - cost;
            const low = p.status !== "inactive" && p.stock <= p.minStock;
            return (
              <Row
                key={p.id}
                href={`/products/${p.id}`}
                leading={<ProductThumb name={p.name} photoUrl={p.photoUrl} size={72} />}
                title={p.name}
                meta={
                  <>
                    <span className="tnum block text-[16px] font-semibold text-ink">
                      {formatIDR(p.sellingPrice)}
                      {p.stock > 0 && !low && <span className="ml-2 text-[15px] font-medium text-ink-2">Stok {p.stock}</span>}
                    </span>
                    {cost > 0 && <span className="tnum block">Untung {formatIDR(profit)}</span>}
                  </>
                }
                status={
                  p.stock <= 0 ? (
                    <Badge tone="bad">Habis</Badge>
                  ) : low ? (
                    <Badge tone="warn">Stok tinggal {p.stock}</Badge>
                  ) : undefined
                }
              />
            );
          })}
        </List>
      )}

    </>
  );
}
