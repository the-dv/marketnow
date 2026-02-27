import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase/server";

function resolveSafeRedirectPath(rawNext: string | null) {
  if (!rawNext) {
    return "/dashboard";
  }

  const normalized = rawNext.trim();
  if (!normalized.startsWith("/")) {
    return "/dashboard";
  }

  // Bloqueia redirect protocol-relative (//evil.com) e paths vazios.
  if (normalized.startsWith("//") || normalized.length === 0 || normalized.length > 1_000) {
    return "/dashboard";
  }

  return normalized;
}

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const safeNext = resolveSafeRedirectPath(url.searchParams.get("next"));

  if (code) {
    const supabase = await createSupabaseServerClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error) {
      return NextResponse.redirect(new URL(safeNext, url.origin));
    }
  }

  return NextResponse.redirect(new URL("/login?error=auth_callback_failed", url.origin));
}
