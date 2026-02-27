"use server";

import { revalidatePath } from "next/cache";
import { enforceRateLimit } from "@/lib/security/rate-limit";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { parseTrimmedString, parseUuid } from "@/lib/validation";

export type DashboardActionResult = {
  status: "success" | "error";
  message: string;
};

const DASHBOARD_WRITE_RATE_LIMIT = {
  maxHits: 20,
  windowMs: 60_000,
} as const;

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
  let name = "";
  try {
    name = parseTrimmedString(formData.get("name"), { minLength: 2, maxLength: 120 });
  } catch {
    return { status: "error", message: "Informe um nome de lista valido." };
  }

  try {
    const { supabase, userId } = await requireUserId();
    const rateLimitResult = enforceRateLimit({
      key: `dashboard:create:list:${userId}`,
      ...DASHBOARD_WRITE_RATE_LIMIT,
    });

    if (!rateLimitResult.allowed) {
      return { status: "error", message: "Muitas tentativas. Aguarde alguns segundos." };
    }

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
  let listId = "";
  let status: "active" | "archived" = "active";

  if (rawStatus !== "archived" && rawStatus !== "active") {
    return { status: "error", message: "Status invalido." };
  }

  status = rawStatus;

  try {
    listId = parseUuid(rawId);
  } catch {
    return { status: "error", message: "Lista invalida." };
  }

  try {
    const { supabase, userId } = await requireUserId();
    const rateLimitResult = enforceRateLimit({
      key: `dashboard:toggle-list-status:${userId}`,
      ...DASHBOARD_WRITE_RATE_LIMIT,
    });

    if (!rateLimitResult.allowed) {
      return { status: "error", message: "Muitas tentativas. Aguarde alguns segundos." };
    }

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
  let listId = "";
  try {
    listId = parseUuid(formData.get("listId"));
  } catch {
    return { status: "error", message: "Lista invalida." };
  }

  try {
    const { supabase, userId } = await requireUserId();
    const rateLimitResult = enforceRateLimit({
      key: `dashboard:delete-list:${userId}`,
      ...DASHBOARD_WRITE_RATE_LIMIT,
    });

    if (!rateLimitResult.allowed) {
      return { status: "error", message: "Muitas tentativas. Aguarde alguns segundos." };
    }

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
