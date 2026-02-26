import type { RegionContext, SuggestedPriceOrigin } from "@/types/domain";

export type UserPriceInput = {
  paidPrice: number;
  purchasedAt: string;
};

export type SeedPriceInput = {
  regionType: "state" | "macro_region" | "national";
  regionCode: string;
  avgPrice: number;
  effectiveDate: string;
};

export type SuggestedPriceResult = {
  unitPrice: number;
  origin: SuggestedPriceOrigin;
  isPriceAvailable: boolean;
};

function pickLatestUserPrice(rows: UserPriceInput[]): number | undefined {
  if (rows.length === 0) return undefined;
  const sorted = [...rows].sort((a, b) => b.purchasedAt.localeCompare(a.purchasedAt));
  const latest = sorted[0]?.paidPrice;
  if (latest && Number.isFinite(latest) && latest > 0) {
    return latest;
  }
  return undefined;
}

function pickAverageUserPrice(rows: UserPriceInput[]): number | undefined {
  const validRows = rows.filter((row) => Number.isFinite(row.paidPrice) && row.paidPrice > 0);
  if (validRows.length === 0) return undefined;
  const total = validRows.reduce((acc, row) => acc + row.paidPrice, 0);
  return Number((total / validRows.length).toFixed(2));
}

function pickSeedFallback(
  rows: SeedPriceInput[],
  regionContext: RegionContext,
): { unitPrice?: number; origin?: SuggestedPriceOrigin } {
  const sorted = [...rows].sort((a, b) => b.effectiveDate.localeCompare(a.effectiveDate));

  if (regionContext.uf) {
    const byState = sorted.find(
      (row) =>
        row.regionType === "state" &&
        row.regionCode.toUpperCase() === regionContext.uf?.toUpperCase(),
    );
    if (byState) return { unitPrice: byState.avgPrice, origin: "seed_state" };
  }

  if (regionContext.macroRegion) {
    const byMacro = sorted.find(
      (row) =>
        row.regionType === "macro_region" &&
        row.regionCode.toUpperCase() === regionContext.macroRegion?.toUpperCase(),
    );
    if (byMacro) return { unitPrice: byMacro.avgPrice, origin: "seed_macro_region" };
  }

  const byNational = sorted.find(
    (row) => row.regionType === "national" && row.regionCode.toUpperCase() === "BR",
  );
  if (byNational) return { unitPrice: byNational.avgPrice, origin: "seed_national" };

  return {};
}

export function resolveSuggestedPrice(
  userPrices: UserPriceInput[],
  seedPrices: SeedPriceInput[],
  regionContext: RegionContext,
): SuggestedPriceResult {
  const lastUserPrice = pickLatestUserPrice(userPrices);
  if (lastUserPrice) {
    return {
      unitPrice: lastUserPrice,
      origin: "user_last_price",
      isPriceAvailable: true,
    };
  }

  const avgUserPrice = pickAverageUserPrice(userPrices);
  if (avgUserPrice) {
    return {
      unitPrice: avgUserPrice,
      origin: "user_avg_price",
      isPriceAvailable: true,
    };
  }

  const seed = pickSeedFallback(seedPrices, regionContext);
  if (seed.unitPrice && seed.origin) {
    return {
      unitPrice: seed.unitPrice,
      origin: seed.origin,
      isPriceAvailable: true,
    };
  }

  return {
    unitPrice: 0,
    origin: "unavailable",
    isPriceAvailable: false,
  };
}
