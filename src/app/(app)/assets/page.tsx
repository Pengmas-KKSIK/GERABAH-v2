import { prisma } from "@/lib/prisma";
import { requireOwner } from "@/lib/guards";
import { createAsset, deleteAsset, createFixedCost, toggleFixedCostActive, deleteFixedCost } from "@/lib/actions/assets";
import { formatIDR, formatDate } from "@/lib/format";
import { fixedCostPeriodLabel, ASSET_CATEGORIES } from "@/lib/labels";
import { todayISO } from "@/lib/date-range";
import { PageHeader } from "@/components/page-header";
import { List, Row, Badge, StatGroup, SectionTitle, Disclosure } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/form";
import { ActionButton } from "@/components/action-button";
import { IconPlus, IconTrash } from "@/components/icons";

export default async function AssetsPage() {
  const business = await requireOwner();

  const [assets, fixedCosts, fixedCostCategories] = await Promise.all([
    prisma.asset.findMany({ where: { businessId: business.id }, orderBy: { createdAt: "desc" } }),
    prisma.fixedCost.findMany({ where: { businessId: business.id }, include: { category: true }, orderBy: { createdAt: "desc" } }),
    prisma.fixedCostCategory.findMany({ where: { businessId: business.id }, orderBy: { name: "asc" } }),
  ]);

  const totalAssetValue = assets.reduce((s, a) => s + a.purchaseValue, 0);
  const monthlyFixedCost = fixedCosts
    .filter((f) => f.active)
    .reduce((s, f) => s + (f.period === "monthly" ? f.amount : f.period === "yearly" ? f.amount / 12 : 0), 0);

  return (
    <>
      <PageHeader
        title="Aset & Biaya Tetap"
        subtitle="Barang milik usaha, dan biaya yang keluar rutin tiap bulan atau tahun (termasuk langganan)."
        back="/more"
        backLabel="Menu"
        backMobileOnly
      />

      <StatGroup
        items={[
          { label: "Total nilai aset", value: formatIDR(totalAssetValue) },
          { label: "Biaya tetap per bulan", value: formatIDR(monthlyFixedCost) },
        ]}
      />

      {/* ── Aset ── */}
      <SectionTitle>Aset</SectionTitle>
      {assets.length > 0 ? (
        <List className="mb-3">
          {assets.map((a) => (
            <Row
              key={a.id}
              title={a.name}
              meta={`${a.category}${a.purchaseDate ? ` · ${formatDate(a.purchaseDate)}` : ""}`}
              amount={formatIDR(a.purchaseValue)}
              trailing={
                <ActionButton
                  action={deleteAsset}
                  hidden={{ id: a.id }}
                  confirm={{
                    title: `Hapus aset ${a.name}?`,
                    body: "Aset ini akan hilang dari daftar dan total nilai aset.",
                    confirmLabel: "Hapus",
                    danger: true,
                  }}
                  className="icon-btn icon-btn-danger -mr-2"
                  ariaLabel={`Hapus aset ${a.name}`}
                  pendingLabel="…"
                >
                  <IconTrash className="h-[18px] w-[18px]" strokeWidth={2} />
                </ActionButton>
              }
              chevron={false}
            />
          ))}
        </List>
      ) : (
        <p className="text-help mb-3">Belum ada aset. Catat alat produksi, kendaraan, atau perlengkapan usaha lainnya.</p>
      )}

      <Disclosure title="Tambah aset" icon={<IconPlus className="h-5 w-5" strokeWidth={2.2} />} defaultOpen={assets.length === 0}>
        <ActionForm action={createAsset} footer={<SubmitButton>Simpan Aset</SubmitButton>}>
          <label className="block">
            <span className="field-label">Nama aset</span>
            <input name="name" required className="field" placeholder="mis. Tungku pembakaran" />
          </label>
          <div className="grid gap-4 min-[420px]:grid-cols-2">
            <label className="block">
              <span className="field-label">Kategori</span>
              <input name="category" list="assetcat" defaultValue="Lainnya" className="field" />
              <datalist id="assetcat">
                {ASSET_CATEGORIES.map((c) => (
                  <option key={c} value={c} />
                ))}
              </datalist>
            </label>
            <label className="block">
              <span className="field-label">Nilai / harga beli</span>
              <input name="purchaseValue" inputMode="numeric" required className="field tnum" placeholder="0" />
            </label>
          </div>
          <label className="block">
            <span className="field-label">Tanggal beli (opsional)</span>
            <input name="purchaseDate" type="date" defaultValue={todayISO()} className="field" />
          </label>
          <label className="block">
            <span className="field-label">Catatan (opsional)</span>
            <input name="note" className="field" />
          </label>
        </ActionForm>
      </Disclosure>

      {/* ── Biaya Tetap & Langganan ── */}
      <SectionTitle>Biaya tetap dan langganan</SectionTitle>
      {fixedCosts.length > 0 ? (
        <List className="mb-3">
          {fixedCosts.map((f) => (
            <div key={f.id} className="border-b border-line px-4 py-3 last:border-b-0">
              <div className="flex items-start gap-3">
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-[16px] font-medium text-ink">
                    <span className="truncate">{f.name}</span>
                    {!f.active && <Badge tone="neutral">Nonaktif</Badge>}
                  </p>
                  <p className="mt-0.5 text-[14px] text-ink-3">
                    {f.category?.name ?? "Tanpa kategori"} · {fixedCostPeriodLabel(f.period)}
                    {f.endDate ? ` · s/d ${formatDate(f.endDate)}` : ""}
                  </p>
                </div>
                <p className={`tnum shrink-0 text-[16px] font-semibold ${f.active ? "text-ink" : "text-ink-3"}`}>
                  {formatIDR(f.amount)}
                </p>
              </div>
              <div className="-mb-1 mt-1 flex justify-end gap-1">
                <ActionButton
                  action={toggleFixedCostActive}
                  hidden={{ id: f.id }}
                  className="btn btn-ghost btn-sm !min-h-[40px] !text-[14px]"
                  pendingLabel="Menyimpan…"
                >
                  {f.active ? "Nonaktifkan" : "Aktifkan"}
                </ActionButton>
                <ActionButton
                  action={deleteFixedCost}
                  hidden={{ id: f.id }}
                  confirm={{
                    title: `Hapus biaya tetap ${f.name}?`,
                    body: "Biaya ini akan hilang dari daftar dan hitungan biaya tetap per bulan.",
                    confirmLabel: "Hapus",
                    danger: true,
                  }}
                  className="icon-btn icon-btn-danger"
                  ariaLabel={`Hapus biaya tetap ${f.name}`}
                  pendingLabel="…"
                >
                  <IconTrash className="h-[18px] w-[18px]" strokeWidth={2} />
                </ActionButton>
              </div>
            </div>
          ))}
        </List>
      ) : (
        <p className="text-help mb-3">
          Belum ada biaya tetap. Catat gaji bulanan, sewa tempat, listrik, atau langganan software di sini.
        </p>
      )}

      <Disclosure
        title="Tambah biaya tetap"
        icon={<IconPlus className="h-5 w-5" strokeWidth={2.2} />}
        defaultOpen={fixedCosts.length === 0}
      >
        <ActionForm action={createFixedCost} footer={<SubmitButton>Simpan Biaya Tetap</SubmitButton>}>
          <label className="block">
            <span className="field-label">Nama biaya</span>
            <input name="name" required className="field" placeholder="mis. Gaji perajin, Sewa tempat, Canva Pro" />
          </label>
          <label className="block">
            <span className="field-label">Kategori</span>
            <input name="category" list="fixedcostcat" className="field" placeholder="mis. Tenaga Kerja" />
            <datalist id="fixedcostcat">
              {fixedCostCategories.map((c) => (
                <option key={c.id} value={c.name} />
              ))}
              <option value="Langganan / Software" />
              <option value="Tenaga Kerja" />
            </datalist>
          </label>
          <div className="grid gap-4 min-[420px]:grid-cols-2">
            <label className="block">
              <span className="field-label">Jumlah</span>
              <input name="amount" inputMode="numeric" required className="field tnum" placeholder="0" />
            </label>
            <label className="block">
              <span className="field-label">Periode</span>
              <select name="period" defaultValue="monthly" className="field">
                <option value="monthly">Bulanan</option>
                <option value="yearly">Tahunan</option>
                <option value="one_time">Sekali Bayar</option>
              </select>
            </label>
          </div>
          <div className="grid gap-4 min-[420px]:grid-cols-2">
            <label className="block">
              <span className="field-label">Mulai berlaku</span>
              <input name="startDate" type="date" defaultValue={todayISO()} className="field" />
            </label>
            <label className="block">
              <span className="field-label">Lama langganan (bulan)</span>
              <input
                name="durationMonths"
                type="number"
                inputMode="numeric"
                min={0}
                className="field tnum"
                placeholder="Opsional, mis. 12"
              />
            </label>
          </div>
          <label className="block">
            <span className="field-label">Catatan (opsional)</span>
            <input name="note" className="field" />
          </label>
        </ActionForm>
      </Disclosure>
    </>
  );
}
