import { describe, expect, it } from "vitest";
import { buildOrderedCategoryTotals } from "@/services/list-totals";

describe("buildOrderedCategoryTotals", () => {
  const order = [
    "Alimentos",
    "Bebidas",
    "Higiene",
    "Limpeza",
    "Utilidades",
    "Sem categoria",
  ];

  it("sums only purchased items with paidPrice", () => {
    const result = buildOrderedCategoryTotals(
      [
        { purchased: true, paidPrice: 10, categoryName: "Alimentos" },
        { purchased: true, paidPrice: 5.5, categoryName: "Alimentos" },
        { purchased: false, paidPrice: 3, categoryName: "Bebidas" },
        { purchased: true, paidPrice: null, categoryName: "Bebidas" },
      ],
      order,
    );

    expect(result).toEqual([{ categoryName: "Alimentos", total: 15.5 }]);
  });

  it("normalizes empty/Outros as Sem categoria", () => {
    const result = buildOrderedCategoryTotals(
      [
        { purchased: true, paidPrice: 9, categoryName: "Outros" },
        { purchased: true, paidPrice: 1, categoryName: "" },
      ],
      order,
    );

    expect(result).toEqual([{ categoryName: "Sem categoria", total: 10 }]);
  });
});
