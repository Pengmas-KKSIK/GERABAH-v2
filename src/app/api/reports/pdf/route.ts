import { prisma } from "@/lib/prisma";
import { getSessionContext } from "@/lib/current-user";
import { rangeFileSuffix, resolveRange } from "@/lib/date-range";
import { paymentStatusLabel } from "@/lib/labels";
import { loadFinancialReport } from "@/lib/reports";
import { buildFinancialReportPdf } from "@/lib/reports-pdf";

export async function GET(request: Request) {
  const ctx = await getSessionContext();
  if (!ctx) return new Response("Belum login.", { status: 401 });
  if (!ctx.business) return new Response("Usaha tidak ditemukan.", { status: 404 });
  if (ctx.role !== "owner") return new Response("Hanya owner yang bisa mengunduh laporan.", { status: 403 });
  const business = ctx.business;

  const { searchParams } = new URL(request.url);
  const range = resolveRange(
    searchParams.get("period") ?? "month",
    searchParams.get("from") ?? undefined,
    searchParams.get("to") ?? undefined
  );

  const [r, owner] = await Promise.all([
    loadFinancialReport(business.id, range.from, range.to),
    prisma.user.findUnique({ where: { id: business.ownerId } }),
  ]);

  const bytes = await buildFinancialReportPdf({
    businessName: business.name,
    location: business.location,
    ownerName: owner?.name ?? null,
    periodLabel: range.label,
    printedAt: new Date(),
    ...r,
    receivables: r.receivables.map((x) => ({
      customer: x.customerName ?? "Tanpa nama",
      due: x.dueDate,
      amount: x.amount,
      status: paymentStatusLabel(x.status),
      kind: x.kind === "order" ? "Pesanan" : "Penjualan",
    })),
  });

  const disposition = searchParams.get("download") === "1" ? "attachment" : "inline";
  return new Response(new Uint8Array(bytes), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `${disposition}; filename="Laporan-Keuangan-${rangeFileSuffix(range)}.pdf"`,
      "Cache-Control": "no-store",
    },
  });
}
