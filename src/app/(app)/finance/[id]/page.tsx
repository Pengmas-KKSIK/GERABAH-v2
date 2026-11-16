import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireContext } from "@/lib/guards";
import { deleteFinancialTransaction } from "@/lib/actions/finance";
import { formatIDR, formatDateLong } from "@/lib/format";
import { PageHeader } from "@/components/page-header";
import { Hero, HeroNote, DetailList, Callout } from "@/components/ui";
import { ActionButton } from "@/components/action-button";
import { IconTrash } from "@/components/icons";

export default async function FinanceDetailPage({ params }: PageProps<"/finance/[id]">) {
  const { id } = await params;
  const { business, role } = await requireContext();

  const tx = await prisma.financialTransaction.findFirst({
    where: { id, businessId: business.id },
    include: { incomeCategory: true, expenseCategory: true, paymentMethod: true },
  });
  if (!tx || (role === "staff" && tx.type === "INCOME")) notFound();

  const isIncome = tx.type === "INCOME";
  const rows: [string, string][] = [
    ["Jenis", isIncome ? "Uang Masuk" : "Uang Keluar"],
    ["Kategori", tx.incomeCategory?.name ?? tx.expenseCategory?.name ?? "Lainnya"],
    ["Tanggal", formatDateLong(tx.date)],
    ["Bayar pakai", tx.paymentMethod?.name ?? "Tunai"],
  ];
  if (tx.notes) rows.push(["Catatan", tx.notes]);

  return (
    <>
      <PageHeader title="Detail Catatan" back="/finance" />

      <Hero
        label={isIncome ? "Uang masuk" : "Uang keluar"}
        value={`${isIncome ? "+" : "−"}${formatIDR(tx.amount)}`}
        tone={isIncome ? "in" : "out"}
      >
        {tx.description && <HeroNote>{tx.description}</HeroNote>}
      </Hero>

      <DetailList rows={rows} className="mb-6" />

      {tx.relatedSaleId || tx.relatedWorkshopId ? (
        <Callout>
          Catatan ini otomatis dibuat dari {tx.relatedSaleId ? "sebuah penjualan" : "workshop"}, jadi tidak bisa
          dihapus dari sini.
        </Callout>
      ) : (
        <ActionButton
          action={deleteFinancialTransaction}
          hidden={{ id: tx.id }}
          confirm={{
            title: "Hapus catatan ini?",
            body: `${isIncome ? "Uang masuk" : "Uang keluar"} ${formatIDR(tx.amount)} akan hilang dari catatan dan saldo. Tidak bisa dikembalikan.`,
            confirmLabel: "Hapus",
            danger: true,
          }}
          className="btn btn-danger w-full"
          pendingLabel="Menghapus…"
        >
          <IconTrash className="h-4 w-4" strokeWidth={2} />
          Hapus Catatan
        </ActionButton>
      )}
    </>
  );
}
