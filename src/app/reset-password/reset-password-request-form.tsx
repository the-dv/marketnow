"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useToast } from "@/components/toast-provider";
import { Button } from "@/components/ui/button";
import { supabaseEnv } from "@/lib/supabase/env";

type AuthErrorLike = {
  status?: number;
  code?: string;
  message?: string;
};

function resolveAppUrl() {
  if (typeof window !== "undefined") {
    return window.location.origin;
  }

  const envAppUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  if (envAppUrl) {
    try {
      const parsed = new URL(envAppUrl);
      return parsed.origin;
    } catch {
      // fallback for empty origin
    }
  }

  return "";
}

function createResetPasswordRequestClient() {
  return createClient(supabaseEnv.url, supabaseEnv.anonKey, {
    auth: {
      flowType: "implicit",
      detectSessionInUrl: false,
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}

function mapResetRequestError(error: AuthErrorLike) {
  const status = Number(error.status ?? 0);
  const message = String(error.message ?? "").toLowerCase();
  const isRateLimit =
    status === 429 || message.includes("rate limit") || message.includes("too many requests");

  if (isRateLimit) {
    return "Limite de envio de emails do Supabase atingido. Aguarde e tente depois.";
  }

  if (status === 400 || status === 422) {
    return "Nao foi possivel enviar o link de redefinicao. Verifique o email.";
  }

  if (status >= 500) {
    return "Falha temporaria. Tente novamente em instantes.";
  }

  return "Nao foi possivel enviar o link de redefinicao.";
}

export function ResetPasswordRequestForm() {
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [cooldownUntilMs, setCooldownUntilMs] = useState<number | null>(null);
  const inFlightRef = useRef(false);
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { pushToast } = useToast();

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current);
      }
    };
  }, []);

  function getCooldownSecondsFromError(error: AuthErrorLike) {
    const normalizedMessage = String(error.message ?? "").toLowerCase();
    const match = normalizedMessage.match(/(\d{1,3})\s*(s|sec|seg|second|min|minute)/);

    if (!match) {
      return 60;
    }

    const parsed = Number(match[1]);
    if (!Number.isFinite(parsed)) {
      return 60;
    }

    const unit = match[2];
    const seconds = unit.startsWith("m") ? parsed * 60 : parsed;
    return Math.min(Math.max(seconds, 10), 300);
  }

  function isRateLimitError(error: AuthErrorLike) {
    const normalizedStatus = Number(error.status ?? 0);
    const normalizedMessage = String(error.message ?? "").toLowerCase();

    return (
      normalizedStatus === 429 ||
      normalizedMessage.includes("rate limit") ||
      normalizedMessage.includes("too many requests")
    );
  }

  function activateRateLimitCooldown(seconds: number) {
    const safeSeconds = Math.min(Math.max(seconds, 10), 300);
    const until = Date.now() + safeSeconds * 1000;
    setCooldownUntilMs(until);

    if (cooldownTimerRef.current) {
      clearTimeout(cooldownTimerRef.current);
    }

    cooldownTimerRef.current = setTimeout(() => {
      setCooldownUntilMs(null);
      cooldownTimerRef.current = null;
    }, safeSeconds * 1000);
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const normalizedEmail = email.trim();

    if (!normalizedEmail) {
      pushToast({
        kind: "error",
        message: "Informe seu email.",
      });
      return;
    }

    if (cooldownUntilMs && Date.now() < cooldownUntilMs) {
      const remainingSeconds = Math.max(1, Math.ceil((cooldownUntilMs - Date.now()) / 1000));
      pushToast({
        kind: "error",
        message: `Muitas tentativas. Aguarde ${remainingSeconds}s e tente novamente.`,
      });
      return;
    }

    if (isSending || inFlightRef.current) {
      return;
    }

    inFlightRef.current = true;
    setIsSending(true);

    try {
      const redirectTo = `${resolveAppUrl()}/reset-password/confirm`;
      if (process.env.NODE_ENV !== "production") {
        let resolvedPathname = "";
        let hasAppUrlEnv = false;
        try {
          hasAppUrlEnv = Boolean(process.env.NEXT_PUBLIC_APP_URL);
          resolvedPathname = new URL(redirectTo).pathname;
        } catch {
          resolvedPathname = "";
        }

        console.info("[auth-reset-request]", {
          pathname: typeof window !== "undefined" ? window.location.pathname : "",
          hasAppUrlEnv,
          redirectOrigin: redirectTo.replace(/\/reset-password\/confirm$/, ""),
          redirectPathname: resolvedPathname,
        });
      }

      const supabase = createResetPasswordRequestClient();
      const { error } = await supabase.auth.resetPasswordForEmail(normalizedEmail, { redirectTo });

      if (process.env.NODE_ENV !== "production") {
        console.warn("[auth-reset-request]", {
          status: Number(error?.status ?? 0) || undefined,
          code: (error as AuthErrorLike | null)?.code ?? undefined,
          msg: error?.message ?? undefined,
        });
      }

      if (error) {
        const safeError = {
          status: Number(error.status ?? 0) || undefined,
          code: (error as AuthErrorLike).code ?? undefined,
          message: error.message ?? undefined,
        };

        if (isRateLimitError(safeError)) {
          activateRateLimitCooldown(getCooldownSecondsFromError(safeError));
        }

        pushToast({
          kind: "error",
          message: mapResetRequestError(safeError),
        });
        return;
      }

      pushToast({
        kind: "success",
        message: "Se existir uma conta com este email, enviaremos um link de redefinicao.",
      });
    } finally {
      inFlightRef.current = false;
      setIsSending(false);
    }
  }

  return (
    <form className="card stack-md" onSubmit={onSubmit}>
      <h1 className="heading">Redefinir senha</h1>
      <p className="text-muted">Informe seu email para receber o link de redefinicao de senha.</p>

      <label className="label" htmlFor="reset-email">
        Email
      </label>
      <input
        id="reset-email"
        className="input"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="voce@exemplo.com"
        disabled={isSending}
        required
      />

      <Button disabled={isSending} type="submit">
        {isSending ? "Enviando..." : "Enviar link de redefinicao"}
      </Button>

      <div>
        <Link className="text-muted text-small" href="/login">
          Voltar para login
        </Link>
      </div>
    </form>
  );
}
