import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getSessionContext } from "@/lib/current-user";
import { rangeFileSuffix, resolveRange } from "@/lib/date-range";
import { paymentStatusLabel } from "@/lib/labels";
import { buildXlsxBuffer } from "@/lib/xlsx-export";

type ExportRow = {
  date: Date;
  invoice: string;
  customer: string;
  product: string;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  discount: number | null;
  saleTotal: number | null;
  channel: string;
  status: string;
};

/**
 * Rincian penjualan per barang. Diskon & total penjualan hanya di baris pertama tiap penjualan,
 * supaya kolom bisa langsung dijumlahkan di Excel tanpa terhitung dobel.
 */
export async function GET(request: Request) {
  const ctx = await getSessionContext();
  if (!ctx) return NextResponse.json({ error: "Belum login." }, { status: 401 });
  if (!ctx.business) return NextResponse.json({ error: "Usaha tidak ditemukan." }, { status: 404 });
  if (ctx.role !== "owner") return NextResponse.json({ error: "Hanya owner." }, { status: 403 });
  const business = ctx.business;

  const { searchParams } = new URL(request.url);
  const range = resolveRange(
    searchParams.get("period") ?? "month",
    searchParams.get("from") ?? undefined,
    searchParams.get("to") ?? undefined
  );

  const sales = await prisma.sale.findMany({
    where: { businessId: business.id, date: { gte: range.from, lte: range.to } },
    include: { items: { include: { product: true } }, customer: true, channel: true },
    orderBy: { date: "asc" },
  });

  const rows: ExportRow[] = sales.flatMap((s) =>
    s.items.map((i, idx) => ({
      date: s.date,
      invoice: s.id.slice(-6).toUpperCase(),
      customer: s.customer?.name ?? "Pelanggan umum",
      product: i.product.name,
      quantity: i.quantity,
      unitPrice: i.unitPrice,
      lineTotal: i.lineTotal,
      discount: idx === 0 ? s.discount : null,
      saleTotal: idx === 0 ? s.total : null,
      channel: s.channel?.name ?? "-",
      status: paymentStatusLabel(s.paymentStatus),
    }))
  );

  const buffer = await buildXlsxBuffer(rows, [
    { header: "Tanggal", get: (r) => r.date, width: 14 },
    { header: "No. Nota", get: (r) => r.invoice, width: 11 },
    { header: "Pelanggan", get: (r) => r.customer, width: 22 },
    { header: "Produk", get: (r) => r.product, width: 24 },
    { header: "Jumlah", get: (r) => r.quantity, width: 9 },
    { header: "Harga Satuan", get: (r) => r.unitPrice, width: 14 },
    { header: "Subtotal Barang", get: (r) => r.lineTotal, width: 16 },
    { header: "Diskon Nota", get: (r) => r.discount, width: 13 },
    { header: "Total Nota", get: (r) => r.saleTotal, width: 15 },
    { header: "Tempat Jualan", get: (r) => r.channel, width: 16 },
    { header: "Status Pembayaran", get: (r) => r.status, width: 18 },
  ]);

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="gerabara-laporan-${rangeFileSuffix(range)}.xlsx"`,
      "Cache-Control": "no-store",
    },
  });
}
