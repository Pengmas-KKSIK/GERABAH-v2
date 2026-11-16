"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { flash } from "@/lib/flash";
import { prisma } from "@/lib/prisma";
import { formatIDRPlain } from "@/lib/format";
import { takeStock } from "@/lib/stock";
import { effectiveUnitPrice, salePayment, totals } from "@/lib/domain/payment";
import {
  type FormState,
  UserError,
  run,
  requireBusiness,
  findOrCreateChannel,
  findOrCreatePaymentMethod,
  salesIncomeCategoryId,
  ownCustomerId,
  parseAmount,
  parseTransactionDate,
  parseItems,
  sumQtyByProduct,
  text,
  logActivity,
} from "./_helpers";

function describeItems(names: string[], suffix = "") {
  const base = names.length === 1 ? `Penjualan ${names[0]}` : `Penjualan ${names[0]} + ${names.length - 1} barang lain`;
  return base + suffix;
}

export async function createSale(_prev: FormState, formData: FormData): Promise<FormState> {
  const business = await requireBusiness();
  let newId = "";

  const res = await run(async () => {
    const items = parseItems(formData.get("items"));
    if (items.length === 0) throw new UserError("Pilih minimal satu barang yang dijual.");

    const productIds = [...new Set(items.map((i) => i.productId))];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, businessId: business.id, status: { not: "inactive" } },
    });
    const byId = new Map(products.map((p) => [p.id, p]));
    if (byId.size !== productIds.length) throw new UserError("Ada produk yang tidak ditemukan atau sudah diarsipkan.");

    // Cek awal agar pesan ramah; pengaman sebenarnya ada di takeStock (atomik, dalam transaksi).
    for (const [productId, qty] of sumQtyByProduct(items)) {
      const p = byId.get(productId)!;
      if (qty > p.stock) throw new UserError(`Stok ${p.name} tidak cukup — tersisa ${p.stock}, dibutuhkan ${qty}.`);
    }

    const lineItems = items.map((i) => {
      const unitPrice = effectiveUnitPrice(i.unitPrice, byId.get(i.productId)!.sellingPrice);
      return { productId: i.productId, quantity: i.quantity, unitPrice, lineTotal: i.quantity * unitPrice };
    });
    const { subtotal, discount, total } = totals(lineItems, parseAmount(formData.get("discount")));
    const payment = salePayment(total, text(formData.get("paymentStatus")), parseAmount(formData.get("amountPaid")));
    const when = parseTransactionDate(formData.get("date"));
    const notes = text(formData.get("notes"));
    const description = describeItems(items.map((i) => byId.get(i.productId)!.name));

    const [customerId, channelId, paymentMethodId, incomeCategoryId] = await Promise.all([
      ownCustomerId(business.id, text(formData.get("customerId"))),
      findOrCreateChannel(business.id, text(formData.get("channel"))),
      findOrCreatePaymentMethod(business.id, text(formData.get("paymentMethod"))),
      salesIncomeCategoryId(business.id),
    ]);

    const sale = await prisma.$transaction(async (tx) => {
      const created = await tx.sale.create({
        data: {
          businessId: business.id,
          customerId,
          channelId,
          date: when,
          subtotal,
          discount,
          total,
          ...payment,
          paymentMethodId,
          notes: notes || null,
          items: { create: lineItems },
        },
      });

      for (const [productId, qty] of sumQtyByProduct(items)) await takeStock(tx, productId, qty);

      if (payment.amountPaid > 0) {
        await tx.financialTransaction.create({
          data: {
            businessId: business.id,
            type: "INCOME",
            incomeCategoryId,
            description,
            amount: payment.amountPaid,
            paymentMethodId,
            relatedSaleId: created.id,
            date: when,
          },
        });
      }
      return created;
    });
    newId = sale.id;
    await logActivity(business.id, "sale.create", `Catat ${description.toLowerCase()} — ${formatIDRPlain(total)}`);
  });

  if (res.error) return res;
  revalidatePath("/sales");
  revalidatePath("/products");
  revalidatePath("/finance");
  revalidatePath("/dashboard");
  await flash("Penjualan tersimpan");
  redirect(`/sales/${newId}`);
}

export async function markSalePaid(_prev: FormState, formData: FormData): Promise<FormState> {
  const business = await requireBusiness();
  const saleId = text(formData.get("id"));
  let remaining = 0;

  const res = await run(async () => {
    const sale = await prisma.sale.findFirst({ where: { id: saleId, businessId: business.id } });
    if (!sale) throw new UserError("Penjualan tidak ditemukan.");
    if (sale.outstandingBalance <= 0) return;
    remaining = sale.outstandingBalance;
    const incomeCategoryId = await salesIncomeCategoryId(business.id);

    const paid = await prisma.$transaction(async (tx) => {
      // Bersyarat: klik ganda / dua tab tidak bisa mencatat pelunasan dua kali.
      const { count } = await tx.sale.updateMany({
        where: { id: sale.id, outstandingBalance: { gt: 0 } },
        data: { amountPaid: sale.total, outstandingBalance: 0, paymentStatus: "Paid" },
      });
      if (count === 0) return false;

      await tx.financialTransaction.create({
        data: {
          businessId: business.id,
          type: "INCOME",
          incomeCategoryId,
          description: "Pelunasan penjualan",
          amount: remaining,
          paymentMethodId: sale.paymentMethodId,
          relatedSaleId: sale.id,
        },
      });
      // Penjualan dari pesanan: pesanan aslinya ikut lunas supaya tidak tampil sebagai tagihan.
      if (sale.orderId) {
        await tx.order.update({
          where: { id: sale.orderId },
          data: { remainingPayment: 0, downPayment: sale.total, paymentStatus: "Paid" },
        });
      }
      return true;
    });
    if (paid) {
      await logActivity(business.id, "sale.paid", `Tandai penjualan lunas — pelunasan ${formatIDRPlain(remaining)}`);
    }
  });

  if (res.error) return res;
  revalidatePath(`/sales/${saleId}`);
  revalidatePath("/sales");
  revalidatePath("/orders");
  revalidatePath("/receivables");
  revalidatePath("/finance");
  revalidatePath("/dashboard");
  return { ok: true };
}
