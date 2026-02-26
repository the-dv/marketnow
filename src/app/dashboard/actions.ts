"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

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

export async function createShoppingListAction(formData: FormData) {
  const rawName = formData.get("name");
  const name = typeof rawName === "string" ? rawName.trim() : "";

  if (!name || name.length > 120) {
    throw new Error("VALIDATION_ERROR");
  }

  const { supabase, userId } = await requireUserId();

  const { error } = await supabase.from("shopping_lists").insert({
    user_id: userId,
    name,
    status: "active",
  });

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
}

export async function toggleShoppingListStatusAction(formData: FormData) {
  const rawId = formData.get("listId");
  const rawStatus = formData.get("status");
  const listId = typeof rawId === "string" ? rawId : "";
  const status = rawStatus === "archived" ? "archived" : "active";

  if (!listId) {
    throw new Error("VALIDATION_ERROR");
  }

  const { supabase, userId } = await requireUserId();
  const { error } = await supabase
    .from("shopping_lists")
    .update({ status })
    .eq("id", listId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
}

export async function deleteShoppingListAction(formData: FormData) {
  const rawId = formData.get("listId");
  const listId = typeof rawId === "string" ? rawId : "";

  if (!listId) {
    throw new Error("VALIDATION_ERROR");
  }

  const { supabase, userId } = await requireUserId();
  const { error } = await supabase
    .from("shopping_lists")
    .delete()
    .eq("id", listId)
    .eq("user_id", userId);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard");
}

