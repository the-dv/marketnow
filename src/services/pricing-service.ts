import { createSupabaseServerClient } from "@/lib/supabase/server";
import type {
  ListEstimate,
  RegionContext,
  SuggestedPriceOrigin,
} from "@/types/domain";

type ListItemRow = {
  id: string;
  product_id: string;
  quantity: number;
  unit: "un" | "kg" | "L";
  paid_price: number | null;
  purchased_at: string | null;
  product:
    | Array<{
        id: string;
        name: string;
        unit: "un" | "kg" | "L";
      }>
    | {
        id: string;
        name: string;
        unit: "un" | "kg" | "L";
      }
    | null;
};

function pickRelatedProduct(
  product: ListItemRow["product"],
): { id: string; name: string; unit: "un" | "kg" | "L" } | null {
  if (!product) return null;
  if (Array.isArray(product)) return product[0] ?? null;
  return product;
}

type UserPriceRow = {
  product_id: string;
  paid_price: number;
  purchased_at: string;
};

type RegionalPriceRow = {
  product_id: string;
  region_type: "state" | "macro_region" | "national";
  region_code: string;
  avg_price: number;
  effective_date: string;
};

function pickLatestPrice(rows: UserPriceRow[]): number | undefined {
  if (rows.length === 0) return undefined;
  const sorted = [...rows].sort((a, b) => b.purchased_at.localeCompare(a.purchased_at));
  return sorted[0]?.paid_price;
}

function pickAveragePrice(rows: UserPriceRow[]): number | undefined {
  if (rows.length === 0) return undefined;
  const total = rows.reduce((acc, row) => acc + row.paid_price, 0);
  return Number((total / rows.length).toFixed(2));
}

function pickSeedPrice(
  rows: RegionalPriceRow[],
  regionContext: RegionContext,
): { price?: number; origin?: SuggestedPriceOrigin } {
  const sorted = [...rows].sort((a, b) => b.effective_date.localeCompare(a.effective_date));

  if (regionContext.uf) {
    const byState = sorted.find(
      (row) =>
        row.region_type === "state" &&
        row.region_code.toUpperCase() === regionContext.uf?.toUpperCase(),
    );

    if (byState) {
      return { price: byState.avg_price, origin: "seed_state" };
    }
  }

  if (regionContext.macroRegion) {
    const byMacro = sorted.find(
      (row) =>
        row.region_type === "macro_region" &&
        row.region_code.toUpperCase() === regionContext.macroRegion?.toUpperCase(),
    );

    if (byMacro) {
      return { price: byMacro.avg_price, origin: "seed_macro_region" };
    }
  }

  const byNational = sorted.find(
    (row) => row.region_type === "national" && row.region_code.toUpperCase() === "BR",
  );

  if (byNational) {
    return { price: byNational.avg_price, origin: "seed_national" };
  }

  return {};
}

export async function estimateListTotal(
  listId: string,
  regionContext: RegionContext,
): Promise<ListEstimate> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("AUTH_REQUIRED");
  }

  const { data: listItems, error: listItemsError } = await supabase
    .from("shopping_list_items")
    .select("id,product_id,quantity,unit,paid_price,purchased_at,product:products(id,name,unit)")
    .eq("shopping_list_id", listId);

  if (listItemsError) {
    throw new Error(listItemsError.message);
  }

  const typedItems = (listItems ?? []) as ListItemRow[];
  const productIds = [...new Set(typedItems.map((item) => item.product_id))];

  if (productIds.length === 0) {
    return {
      listId,
      currency: "BRL",
      items: [],
      estimatedTotal: 0,
    };
  }

  const { data: userPrices, error: userPricesError } = await supabase
    .from("user_product_prices")
    .select("product_id,paid_price,purchased_at")
    .eq("user_id", user.id)
    .in("product_id", productIds);

  if (userPricesError) {
    throw new Error(userPricesError.message);
  }

  const regionCodes = ["BR"];
  if (regionContext.uf) regionCodes.push(regionContext.uf.toUpperCase());
  if (regionContext.macroRegion) regionCodes.push(regionContext.macroRegion.toUpperCase());

  const { data: regionalPrices, error: regionalPricesError } = await supabase
    .from("regional_prices")
    .select("product_id,region_type,region_code,avg_price,effective_date")
    .in("product_id", productIds)
    .in("region_type", ["state", "macro_region", "national"])
    .in("region_code", regionCodes);

  if (regionalPricesError) {
    throw new Error(regionalPricesError.message);
  }

  const typedUserPrices = (userPrices ?? []) as UserPriceRow[];
  const typedRegionalPrices = (regionalPrices ?? []) as RegionalPriceRow[];

  const estimatedItems = typedItems.map((item) => {
    const product = pickRelatedProduct(item.product);
    const userRows = typedUserPrices.filter((row) => row.product_id === item.product_id);

    const lastUserPrice = pickLatestPrice(userRows);
    const avgUserPrice = pickAveragePrice(userRows);
    const seedRows = typedRegionalPrices.filter((row) => row.product_id === item.product_id);

    let unitPrice: number | undefined;
    let suggestedPriceOrigin: SuggestedPriceOrigin | undefined;

    if (lastUserPrice) {
      unitPrice = lastUserPrice;
      suggestedPriceOrigin = "user_last_price";
    } else if (avgUserPrice) {
      unitPrice = avgUserPrice;
      suggestedPriceOrigin = "user_avg_price";
    } else {
      const seedChoice = pickSeedPrice(seedRows, regionContext);
      unitPrice = seedChoice.price;
      suggestedPriceOrigin = seedChoice.origin;
    }

    const isPriceAvailable = Boolean(unitPrice && suggestedPriceOrigin);
    const safeUnitPrice = unitPrice ?? 0;
    const safeOrigin = suggestedPriceOrigin ?? "unavailable";
    const itemTotal = Number((safeUnitPrice * item.quantity).toFixed(2));

    return {
      itemId: item.id,
      productName: product?.name ?? "Produto",
      productId: item.product_id,
      quantity: item.quantity,
      unit: item.unit,
      unitPrice: safeUnitPrice,
      suggestedPriceOrigin: safeOrigin,
      itemTotal,
      isPriceAvailable,
      paidPrice: item.paid_price ?? undefined,
      purchasedAt: item.purchased_at ?? undefined,
    };
  });

  const estimatedTotal = Number(
    estimatedItems.reduce((acc, item) => acc + item.itemTotal, 0).toFixed(2),
  );

  return {
    listId,
    currency: "BRL",
    items: estimatedItems,
    estimatedTotal,
  };
}
