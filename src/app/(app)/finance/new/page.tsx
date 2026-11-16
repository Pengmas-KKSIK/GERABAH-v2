import { prisma } from "@/lib/prisma";
import { getSessionContext } from "@/lib/current-user";
import { createFinancialTransaction } from "@/lib/actions/finance";
import { todayISO } from "@/lib/date-range";
import { PageHeader } from "@/components/page-header";
import { Card, Callout } from "@/components/ui";
import { ActionForm, SubmitButton } from "@/components/form";
import { MoneyInput } from "@/components/money-input";

export default async function NewFinancePage({ searchParams }: PageProps<"/finance/new">) {
  const { type } = await searchParams;
  const ctx = await getSessionContext();
  if (!ctx?.business) return null;
  const business = ctx.business;

  // Staf tidak boleh mencatat uang masuk manual.
  const isIncome = type === "INCOME" && ctx.role !== "staff";
  const txType = isIncome ? "INCOME" : "EXPENSE";

  const [incomeCategories, expenseCategories, paymentMethods] = await Promise.all([
    prisma.incomeCategory.findMany({ where: { businessId: business.id }, orderBy: { name: "asc" } }),
    prisma.expenseCategory.findMany({ where: { businessId: business.id }, orderBy: { name: "asc" } }),
    prisma.paymentMethod.findMany({ where: { businessId: business.id }, orderBy: { name: "asc" } }),
  ]);
  const categories = isIncome ? incomeCategories : expenseCategories;

  return (
    <>
      <PageHeader
        title={isIncome ? "Catat Uang Masuk" : "Catat Uang Keluar"}
        subtitle={isIncome ? "Uang yang diterima usaha" : "Uang yang dikeluarkan usaha"}
        back="/finance"
      />

      <ActionForm
        action={createFinancialTransaction}
        hidden={{ type: txType }}
        footer={<SubmitButton>Simpan</SubmitButton>}
      >
        <Card>
          <label htmlFor="amount" className="field-label">Jumlah</label>
          <MoneyInput id="amount" name="amount" required autoFocus big tone={isIncome ? "in" : "out"} />
        </Card>

        <Card>
          <div className="flex flex-col gap-4">
            <label className="block">
              <span className="field-label">Untuk apa</span>
              <input
                name="description"
                className="field"
                placeholder={isIncome ? "mis. Penjualan kendi ke Bu Ani" : "mis. Beli tanah liat 2 karung"}
              />
            </label>

            <label className="block">
              <span className="field-label">Kategori</span>
              <input name="category" list="cat-opts" className="field" placeholder="Pilih atau ketik baru" />
              <datalist id="cat-opts">
                {categories.map((c) => (
                  <option key={c.id} value={c.name} />
                ))}
              </datalist>
            </label>

            <div className="grid grid-cols-2 gap-3">
              <label className="block">
                <span className="field-label">Tanggal</span>
                <input name="date" type="date" defaultValue={todayISO()} className="field" />
              </label>
              <label className="block">
                <span className="field-label">Bayar pakai</span>
                <input name="paymentMethod" list="pay-opts" className="field" placeholder="Tunai" />
                <datalist id="pay-opts">
                  {paymentMethods.map((p) => (
                    <option key={p.id} value={p.name} />
                  ))}
                </datalist>
              </label>
            </div>

            <label className="block">
              <span className="field-label">Catatan tambahan (opsional)</span>
              <textarea name="notes" rows={2} className="field" />
            </label>
          </div>
        </Card>

        <Callout>
          {isIncome
            ? "Catat hanya uang yang benar-benar diterima. Kalau pembeli belum bayar penuh, catat lewat Penjualan atau Pesanan supaya sisanya muncul di Belum Lunas."
            : "Catat juga pengeluaran kecil seperti bensin, tali, plastik, dan upah harian. Semakin lengkap, semakin tepat hitungan untung ruginya."}
        </Callout>
      </ActionForm>
    </>
  );
}
