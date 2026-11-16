"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { flash } from "@/lib/flash";
import { prisma } from "@/lib/prisma";
import { formatIDRPlain } from "@/lib/format";
import {
  type FormState,
  UserError,
  run,
  requireContext,
  findOrCreatePaymentMethod,
  findOrCreateIncomeCategory,
  findOrCreateExpenseCategory,
  parseAmount,
  parseTransactionDate,
  text,
  logActivity,
} from "./_helpers";

export async function createFinancialTransaction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { business, role } = await requireContext();

  const res = await run(async () => {
    const type = text(formData.get("type")) === "INCOME" ? "INCOME" : "EXPENSE";
    if (type === "INCOME" && role === "staff") {
      throw new UserError("Staf hanya bisa mencatat uang keluar. Uang masuk otomatis dari penjualan.");
    }
    const categoryName = text(formData.get("category"));
    const description = text(formData.get("description"));
    const amount = parseAmount(formData.get("amount"));
    const notes = text(formData.get("notes"));
    if (amount <= 0) throw new UserError("Isi jumlah uangnya dulu.");

    const [paymentMethodId, incomeCategoryId, expenseCategoryId] = await Promise.all([
      findOrCreatePaymentMethod(business.id, text(formData.get("paymentMethod"))),
      type === "INCOME" ? findOrCreateIncomeCategory(business.id, categoryName) : null,
      type === "EXPENSE" ? findOrCreateExpenseCategory(business.id, categoryName) : null,
    ]);

    await prisma.financialTransaction.create({
      data: {
        businessId: business.id,
        type,
        incomeCategoryId,
        expenseCategoryId,
        description: description || null,
        amount,
        paymentMethodId,
        notes: notes || null,
        date: parseTransactionDate(formData.get("date")),
      },
    });
    await logActivity(
      business.id,
      type === "INCOME" ? "finance.income" : "finance.expense",
      `Catat ${type === "INCOME" ? "uang masuk" : "uang keluar"} ${formatIDRPlain(amount)}${
        description ? ` — ${description}` : categoryName ? ` — ${categoryName}` : ""
      }`
    );
  });

  if (res.error) return res;
  revalidatePath("/finance");
  revalidatePath("/dashboard");
  await flash("Catatan tersimpan");
  redirect("/finance");
}

export async function deleteFinancialTransaction(_prev: FormState, formData: FormData): Promise<FormState> {
  const { business, role } = await requireContext();
  const id = text(formData.get("id"));

  const res = await run(async () => {
    const tx = await prisma.financialTransaction.findFirst({ where: { id, businessId: business.id } });
    if (!tx) throw new UserError("Catatan tidak ditemukan.");
    if (role === "staff" && tx.type === "INCOME") throw new UserError("Staf tidak bisa menghapus catatan uang masuk.");
    if (tx.relatedSaleId) throw new UserError("Catatan ini dari penjualan — tidak bisa dihapus dari sini.");
    if (tx.relatedWorkshopId) throw new UserError("Catatan ini dari workshop — hapus lewat halaman Workshop.");
    await prisma.financialTransaction.delete({ where: { id: tx.id } });
    await logActivity(
      business.id,
      "finance.delete",
      `Hapus catatan ${tx.type === "INCOME" ? "uang masuk" : "uang keluar"} ${formatIDRPlain(tx.amount)}`
    );
  });

  if (res.error) return res;
  revalidatePath("/finance");
  revalidatePath("/dashboard");
  await flash("Catatan dihapus");
  redirect("/finance");
}
