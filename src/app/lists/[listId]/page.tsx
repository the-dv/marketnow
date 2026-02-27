import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { buttonClassName } from "@/components/ui/button";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { buildOrderedCategoryTotals } from "@/services/list-totals";
import { mapUfToMacroRegion } from "@/services/location-service";
import { estimateListTotal } from "@/services/pricing-service";
import { createUserProductAction } from "./actions";
import { CreateProductForm } from "./create-product-form";
import { MyProductsList } from "./my-products-list";

type ListRow = {
  id: string;
  name: string;
  status: "active" | "archived";
};

type CategoryRow = {
  id: string;
  slug: string;
  name: string;
};

type ProductCategory = {
  slug: string;
  name: string;
};

type UserProductRow = {
  id: string;
  name: string;
  unit: "un" | "kg" | "L";
  category_id: string | null;
  category: ProductCategory | ProductCategory[] | null;
};

type ProductPurchaseRow = {
  id: string;
  product_id: string;
  quantity: number;
  unit: "un" | "kg" | "L";
  purchased_at: string | null;
  paid_price: number | null;
  updated_at: string;
};

type UserPriceRow = {
  product_id: string;
  paid_price: number;
  purchased_at: string;
};

const CATEGORY_ORDER = ["alimentos", "bebidas", "higiene", "limpeza", "utilidades", "outros"];
const CATEGORY_TOTAL_ORDER = [
  "Alimentos",
  "Bebidas",
  "Higiene",
  "Limpeza",
  "Utilidades",
  "Sem categoria",
];

function formatCurrency(value: number) {
  return new Intl.NumberFormat("pt-BR", {
    style: "currency",
    currency: "BRL",
  }).format(value);
}

function getCategoryName(category: UserProductRow["category"]) {
  if (!category) {
    return "Sem categoria";
  }

  const resolvedCategory = Array.isArray(category) ? category[0] : category;
  if (!resolvedCategory) {
    return "Sem categoria";
  }

  if (resolvedCategory.slug === "outros") {
    return "Sem categoria";
  }

  return resolvedCategory.name;
}

export default async function ListDetailsPage({
  params,
}: {
  params: Promise<{ listId: string }>;
}) {
  const { listId } = await params;
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: listData } = await supabase
    .from("shopping_lists")
    .select("id,name,status")
    .eq("id", listId)
    .eq("user_id", user.id)
    .maybeSingle();

  if (!listData) {
    notFound();
  }

  const list = listData as ListRow;

  const { data: profile } = await supabase
    .from("profiles")
    .select("preferred_uf")
    .eq("id", user.id)
    .maybeSingle();

  const regionContext = {
    country: "BR" as const,
    uf: profile?.preferred_uf?.toUpperCase(),
    macroRegion: mapUfToMacroRegion(profile?.preferred_uf ?? undefined),
  };

  const estimate = await estimateListTotal(listId, regionContext);

  const { data: categories } = await supabase
    .from("categories")
    .select("id,name,slug")
    .in("slug", CATEGORY_ORDER);

  const categoryOrderMap = new Map(CATEGORY_ORDER.map((slug, index) => [slug, index]));
  const typedCategories = ((categories ?? []) as CategoryRow[]).sort((first, second) => {
    const firstOrder = categoryOrderMap.get(first.slug) ?? Number.MAX_SAFE_INTEGER;
    const secondOrder = categoryOrderMap.get(second.slug) ?? Number.MAX_SAFE_INTEGER;
    return firstOrder - secondOrder;
  });
  const outrosCategoryId = typedCategories.find((category) => category.slug === "outros")?.id ?? null;
  const editableCategories = typedCategories.filter((category) => category.slug !== "outros");

  const { data: userProducts } = await supabase
    .from("products")
    .select("id,name,unit,category_id,category:categories(name,slug)")
    .eq("owner_user_id", user.id)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  const typedUserProducts = (userProducts ?? []) as UserProductRow[];

  let typedPurchaseRows: ProductPurchaseRow[] = [];
  let typedUserPriceRows: UserPriceRow[] = [];
  if (typedUserProducts.length > 0) {
    const { data: purchaseRows } = await supabase
      .from("shopping_list_items")
      .select("id,product_id,quantity,unit,purchased_at,paid_price,updated_at")
      .eq("shopping_list_id", listId)
      .in(
        "product_id",
        typedUserProducts.map((product) => product.id),
      )
      .order("updated_at", { ascending: false });

    typedPurchaseRows = (purchaseRows ?? []) as ProductPurchaseRow[];

    const { data: userPriceRows } = await supabase
      .from("user_product_prices")
      .select("product_id,paid_price,purchased_at")
      .eq("user_id", user.id)
      .in(
        "product_id",
        typedUserProducts.map((product) => product.id),
      )
      .order("purchased_at", { ascending: false });

    typedUserPriceRows = (userPriceRows ?? []) as UserPriceRow[];
  }

  const purchaseByProductId = new Map<string, ProductPurchaseRow>();
  for (const row of typedPurchaseRows) {
    if (!purchaseByProductId.has(row.product_id)) {
      purchaseByProductId.set(row.product_id, row);
    }
  }

  const referencePriceByProductId = new Map<string, number>();
  for (const row of typedUserPriceRows) {
    if (!referencePriceByProductId.has(row.product_id)) {
      referencePriceByProductId.set(row.product_id, Number(row.paid_price));
    }
  }

  const myProducts = typedUserProducts.map((product) => {
    const purchase = purchaseByProductId.get(product.id);

    return {
      id: product.id,
      name: product.name,
      categoryId: product.category_id === outrosCategoryId ? null : product.category_id,
      categoryName: getCategoryName(product.category),
      quantity: purchase?.quantity ? Number(purchase.quantity) : 1,
      unit: purchase?.unit ?? product.unit,
      purchased: Boolean(purchase?.purchased_at),
      paidPrice: purchase?.paid_price ?? null,
      referencePrice: referencePriceByProductId.get(product.id) ?? null,
    };
  });

  const orderedCategoryTotals = buildOrderedCategoryTotals(
    myProducts.map((product) => ({
      purchased: product.purchased,
      paidPrice: product.paidPrice,
      categoryName: product.categoryName,
    })),
    CATEGORY_TOTAL_ORDER,
  );

  return (
    <main className="container container-wide stack-lg">
      <section className="card stack-sm">
        <div className="row-between">
          <h1 className="heading">{list.name}</h1>
          <Link className={buttonClassName({ variant: "dark" })} href="/dashboard">
            Voltar
          </Link>
        </div>
        <div className="row-status">
          <span className="text-muted">Status:</span>
          <span className="status-badge">{list.status === "active" ? "Ativa" : "Arquivada"}</span>
        </div>
      </section>

      <section className="card stack-sm">
        <h2 className="subheading">Cadastrar produto</h2>
        <CreateProductForm action={createUserProductAction} categories={editableCategories} listId={listId} />
      </section>

      <MyProductsList
        categories={editableCategories.map((category) => ({ id: category.id, name: category.name }))}
        listId={listId}
        products={myProducts}
      />

      <section className="card stack-sm">
        <div className="stack-sm">
          <div className="stack-sm">
            <h3 className="minor-heading">Total por categoria</h3>
            {orderedCategoryTotals.length === 0 ? (
              <p className="text-muted text-small">Nenhuma compra registrada ainda.</p>
            ) : (
              <div className="stack-xs">
                {orderedCategoryTotals.map((entry) => (
                  <p className="category-total-line text-small" key={entry.categoryName}>
                    <span>{entry.categoryName}</span>
                    <span className="category-total-value">{formatCurrency(entry.total)}</span>
                  </p>
                ))}
              </div>
            )}
          </div>

          <hr className="divider" />

          <div className="row-between">
            <h2 className="subheading">Total estimado</h2>
            <strong>{formatCurrency(estimate.estimatedTotal)}</strong>
          </div>
        </div>
      </section>
    </main>
  );
}

