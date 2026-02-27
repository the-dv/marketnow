"use client";

import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useToast } from "@/components/toast-provider";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";

type AuthErrorLike = {
  status?: number;
  name?: string;
  message?: string;
  code?: string;
};

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [isSending, setIsSending] = useState(false);
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

  function mapMagicLinkError(error: AuthErrorLike) {
    const normalizedStatus = Number(error.status ?? 0);
    const normalizedMessage = String(error.message ?? "").toLowerCase();
    const isRateLimitMessage =
      normalizedMessage.includes("rate limit") || normalizedMessage.includes("too many requests");

    if (normalizedStatus === 429 || isRateLimitMessage) {
      return "Muitas tentativas. Aguarde 60s e tente novamente.";
    }

    if (normalizedStatus === 400 || normalizedStatus === 422) {
      return "Nao foi possivel enviar o link. Verifique seu email e tente novamente.";
    }

    if (normalizedStatus === 403) {
      return "Login por email nao esta habilitado ou nao permitido.";
    }

    if (normalizedStatus === 404 || normalizedStatus === 500) {
      return "Falha temporaria. Tente novamente.";
    }

    if (normalizedStatus >= 500) {
      return "Falha temporaria. Tente novamente.";
    }

    return "Falha ao enviar Magic Link. Verifique configuracoes e tente novamente.";
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (isSending) {
      return;
    }

    setIsSending(true);
    try {
      const supabase = createSupabaseBrowserClient();
      const emailRedirectTo = `${window.location.origin}/auth/callback`;

      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { emailRedirectTo },
      });

      if (error) {
        const safeErrorSnapshot = {
          status: Number(error.status ?? 0) || undefined,
          code: (error as AuthErrorLike).code ?? undefined,
          msg: error.message ?? undefined,
        };

        if (process.env.NODE_ENV !== "production") {
          console.warn("[auth-otp]", safeErrorSnapshot);
        }

        pushToast({
          kind: "error",
          message: mapMagicLinkError({
            status: safeErrorSnapshot.status,
            code: safeErrorSnapshot.code,
            message: safeErrorSnapshot.msg,
          }),
        });
        return;
      }

      pushToast({
        kind: "success",
        message: "Magic Link enviado. Verifique seu email para continuar.",
      });
    } finally {
      setIsSending(false);
    }
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

      <Button disabled={isSending} type="submit">
        {isSending ? "Enviando..." : "Enviar Magic Link"}
      </Button>
    </form>
  );
}
