import { createSupabaseServerClient } from "@/lib/supabase/server";
import type { ListEstimate, RegionContext } from "@/types/domain";
import { resolveSuggestedPrice } from "@/services/pricing-logic";

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
        is_active: boolean;
      }>
    | {
        id: string;
        name: string;
        unit: "un" | "kg" | "L";
        is_active: boolean;
      }
    | null;
};

function pickRelatedProduct(
  product: ListItemRow["product"],
): { id: string; name: string; unit: "un" | "kg" | "L"; is_active: boolean } | null {
  if (!product) return null;
  if (Array.isArray(product)) return product[0] ?? null;
  return product;
}

type RegionalPriceRow = {
  product_id: string;
  region_type: "state" | "macro_region" | "national";
  region_code: string;
  avg_price: number;
  effective_date: string;
};

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
    .select("id,product_id,quantity,unit,paid_price,purchased_at,product:products(id,name,unit,is_active)")
    .eq("shopping_list_id", listId);

  if (listItemsError) {
    throw new Error(listItemsError.message);
  }

  const typedItems = (listItems ?? []) as ListItemRow[];
  const activeItems = typedItems.filter((item) => {
    const product = pickRelatedProduct(item.product);
    return Boolean(product?.is_active);
  });

  const productIds = [...new Set(activeItems.map((item) => item.product_id))];

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

  const typedUserPrices = (userPrices ?? []) as Array<{
    product_id: string;
    paid_price: number;
    purchased_at: string;
  }>;
  const typedRegionalPrices = (regionalPrices ?? []) as RegionalPriceRow[];

  const userPricesByProductId = new Map<
    string,
    Array<{ paid_price: number; purchased_at: string }>
  >();
  for (const row of typedUserPrices) {
    const existingRows = userPricesByProductId.get(row.product_id) ?? [];
    existingRows.push({
      paid_price: row.paid_price,
      purchased_at: row.purchased_at,
    });
    userPricesByProductId.set(row.product_id, existingRows);
  }

  const seedPricesByProductId = new Map<string, RegionalPriceRow[]>();
  for (const row of typedRegionalPrices) {
    const existingRows = seedPricesByProductId.get(row.product_id) ?? [];
    existingRows.push(row);
    seedPricesByProductId.set(row.product_id, existingRows);
  }

  const estimatedItems = activeItems.map((item) => {
    const product = pickRelatedProduct(item.product);
    const userRows = userPricesByProductId.get(item.product_id) ?? [];
    const seedRows = seedPricesByProductId.get(item.product_id) ?? [];
    const suggestion = resolveSuggestedPrice(
      userRows.map((row) => ({
        paidPrice: row.paid_price,
        purchasedAt: row.purchased_at,
      })),
      seedRows.map((row) => ({
        regionType: row.region_type,
        regionCode: row.region_code,
        avgPrice: row.avg_price,
        effectiveDate: row.effective_date,
      })),
      regionContext,
    );

    const safeUnitPrice = suggestion.unitPrice;
    const safeOrigin = suggestion.origin;
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
      isPriceAvailable: suggestion.isPriceAvailable,
      paidPrice: item.paid_price ?? undefined,
      purchasedAt: item.purchased_at ?? undefined,
    };
  });

  const estimatedTotal = Number(
    estimatedItems
      .reduce((acc, item) => {
        if (!item.purchasedAt || item.paidPrice === undefined) {
          return acc;
        }

        return acc + item.paidPrice;
      }, 0)
      .toFixed(2),
  );

  return {
    listId,
    currency: "BRL",
    items: estimatedItems,
    estimatedTotal,
  };
}
