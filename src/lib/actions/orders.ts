"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { flash } from "@/lib/flash";
import { prisma } from "@/lib/prisma";
import { orderStatusLabel } from "@/lib/labels";
import { formatIDRPlain } from "@/lib/format";
import { takeStock } from "@/lib/stock";
import { canChangeOrderStatus, isOrderOpen } from "@/lib/domain/order-status";
import { effectiveUnitPrice, orderPayment, paymentStatusFor, totals } from "@/lib/domain/payment";
import {
  type FormState,
  UserError,
  run,
  requireBusiness,
  findOrCreateChannel,
  salesIncomeCategoryId,
  ownCustomerId,
  parseAmount,
  parseDateField,
  parseItems,
  sumQtyByProduct,
  text,
  logActivity,
} from "./_helpers";

function revalidateOrderPages(orderId?: string) {
  if (orderId) revalidatePath(`/orders/${orderId}`);
  for (const p of ["/orders", "/sales", "/products", "/finance", "/receivables", "/dashboard"]) revalidatePath(p);
}

export async function createOrder(_prev: FormState, formData: FormData): Promise<FormState> {
  const business = await requireBusiness();
  let newId = "";

  const res = await run(async () => {
    const items = parseItems(formData.get("items"));
    if (items.length === 0) throw new UserError("Pilih minimal satu barang yang dipesan.");

    const productIds = [...new Set(items.map((i) => i.productId))];
    const products = await prisma.product.findMany({
      where: { id: { in: productIds }, businessId: business.id, status: { not: "inactive" } },
    });
    const byId = new Map(products.map((p) => [p.id, p]));
    if (byId.size !== productIds.length) throw new UserError("Ada produk yang tidak ditemukan atau sudah diarsipkan.");

    const priced = items.map((i) => ({
      productId: i.productId,
      quantity: i.quantity,
      unitPrice: effectiveUnitPrice(i.unitPrice, byId.get(i.productId)!.sellingPrice),
    }));
    const { discount, total } = totals(priced, parseAmount(formData.get("discount")));
    const payment = orderPayment(total, parseAmount(formData.get("downPayment")));
    const notes = text(formData.get("notes"));

    const [customerId, channelId] = await Promise.all([
      ownCustomerId(business.id, text(formData.get("customerId"))),
      findOrCreateChannel(business.id, text(formData.get("channel"))),
    ]);

    const order = await prisma.order.create({
      data: {
        businessId: business.id,
        customerId,
        channelId,
        status: "New",
        ...payment,
        total,
        dueDate: parseDateField(formData.get("dueDate")),
        notes: notes || null,
        // diskon keseluruhan disimpan di baris pertama
        items: {
          create: priced.map((p, idx) => ({
            productId: p.productId,
            quantity: p.quantity,
            price: p.unitPrice,
            discount: idx === 0 ? discount : 0,
          })),
        },
      },
    });
    newId = order.id;
    const first = byId.get(items[0].productId)!.name;
    await logActivity(
      business.id,
      "order.create",
      `Buat pesanan ${first}${items.length > 1 ? ` + ${items.length - 1} barang lain` : ""} — ${formatIDRPlain(total)}`
    );
  });

  if (res.error) return res;
  revalidatePath("/orders");
  revalidatePath("/dashboard");
  await flash("Pesanan dibuat");
  redirect(`/orders/${newId}`);
}

export async function advanceOrderStatus(_prev: FormState, formData: FormData): Promise<FormState> {
  const business = await requireBusiness();
  const orderId = text(formData.get("id"));
  const nextStatus = text(formData.get("status"));

  const res = await run(async () => {
    const order = await prisma.order.findFirst({
      where: { id: orderId, businessId: business.id },
      include: { customer: true },
    });
    if (!order) throw new UserError("Pesanan tidak ditemukan.");
    if (!canChangeOrderStatus(order.status, nextStatus)) {
      throw new UserError(
        isOrderOpen(order.status)
          ? "Status tidak valid."
          : `Pesanan ini sudah ${orderStatusLabel(order.status).toLowerCase()}. Muat ulang halaman.`
      );
    }

    if (nextStatus === "Completed") {
      await completeOrder(order.id);
    } else {
      // Bersyarat pada status lama: dua klik bersamaan tidak saling menimpa.
      const { count } = await prisma.order.updateMany({
        where: { id: order.id, status: order.status },
        data: { status: nextStatus },
      });
      if (count === 0) throw new UserError("Status pesanan baru saja berubah. Muat ulang halaman.");
    }

    const who = order.customer?.name ?? "tanpa nama";
    await logActivity(
      business.id,
      "order.status",
      nextStatus === "Cancelled"
        ? `Batalkan pesanan ${who}`
        : nextStatus === "Completed"
          ? `Selesaikan pesanan ${who} (jadi penjualan)`
          : `Ubah status pesanan ${who} → ${orderStatusLabel(nextStatus)}`
    );
  });

  if (res.error) return res;
  revalidateOrderPages(orderId);
  return { ok: true };
}

/** Pesanan selesai → jadi penjualan: stok berkurang, uang yang sudah diterima masuk Keuangan. */
async function completeOrder(orderId: string) {
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: { items: { include: { product: true } } },
  });
  if (!order) throw new UserError("Pesanan tidak ditemukan.");
  if (order.items.length === 0) throw new UserError("Pesanan tidak punya barang.");

  const qtyByProduct = sumQtyByProduct(order.items);
  for (const [productId, qty] of qtyByProduct) {
    const p = order.items.find((it) => it.productId === productId)!.product;
    if (qty > p.stock) throw new UserError(`Stok ${p.name} tidak cukup — tersisa ${p.stock}, dibutuhkan ${qty}. Tambah stok dulu.`);
  }

  const incomeCategoryId = await salesIncomeCategoryId(order.businessId);
  const amountReceived = order.total - order.remainingPayment;
  const subtotal = order.items.reduce((s, it) => s + it.quantity * it.price, 0);
  const discount = order.items.reduce((s, it) => s + it.discount, 0);
  const firstName = order.items[0].product.name;
  const description =
    order.items.length === 1
      ? `Penjualan ${firstName} (dari Pesanan)`
      : `Penjualan ${firstName} + ${order.items.length - 1} barang lain (dari Pesanan)`;

  await prisma.$transaction(async (tx) => {
    // Kunci status dulu: kalau pesanan sudah selesai/dibatalkan di tab lain, batalkan semuanya.
    const { count } = await tx.order.updateMany({
      where: { id: order.id, status: order.status },
      data: { status: "Completed" },
    });
    if (count === 0) throw new UserError("Pesanan ini baru saja diproses. Muat ulang halaman.");

    const sale = await tx.sale.create({
      data: {
        businessId: order.businessId,
        customerId: order.customerId,
        channelId: order.channelId,
        subtotal,
        discount,
        total: order.total,
        amountPaid: amountReceived,
        outstandingBalance: order.remainingPayment,
        paymentStatus: paymentStatusFor(order.total, amountReceived),
        orderId: order.id,
        items: {
          create: order.items.map((it) => ({
            productId: it.productId,
            quantity: it.quantity,
            unitPrice: it.price,
            lineTotal: it.quantity * it.price,
          })),
        },
      },
    });

    for (const [productId, qty] of qtyByProduct) await takeStock(tx, productId, qty);

    if (amountReceived > 0) {
      await tx.financialTransaction.create({
        data: {
          businessId: order.businessId,
          type: "INCOME",
          incomeCategoryId,
          description,
          amount: amountReceived,
          relatedSaleId: sale.id,
        },
      });
    }
  });
}

export async function recordOrderPayment(_prev: FormState, formData: FormData): Promise<FormState> {
  const business = await requireBusiness();
  const orderId = text(formData.get("orderId"));

  const res = await run(async () => {
    const amount = parseAmount(formData.get("amount"));
    const order = await prisma.order.findFirst({
      where: { id: orderId, businessId: business.id },
      include: { customer: true },
    });
    if (!order) throw new UserError("Pesanan tidak ditemukan.");
    if (!isOrderOpen(order.status)) {
      throw new UserError("Pesanan ini sudah selesai atau dibatalkan. Catat pelunasan lewat halaman penjualannya.");
    }
    if (amount <= 0) throw new UserError("Isi jumlah pembayaran.");
    if (amount > order.remainingPayment) throw new UserError("Jumlah melebihi sisa tagihan.");

    const newRemaining = order.remainingPayment - amount;
    // Bersyarat pada sisa lama: dua pembayaran bersamaan tidak bisa membuat sisa minus.
    const { count } = await prisma.order.updateMany({
      where: { id: order.id, remainingPayment: order.remainingPayment, status: order.status },
      data: {
        downPayment: order.downPayment + amount,
        remainingPayment: newRemaining,
        paymentStatus: paymentStatusFor(order.total, order.total - newRemaining),
      },
    });
    if (count === 0) throw new UserError("Pesanan baru saja berubah. Muat ulang halaman lalu coba lagi.");

    await logActivity(
      business.id,
      "order.payment",
      `Catat pembayaran pesanan ${order.customer?.name ?? "tanpa nama"} — ${formatIDRPlain(amount)}`
    );
  });

  if (res.error) return res;
  revalidateOrderPages(orderId);
  return { ok: true };
}
