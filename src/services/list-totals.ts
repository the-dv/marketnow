export type PurchasedItemForTotals = {
  purchased: boolean;
  paidPrice: number | null;
  categoryName: string;
};

function normalizeCategoryName(categoryName: string) {
  const normalized = categoryName.trim();
  if (!normalized || normalized === "Outros") {
    return "Sem categoria";
  }
  return normalized;
}

export function buildOrderedCategoryTotals(
  items: PurchasedItemForTotals[],
  displayOrder: string[],
) {
  const totals = new Map<string, number>();

  for (const item of items) {
    if (!item.purchased || item.paidPrice === null) {
      continue;
    }

    const name = normalizeCategoryName(item.categoryName);
    const current = totals.get(name) ?? 0;
    totals.set(name, Number((current + item.paidPrice).toFixed(2)));
  }

  return displayOrder
    .filter((categoryName) => totals.has(categoryName))
    .map((categoryName) => ({
      categoryName,
      total: totals.get(categoryName) ?? 0,
    }));
}
