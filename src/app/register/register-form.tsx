"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast-provider";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";
import { Button } from "@/components/ui/button";

type AuthErrorLike = {
  status?: number;
  code?: string;
  message?: string;
};

function mapSignUpError(error: AuthErrorLike) {
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

  if (normalizedCode === "user_already_exists" || normalizedMessage.includes("already registered")) {
    return "Este email ja possui conta. Faca login.";
  }

  if (normalizedStatus === 400 || normalizedStatus === 422) {
    return "Nao foi possivel criar conta. Verifique os dados e tente novamente.";
  }

  if (normalizedStatus === 403) {
    return "Cadastro por email/senha nao esta habilitado.";
  }

  if (normalizedStatus >= 500) {
    return "Falha temporaria. Tente novamente.";
  }

  return "Falha ao criar conta. Tente novamente.";
}

export function RegisterForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [cooldownUntilMs, setCooldownUntilMs] = useState<number | null>(null);
  const submitInFlightRef = useRef(false);
  const cooldownTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const router = useRouter();
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
    const normalizedPassword = password.trim();
    const normalizedConfirmPassword = confirmPassword.trim();

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

    if (normalizedPassword.length < 6) {
      pushToast({
        kind: "error",
        message: "A senha deve ter no minimo 6 caracteres.",
      });
      return;
    }

    if (normalizedPassword !== normalizedConfirmPassword) {
      pushToast({
        kind: "error",
        message: "As senhas nao conferem.",
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

    if (isSubmitting || submitInFlightRef.current) {
      return;
    }

    submitInFlightRef.current = true;
    setIsSubmitting(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const { data, error } = await supabase.auth.signUp({
        email: normalizedEmail,
        password: normalizedPassword,
      });

      if (process.env.NODE_ENV !== "production") {
        console.warn("[auth-register]", {
          status: Number(error?.status ?? 0) || undefined,
          code: (error as AuthErrorLike | null)?.code ?? undefined,
          msg: error?.message ?? undefined,
          hasUser: Boolean(data?.user),
          hasSession: Boolean(data?.session),
          identitiesCount: data?.user?.identities?.length ?? null,
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
          message: mapSignUpError(safeError),
        });
        return;
      }

      if (data.session) {
        pushToast({
          kind: "success",
          message: "Conta criada com sucesso.",
        });
        router.replace("/dashboard");
        router.refresh();
        return;
      }

      pushToast({
        kind: "success",
        message: "Cadastro enviado. Confirme o email para ativar sua conta antes de entrar.",
      });
      router.replace("/login");
      router.refresh();
    } finally {
      submitInFlightRef.current = false;
      setIsSubmitting(false);
    }
  }

  return (
    <form
      className="card stack-md"
      onSubmit={onSubmit}
      style={{ margin: "0 auto", maxWidth: "420px", padding: "1.5rem" }}
    >
      <h1 className="heading">Criar conta</h1>
      <p className="text-muted">Cadastre seu email e senha para usar o MarketNow.</p>

      <div className="stack-xs">
        <label className="label" htmlFor="register-email">
          Email
        </label>
        <input
          id="register-email"
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
        <label className="label" htmlFor="register-password">
          Senha
        </label>
        <input
          id="register-password"
          className="input"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          placeholder="Minimo de 6 caracteres"
          disabled={isSubmitting}
          required
        />
      </div>

      <div className="stack-xs">
        <label className="label" htmlFor="register-confirm-password">
          Confirmar senha
        </label>
        <input
          id="register-confirm-password"
          className="input"
          type="password"
          value={confirmPassword}
          onChange={(event) => setConfirmPassword(event.target.value)}
          placeholder="Confirme sua senha"
          disabled={isSubmitting}
          required
        />
      </div>

      <div className="row-actions" style={{ gap: "0.75rem" }}>
        <Button disabled={isSubmitting} type="submit">
          {isSubmitting ? "Criando..." : "Criar conta"}
        </Button>
        <Button
          disabled={isSubmitting}
          onClick={() => router.push("/login")}
          type="button"
          variant="dark"
        >
          Ja tenho conta
        </Button>
      </div>
    </form>
  );
}
