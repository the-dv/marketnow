export type RegionType = "state" | "macro_region" | "national";
export type Unit = "un" | "kg" | "L";
export type SuggestedPriceOrigin =
  | "user_last_price"
  | "user_avg_price"
  | "seed_state"
  | "seed_macro_region"
  | "seed_national"
  | "unavailable";

export type RegionContext = {
  country: "BR";
  uf?: string;
  macroRegion?: string;
};

export type ShoppingList = {
  id: string;
  userId: string;
  name: string;
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
};

export type ShoppingListItem = {
  id: string;
  shoppingListId: string;
  productId: string;
  quantity: number;
  unit: Unit;
};

export type Product = {
  id: string;
  slug: string;
  name: string;
  unit: Unit;
  categoryId: string | null;
  isActive: boolean;
};

export type EstimatedItem = {
  itemId: string;
  productName: string;
  productId: string;
  quantity: number;
  unit: Unit;
  unitPrice: number;
  suggestedPriceOrigin: SuggestedPriceOrigin;
  itemTotal: number;
  isPriceAvailable: boolean;
  paidPrice?: number;
  purchasedAt?: string;
};

export type ListEstimate = {
  listId: string;
  currency: "BRL";
  items: EstimatedItem[];
  estimatedTotal: number;
};
