"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/components/toast-provider";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";

const SUBMIT_DEBOUNCE_MS = 2_000;

type AuthErrorLike = {
  status?: number;
  name?: string;
  message?: string;
  code?: string;
};

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isCooldown, setIsCooldown] = useState(false);
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const callbackErrorToastShownRef = useRef(false);
  const searchParams = useSearchParams();
  const { pushToast } = useToast();
  const callbackError = useMemo(
    () => searchParams.get("error") === "auth_callback_failed",
    [searchParams],
  );

  useEffect(() => {
    if (!callbackError || callbackErrorToastShownRef.current) {
      return;
    }

    callbackErrorToastShownRef.current = true;
    pushToast({
      kind: "error",
      message: "Falha ao confirmar login. Solicite um novo Magic Link.",
    });
  }, [callbackError, pushToast]);

  useEffect(() => {
    return () => {
      if (cooldownTimerRef.current) {
        clearTimeout(cooldownTimerRef.current);
      }
    };
  }, []);

  function startSubmitCooldown() {
    setIsCooldown(true);
    if (cooldownTimerRef.current) {
      clearTimeout(cooldownTimerRef.current);
    }

    cooldownTimerRef.current = setTimeout(() => {
      setIsCooldown(false);
      cooldownTimerRef.current = null;
    }, SUBMIT_DEBOUNCE_MS);
  }

  function mapMagicLinkError(error: AuthErrorLike) {
    const normalizedStatus = Number(error.status ?? 0);

    if (normalizedStatus === 429) {
      return "Muitas tentativas. Aguarde 60s e tente novamente.";
    }

    if (normalizedStatus === 400 || normalizedStatus === 422) {
      return "Email invalido ou configuracao de login incompleta.";
    }

    if (normalizedStatus >= 500) {
      return "Falha temporaria do servico. Tente novamente em instantes.";
    }

    return "Nao foi possivel enviar o Magic Link. Tente novamente.";
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isLoading || isCooldown) {
      if (isCooldown) {
        pushToast({
          kind: "error",
          message: "Aguarde 2 segundos antes de tentar novamente.",
        });
      }
      return;
    }

    setIsLoading(true);
    startSubmitCooldown();

    const supabase = createSupabaseBrowserClient();
    const emailRedirectTo = `${window.location.origin}/auth/callback`;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo },
    });

    if (error) {
      const safeErrorSnapshot = {
        status: Number(error.status ?? 0) || undefined,
        name: error.name ?? undefined,
        message: error.message ?? undefined,
        code: (error as AuthErrorLike).code ?? undefined,
      };

      if (process.env.NODE_ENV !== "production") {
        console.warn("[Auth:signInWithOtp] failed", safeErrorSnapshot);
      }

      pushToast({
        kind: "error",
        message: mapMagicLinkError(safeErrorSnapshot),
      });
      setIsLoading(false);
      return;
    }

    pushToast({
      kind: "success",
      message: "Magic Link enviado. Verifique seu email para continuar.",
    });
    setIsLoading(false);
  }

  return (
    <form className="card stack-md" onSubmit={onSubmit}>
      <h1 className="heading">Entrar no MarketNow</h1>
      <p className="text-muted">
        Informe seu email para receber um Magic Link de acesso.
      </p>

      <label className="label" htmlFor="email">
        Email
      </label>
      <input
        id="email"
        className="input"
        type="email"
        value={email}
        onChange={(event) => setEmail(event.target.value)}
        placeholder="voce@exemplo.com"
        required
      />

      <Button disabled={isLoading || isCooldown} type="submit">
        {isLoading ? "Enviando..." : "Enviar Magic Link"}
      </Button>
    </form>
  );
}
