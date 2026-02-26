"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

const VALID_UNITS = new Set(["un", "kg", "L"]);

async function requireUserId() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    throw new Error("AUTH_REQUIRED");
  }

  return { supabase, userId: user.id };
}

async function assertListOwnership(listId: string, userId: string) {
  const supabase = await createSupabaseServerClient();
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

function parseQuantity(raw: FormDataEntryValue | null) {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("VALIDATION_ERROR");
  }
  return parsed;
}

function parseUnit(raw: FormDataEntryValue | null) {
  if (typeof raw !== "string" || !VALID_UNITS.has(raw)) {
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

export async function createUserProductAction(formData: FormData) {
  const listId = String(formData.get("listId") ?? "");
  const name = parseName(formData.get("productName"));
  const categoryId = String(formData.get("categoryId") ?? "");
  const unit = parseUnit(formData.get("unit"));

  if (!listId || !categoryId) {
    throw new Error("VALIDATION_ERROR");
  }

  const { supabase, userId } = await requireUserId();
  await assertListOwnership(listId, userId);

  const { data: category, error: categoryError } = await supabase
    .from("categories")
    .select("id")
    .eq("id", categoryId)
    .maybeSingle();

  if (categoryError || !category) {
    throw new Error("VALIDATION_ERROR");
  }

  const slug = createSlug(name, userId);
  const { error } = await supabase.from("products").insert({
    slug,
    name,
    owner_user_id: userId,
    category_id: categoryId,
    unit,
    is_active: true,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/lists/${listId}`);
}

export async function createListItemAction(formData: FormData) {
  const listId = String(formData.get("listId") ?? "");
  const productId = String(formData.get("productId") ?? "");
  const quantity = parseQuantity(formData.get("quantity"));
  const unit = parseUnit(formData.get("unit"));

  if (!listId || !productId) {
    throw new Error("VALIDATION_ERROR");
  }

  const { supabase, userId } = await requireUserId();
  await assertListOwnership(listId, userId);

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("unit,owner_user_id")
    .eq("id", productId)
    .eq("is_active", true)
    .maybeSingle();

  if (
    productError ||
    !product ||
    product.unit !== unit ||
    (product.owner_user_id !== null && product.owner_user_id !== userId)
  ) {
    throw new Error("VALIDATION_ERROR");
  }

  const { error } = await supabase.from("shopping_list_items").insert({
    shopping_list_id: listId,
    product_id: productId,
    quantity,
    unit,
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/lists/${listId}`);
}

export async function updateListItemAction(formData: FormData) {
  const listId = String(formData.get("listId") ?? "");
  const itemId = String(formData.get("itemId") ?? "");
  const productId = String(formData.get("productId") ?? "");
  const quantity = parseQuantity(formData.get("quantity"));
  const unit = parseUnit(formData.get("unit"));

  if (!listId || !itemId || !productId) {
    throw new Error("VALIDATION_ERROR");
  }

  const { supabase, userId } = await requireUserId();
  await assertListOwnership(listId, userId);

  const { data: product, error: productError } = await supabase
    .from("products")
    .select("unit,owner_user_id")
    .eq("id", productId)
    .eq("is_active", true)
    .maybeSingle();

  if (
    productError ||
    !product ||
    product.unit !== unit ||
    (product.owner_user_id !== null && product.owner_user_id !== userId)
  ) {
    throw new Error("VALIDATION_ERROR");
  }

  const { error } = await supabase
    .from("shopping_list_items")
    .update({ quantity, unit })
    .eq("id", itemId)
    .eq("shopping_list_id", listId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/lists/${listId}`);
}

function parsePaidPrice(raw: FormDataEntryValue | null) {
  const parsed = Number(raw);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error("VALIDATION_ERROR");
  }
  return Number(parsed.toFixed(2));
}

export async function markListItemPurchasedAction(formData: FormData) {
  const listId = String(formData.get("listId") ?? "");
  const itemId = String(formData.get("itemId") ?? "");
  const paidPrice = parsePaidPrice(formData.get("paidPrice"));
  const saveReference = formData.get("saveReference") === "on";

  if (!listId || !itemId) {
    throw new Error("VALIDATION_ERROR");
  }

  const { supabase, userId } = await requireUserId();
  await assertListOwnership(listId, userId);

  const { data: item, error: itemError } = await supabase
    .from("shopping_list_items")
    .select("id,product_id")
    .eq("id", itemId)
    .eq("shopping_list_id", listId)
    .maybeSingle();

  if (itemError || !item) {
    throw new Error("LIST_ITEM_NOT_FOUND");
  }

  const purchaseDate = new Date().toISOString();

  const { error: updateError } = await supabase
    .from("shopping_list_items")
    .update({
      paid_price: paidPrice,
      paid_currency: "BRL",
      purchased_at: purchaseDate,
    })
    .eq("id", itemId)
    .eq("shopping_list_id", listId);

  if (updateError) {
    throw new Error(updateError.message);
  }

  if (saveReference) {
    const { error: historyError } = await supabase.from("user_product_prices").insert({
      user_id: userId,
      product_id: item.product_id,
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
}

export async function deleteListItemAction(formData: FormData) {
  const listId = String(formData.get("listId") ?? "");
  const itemId = String(formData.get("itemId") ?? "");

  if (!listId || !itemId) {
    throw new Error("VALIDATION_ERROR");
  }

  const { supabase, userId } = await requireUserId();
  await assertListOwnership(listId, userId);

  const { error } = await supabase
    .from("shopping_list_items")
    .delete()
    .eq("id", itemId)
    .eq("shopping_list_id", listId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/lists/${listId}`);
}
