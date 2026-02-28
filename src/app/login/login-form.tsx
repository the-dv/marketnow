"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldownUntilMs, setCooldownUntilMs] = useState<number | null>(null);
  const callbackErrorToastShownRef = useRef(false);
  const authInFlightRef = useRef(false);
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
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
      message: "Falha de autenticacao. Tente entrar novamente.",
    });
  }, [callbackError, pushToast]);

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

  function mapAuthError(error: AuthErrorLike) {
    const normalizedStatus = Number(error.status ?? 0);
    const normalizedCode = String(error.code ?? "").toLowerCase();
    const normalizedMessage = String(error.message ?? "").toLowerCase();
    const isRateLimit =
      normalizedStatus === 429 ||
      normalizedMessage.includes("rate limit") ||
      normalizedMessage.includes("too many requests");

    if (isRateLimit) {
      return "Muitas tentativas. Aguarde e tente novamente em instantes.";
    }

    if (normalizedCode === "invalid_credentials" || normalizedMessage.includes("invalid login credentials")) {
      return "Email ou senha invalidos.";
    }

    if (normalizedCode === "email_not_confirmed" || normalizedMessage.includes("email not confirmed")) {
      return "Confirme seu email antes de entrar.";
    }

    if (normalizedStatus === 400 || normalizedStatus === 422) {
      return "Nao foi possivel entrar. Verifique email e senha.";
    }

    if (normalizedStatus === 403) {
      return "Login por email/senha nao esta habilitado.";
    }

    if (normalizedStatus >= 500) {
      return "Falha temporaria. Tente novamente.";
    }

    return "Falha de autenticacao. Tente novamente.";
  }

  async function runSignIn() {
    const normalizedEmail = email.trim();
    const normalizedPassword = password;

    if (!normalizedEmail) {
      pushToast({
        kind: "error",
        message: "Informe seu email.",
      });
      return;
    }

    if (!normalizedPassword) {
      pushToast({
        kind: "error",
        message: "Informe sua senha.",
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

    if (isSubmitting || authInFlightRef.current) {
      return;
    }

    authInFlightRef.current = true;
    setIsSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const response = await supabase.auth.signInWithPassword({
        email: normalizedEmail,
        password: normalizedPassword,
      });
      const { error } = response;

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
          message: mapAuthError(safeError),
        });
        return;
      }

      pushToast({
        kind: "success",
        message: "Login realizado com sucesso.",
      });
      router.replace("/dashboard");
      router.refresh();
    } finally {
      authInFlightRef.current = false;
      setIsSubmitting(false);
    }
  }

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    await runSignIn();
  }

  return (
    <form
      className="card stack-md"
      onSubmit={onSubmit}
      style={{ margin: "0 auto", maxWidth: "420px", padding: "1.5rem" }}
    >
      <h1 className="heading">Entrar no MarketNow</h1>
      <p className="text-muted">
        Entre com seu email e senha para acessar suas listas.
      </p>

      <div className="stack-xs">
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
          disabled={isSubmitting}
          required
        />
      </div>

      <div className="stack-xs">
        <label className="label" htmlFor="password">
          Senha
        </label>
        <input
          id="password"
          className="input"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Sua senha"
          disabled={isSubmitting}
          required
        />
      </div>

      <div className="row-actions" style={{ gap: "0.75rem" }}>
        <Button disabled={isSubmitting} type="submit">
          {isSubmitting ? "Entrando..." : "Entrar"}
        </Button>
        <Button
          disabled={isSubmitting}
          onClick={() => router.push("/register")}
          type="button"
          variant="dark"
        >
          Criar conta
        </Button>
      </div>

      <div>
        <Link className="text-muted text-small" href="/reset-password">
          Esqueci minha senha
        </Link>
      </div>
    </form>
  );
}
