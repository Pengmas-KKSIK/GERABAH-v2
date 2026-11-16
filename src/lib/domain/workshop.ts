/** Hitungan harga workshop — dipakai form (pratinjau) dan server (yang disimpan). */
export type WorkshopGiftLine = { quantity: number; unitCost: number };

export function computeWorkshop(
  gifts: WorkshopGiftLine[],
  operationalCost: number,
  profitMode: string,
  profitValue: number,
  participants: number
) {
  const giftCost = gifts.reduce((s, g) => s + g.quantity * g.unitCost, 0);
  const totalCost = giftCost + operationalCost;
  const targetProfit = profitMode === "percent" ? Math.round((totalCost * profitValue) / 100) : profitValue;
  const offerPrice = totalCost + targetProfit;
  const pricePerPerson = participants > 0 ? Math.round(offerPrice / participants) : 0;
  return { giftCost, totalCost, targetProfit, offerPrice, pricePerPerson };
}
