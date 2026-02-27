"use server";

import { revalidatePath } from "next/cache";
import { createSupabaseServerClient } from "@/lib/supabase/server";

export type DashboardActionResult = {
  status: "success" | "error";
  message: string;
};

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

export async function createShoppingListAction(formData: FormData): Promise<DashboardActionResult> {
  const rawName = formData.get("name");
  const name = typeof rawName === "string" ? rawName.trim() : "";

  if (!name || name.length > 120) {
    return { status: "error", message: "Informe um nome de lista valido." };
  }

  try {
    const { supabase, userId } = await requireUserId();

    const { error } = await supabase.from("shopping_lists").insert({
      user_id: userId,
      name,
      status: "active",
    });

    if (error) {
      return { status: "error", message: "Nao foi possivel criar a lista." };
    }

    revalidatePath("/dashboard");
    return { status: "success", message: "Lista criada." };
  } catch {
    return { status: "error", message: "Falha de autenticacao ou permissao." };
  }
}

export async function toggleShoppingListStatusAction(
  formData: FormData,
): Promise<DashboardActionResult> {
  const rawId = formData.get("listId");
  const rawStatus = formData.get("status");
  const listId = typeof rawId === "string" ? rawId : "";
  const status = rawStatus === "archived" ? "archived" : "active";

  if (!listId) {
    return { status: "error", message: "Lista invalida." };
  }

  try {
    const { supabase, userId } = await requireUserId();
    const { error } = await supabase
      .from("shopping_lists")
      .update({ status })
      .eq("id", listId)
      .eq("user_id", userId);

    if (error) {
      return { status: "error", message: "Nao foi possivel atualizar o status da lista." };
    }

    revalidatePath("/dashboard");
    return {
      status: "success",
      message: status === "archived" ? "Lista arquivada." : "Lista reativada.",
    };
  } catch {
    return { status: "error", message: "Falha de autenticacao ou permissao." };
  }
}

export async function deleteShoppingListAction(formData: FormData): Promise<DashboardActionResult> {
  const rawId = formData.get("listId");
  const listId = typeof rawId === "string" ? rawId : "";

  if (!listId) {
    return { status: "error", message: "Lista invalida." };
  }

  try {
    const { supabase, userId } = await requireUserId();
    const { error } = await supabase
      .from("shopping_lists")
      .delete()
      .eq("id", listId)
      .eq("user_id", userId);

    if (error) {
      return { status: "error", message: "Nao foi possivel excluir a lista." };
    }

    revalidatePath("/dashboard");
    return { status: "success", message: "Lista excluida." };
  } catch {
    return { status: "error", message: "Falha de autenticacao ou permissao." };
  }
}
