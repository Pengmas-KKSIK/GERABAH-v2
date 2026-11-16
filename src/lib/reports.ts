import { prisma } from "@/lib/prisma";
import { loadReceivables } from "@/lib/receivables";

export type CatAmount = { name: string; amount: number };

const sortedEntries = (map: Map<string, number>): CatAmount[] =>
  [...map.entries()].sort((a, b) => b[1] - a[1]).map(([name, amount]) => ({ name, amount }));

function addTo(map: Map<string, number>, key: string, amount: number) {
  map.set(key, (map.get(key) ?? 0) + amount);
}

/**
 * Semua angka laporan keuangan untuk satu periode — dipakai halaman Laporan dan PDF,
 * supaya keduanya tidak bisa berbeda hitungan.
 */
export async function loadFinancialReport(businessId: string, from: Date, to: Date) {
  const [txs, opening, sales, receivables, products] = await Promise.all([
    prisma.financialTransaction.findMany({
      where: { businessId, date: { gte: from, lte: to } },
      include: { incomeCategory: true, expenseCategory: true },
    }),
    prisma.financialTransaction.groupBy({
      by: ["type"],
      where: { businessId, date: { lt: from } },
      _sum: { amount: true },
    }),
    prisma.sale.findMany({ where: { businessId, date: { gte: from, lte: to } }, include: { channel: true } }),
    loadReceivables(businessId),
    prisma.product.findMany({ where: { businessId }, orderBy: { name: "asc" } }),
  ]);

  const openingIncome = opening.find((o) => o.type === "INCOME")?._sum.amount ?? 0;
  const openingExpense = opening.find((o) => o.type === "EXPENSE")?._sum.amount ?? 0;
  const openingBalance = openingIncome - openingExpense;

  const incomeMap = new Map<string, number>();
  const expenseMap = new Map<string, number>();
  for (const t of txs) {
    if (t.type === "INCOME") addTo(incomeMap, t.incomeCategory?.name ?? "Lainnya", t.amount);
    else addTo(expenseMap, t.expenseCategory?.name ?? "Lainnya", t.amount);
  }
  const totalIncome = [...incomeMap.values()].reduce((a, b) => a + b, 0);
  const totalExpense = [...expenseMap.values()].reduce((a, b) => a + b, 0);
  const netProfit = totalIncome - totalExpense;

  const channelMap = new Map<string, number>();
  for (const s of sales) addTo(channelMap, s.channel?.name ?? "Tanpa tempat", s.total);

  const inventory = products.map((p) => ({
    name: p.name,
    stock: p.stock,
    price: p.sellingPrice,
    value: p.stock * p.sellingPrice,
  }));

  return {
    hasActivity: txs.length > 0 || sales.length > 0,
    incomeByCat: sortedEntries(incomeMap),
    expenseByCat: sortedEntries(expenseMap),
    totalIncome,
    totalExpense,
    netProfit,
    margin: totalIncome > 0 ? (netProfit / totalIncome) * 100 : 0,
    openingBalance,
    closingBalance: openingBalance + netProfit,
    salesCount: sales.length,
    salesGross: sales.reduce((s, x) => s + x.subtotal, 0),
    salesDiscount: sales.reduce((s, x) => s + x.discount, 0),
    salesNet: sales.reduce((s, x) => s + x.total, 0),
    salesByChannel: sortedEntries(channelMap),
    receivables,
    totalReceivable: receivables.reduce((s, r) => s + r.amount, 0),
    inventory,
    totalInventoryValue: inventory.reduce((s, p) => s + p.value, 0),
  };
}
