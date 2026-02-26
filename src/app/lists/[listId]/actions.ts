"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const VALID_UNITS = new Set(["un", "kg", "L"]);

export type ProductFormState = {
  status: "idle" | "success" | "error";
  message: string;
};

export type PurchaseActionState = {
  status: "success" | "error";
  message: string;
};

async function requireUserContext() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("AUTH_REQUIRED");
  }

  return { supabase, userId: user.id };
}

async function assertListOwnership(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  listId: string,
  userId: string,
) {
  const { data, error } = await supabase
    .from("shopping_lists")
    .select("id")
    .eq("id", listId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) {
    throw new Error("FORBIDDEN");
  }
}

function parseUnit(raw: FormDataEntryValue | null) {
  if (typeof raw !== "string" || raw.trim() === "") {
    return "un" as const;
  }

  if (!VALID_UNITS.has(raw)) {
    throw new Error("VALIDATION_ERROR");
  }

  return raw as "un" | "kg" | "L";
}

function parseName(raw: FormDataEntryValue | null) {
  const value = typeof raw === "string" ? raw.trim() : "";
  if (!value || value.length > 120) {
    throw new Error("VALIDATION_ERROR");
  }
  return value;
}

function parseQuantityInput(raw: FormDataEntryValue | null) {
  if (typeof raw !== "string") {
    throw new Error("VALIDATION_ERROR");
  }

  const normalized = raw.trim().replace(/,/g, ".");
  const parsed = Number(normalized);

  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("VALIDATION_ERROR");
  }

  return Number(parsed.toFixed(3));
}

function createSlug(input: string, userId: string) {
  const base = input
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48);
  const suffix = `${Date.now()}-${userId.slice(0, 6)}`;
  return `${base || "produto"}-${suffix}`;
}

function parsePaidPriceInput(raw: FormDataEntryValue | null) {
  if (typeof raw !== "string") {
    throw new Error("VALIDATION_ERROR");
  }

  let normalized = raw.trim().replace(/\s/g, "").replace("R$", "");

  if (!normalized) {
    throw new Error("VALIDATION_ERROR");
  }

  const hasComma = normalized.includes(",");
  const hasDot = normalized.includes(".");

  if (hasComma && hasDot) {
    const lastComma = normalized.lastIndexOf(",");
    const lastDot = normalized.lastIndexOf(".");

    if (lastComma > lastDot) {
      normalized = normalized.replace(/\./g, "").replace(/,/g, ".");
    } else {
      normalized = normalized.replace(/,/g, "");
    }
  } else if (hasComma) {
    normalized = normalized.replace(/,/g, ".");
  }

  normalized = normalized.replace(/[^0-9.\-]/g, "");

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("VALIDATION_ERROR");
  }

  return Number(parsed.toFixed(2));
}

async function getOwnedProduct(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  productId: string,
  userId: string,
) {
  const { data: product, error } = await supabase
    .from("products")
    .select("id,unit,owner_user_id")
    .eq("id", productId)
    .eq("is_active", true)
    .maybeSingle();

  if (error || !product || product.owner_user_id !== userId) {
    throw new Error("FORBIDDEN");
  }

  return product;
}

async function getCurrentListItem(
  supabase: Awaited<ReturnType<typeof createSupabaseServerClient>>,
  listId: string,
  productId: string,
) {
  const { data, error } = await supabase
    .from("shopping_list_items")
    .select("id,quantity,unit")
    .eq("shopping_list_id", listId)
    .eq("product_id", productId)
    .order("updated_at", { ascending: false })
    .limit(1);

  if (error) {
    throw new Error(error.message);
  }

  return data?.[0] ?? null;
}

export async function createUserProductAction(
  _prevState: ProductFormState,
  formData: FormData,
): Promise<ProductFormState> {
  const listId = String(formData.get("listId") ?? "");
  let name = "";
  let unit: "un" | "kg" | "L" = "un";
  const rawCategoryId = String(formData.get("categoryId") ?? "").trim();

  if (!listId) {
    return { status: "error", message: "Lista invalida." };
  }

  try {
    name = parseName(formData.get("productName"));
    unit = parseUnit(formData.get("unit"));
  } catch {
    return { status: "error", message: "Nome do produto e obrigatorio." };
  }

  try {
    const { supabase, userId } = await requireUserContext();
    await assertListOwnership(supabase, listId, userId);

    let categoryId: string | null = null;
    if (rawCategoryId) {
      const { data: category, error: categoryError } = await supabase
        .from("categories")
        .select("id")
        .eq("id", rawCategoryId)
        .maybeSingle();

      if (categoryError || !category) {
        return { status: "error", message: "Categoria invalida." };
      }
      categoryId = rawCategoryId;
    }

    const slug = createSlug(name, userId);
    const { data: createdProduct, error } = await supabase
      .from("products")
      .insert({
        slug,
        name,
        owner_user_id: userId,
        category_id: categoryId,
        unit,
        is_active: true,
      })
      .select("id")
      .single();

    if (error || !createdProduct) {
      return { status: "error", message: "Nao foi possivel salvar o produto." };
    }

    const { error: addToListError } = await supabase.from("shopping_list_items").insert({
      shopping_list_id: listId,
      product_id: createdProduct.id,
      quantity: 1,
      unit,
    });

    if (addToListError) {
      return { status: "error", message: "Produto criado, mas nao foi adicionado a lista." };
    }

    revalidatePath(`/lists/${listId}`);
    return { status: "success", message: "Produto salvo com sucesso." };
  } catch {
    return { status: "error", message: "Falha de autenticacao ou permissao." };
  }
}

export async function updateProductListStateAction(
  formData: FormData,
): Promise<PurchaseActionState> {
  const listId = String(formData.get("listId") ?? "");
  const productId = String(formData.get("productId") ?? "");

  if (!listId || !productId) {
    return { status: "error", message: "Dados invalidos." };
  }

  let quantity = 1;
  let unit: "un" | "kg" | "L" = "un";

  try {
    quantity = parseQuantityInput(formData.get("quantity"));
    unit = parseUnit(formData.get("unit"));
  } catch {
    return { status: "error", message: "Quantidade ou unidade invalida." };
  }

  try {
    const { supabase, userId } = await requireUserContext();
    await assertListOwnership(supabase, listId, userId);
    await getOwnedProduct(supabase, productId, userId);

    const currentItem = await getCurrentListItem(supabase, listId, productId);

    if (currentItem) {
      const { error: updateError } = await supabase
        .from("shopping_list_items")
        .update({
          quantity,
          unit,
        })
        .eq("id", currentItem.id)
        .eq("shopping_list_id", listId);

      if (updateError) {
        throw new Error(updateError.message);
      }
    } else {
      const { error: insertError } = await supabase.from("shopping_list_items").insert({
        shopping_list_id: listId,
        product_id: productId,
        quantity,
        unit,
      });

      if (insertError) {
        throw new Error(insertError.message);
      }
    }

    revalidatePath(`/lists/${listId}`);
    return { status: "success", message: "Quantidade e unidade atualizadas." };
  } catch {
    return { status: "error", message: "Nao foi possivel atualizar o produto na lista." };
  }
}

export async function recordProductPurchaseAction(
  formData: FormData,
): Promise<PurchaseActionState> {
  const listId = String(formData.get("listId") ?? "");
  const productId = String(formData.get("productId") ?? "");
  const saveReference = formData.get("saveReference") === "on";

  if (!listId || !productId) {
    return { status: "error", message: "Dados da compra invalidos." };
  }

  let paidPrice = 0;
  try {
    paidPrice = parsePaidPriceInput(formData.get("paidPrice"));
  } catch {
    return { status: "error", message: "Informe um preco valido." };
  }

  try {
    const { supabase, userId } = await requireUserContext();
    await assertListOwnership(supabase, listId, userId);
    const product = await getOwnedProduct(supabase, productId, userId);

    const existingItem = await getCurrentListItem(supabase, listId, productId);
    const purchaseDate = new Date().toISOString();

    if (existingItem) {
      const quantity = Number(existingItem.quantity) > 0 ? Number(existingItem.quantity) : 1;
      const { error: updateError } = await supabase
        .from("shopping_list_items")
        .update({
          quantity,
          unit: existingItem.unit,
          purchased_at: purchaseDate,
          paid_price: paidPrice,
          paid_currency: "BRL",
        })
        .eq("id", existingItem.id)
        .eq("shopping_list_id", listId);

      if (updateError) {
        throw new Error(updateError.message);
      }
    } else {
      const { error: insertError } = await supabase.from("shopping_list_items").insert({
        shopping_list_id: listId,
        product_id: productId,
        quantity: 1,
        unit: product.unit,
        purchased_at: purchaseDate,
        paid_price: paidPrice,
        paid_currency: "BRL",
      });

      if (insertError) {
        throw new Error(insertError.message);
      }
    }

    if (saveReference) {
      const { error: historyError } = await supabase.from("user_product_prices").insert({
        user_id: userId,
        product_id: productId,
        paid_price: paidPrice,
        currency: "BRL",
        purchased_at: purchaseDate,
        source: "manual",
      });

      if (historyError) {
        throw new Error(historyError.message);
      }
    }

    revalidatePath(`/lists/${listId}`);
    return { status: "success", message: "Compra registrada com sucesso." };
  } catch {
    return { status: "error", message: "Nao foi possivel registrar a compra." };
  }
}

export async function clearProductPurchaseAction(formData: FormData): Promise<PurchaseActionState> {
  const listId = String(formData.get("listId") ?? "");
  const productId = String(formData.get("productId") ?? "");

  if (!listId || !productId) {
    return { status: "error", message: "Dados invalidos." };
  }

  try {
    const { supabase, userId } = await requireUserContext();
    await assertListOwnership(supabase, listId, userId);
    await getOwnedProduct(supabase, productId, userId);

    const existingItem = await getCurrentListItem(supabase, listId, productId);

    if (existingItem) {
      const { error: updateError } = await supabase
        .from("shopping_list_items")
        .update({
          purchased_at: null,
          paid_price: null,
          paid_currency: null,
        })
        .eq("id", existingItem.id)
        .eq("shopping_list_id", listId);

      if (updateError) {
        throw new Error(updateError.message);
      }
    }

    revalidatePath(`/lists/${listId}`);
    return { status: "success", message: "Item desmarcado." };
  } catch {
    return { status: "error", message: "Nao foi possivel atualizar o item." };
  }
}

export async function softDeleteUserProductAction(
  formData: FormData,
): Promise<PurchaseActionState> {
  const listId = String(formData.get("listId") ?? "");
  const productId = String(formData.get("productId") ?? "");

  if (!listId || !productId) {
    return { status: "error", message: "Dados invalidos." };
  }

  try {
    const { supabase, userId } = await requireUserContext();
    await assertListOwnership(supabase, listId, userId);

    const { data: deletedProduct, error: deleteError } = await supabase
      .from("products")
      .update({ is_active: false })
      .eq("id", productId)
      .eq("owner_user_id", userId)
      .eq("is_active", true)
      .select("id")
      .maybeSingle();

    if (deleteError || !deletedProduct) {
      return {
        status: "error",
        message: "Nao foi possivel excluir este produto. Verifique se ele pertence a sua conta.",
      };
    }

    revalidatePath(`/lists/${listId}`);
    return { status: "success", message: "Produto excluido com sucesso." };
  } catch {
    return { status: "error", message: "Nao foi possivel excluir o produto." };
  }
}
