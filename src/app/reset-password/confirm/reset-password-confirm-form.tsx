"use client";

import Link from "next/link";
import { FormEvent, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/toast-provider";
import { Button } from "@/components/ui/button";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type AuthErrorLike = {
  status?: number;
  code?: string;
  message?: string;
};

type EmailOtpType = "signup" | "invite" | "magiclink" | "recovery" | "email_change" | "email";

const isDev = process.env.NODE_ENV !== "production";
const supportedOtpTypes = ["signup", "invite", "magiclink", "recovery", "email_change", "email"] as const;

function devLog(event: string, payload?: unknown) {
  if (!isDev) {
    return;
  }

  console.info("[reset-password-confirm]", event, payload ?? "");
}

function mapRecoverySessionError(error: AuthErrorLike) {
  const status = Number(error.status ?? 0);
  const message = String(error.message ?? "").toLowerCase();

  if (status === 401 || message.includes("session") || message.includes("expired")) {
    return "Link de redefinicao invalido ou expirado. Solicite um novo link.";
  }

  if (status === 400 || status === 422 || message.includes("code verifier")) {
    return "Link de redefinicao invalido ou expirado. Solicite um novo link.";
  }

  if (status >= 500) {
    return "Falha temporaria. Tente novamente em instantes.";
  }

  return "Nao foi possivel validar o link de redefinicao.";
}

function resolveEmailOtpType(rawType: string | null): EmailOtpType {
  if (!rawType) {
    return "recovery";
  }

  const normalized = rawType.trim().toLowerCase();
  return supportedOtpTypes.includes(normalized as (typeof supportedOtpTypes)[number])
    ? (normalized as EmailOtpType)
    : "recovery";
}

function readRecoveryLinkParams() {
  const queryParams = new URLSearchParams(window.location.search);
  const hashParams = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const readParam = (key: string) => queryParams.get(key) ?? hashParams.get(key);

  return {
    code: readParam("code"),
    token: readParam("token"),
    tokenHash: readParam("token_hash"),
    type: readParam("type"),
    accessToken: readParam("access_token"),
    refreshToken: readParam("refresh_token"),
  };
}

function mapUpdatePasswordError(error: AuthErrorLike) {
  const status = Number(error.status ?? 0);
  const message = String(error.message ?? "").toLowerCase();

  if (status === 401 || message.includes("session")) {
    return "Link de redefinicao invalido ou expirado. Solicite um novo link.";
  }

  if (status === 400 || status === 422) {
    return "Nao foi possivel atualizar a senha. Verifique os dados informados.";
  }

  if (status >= 500) {
    return "Falha temporaria. Tente novamente em instantes.";
  }

  return "Nao foi possivel atualizar a senha.";
}

export function ResetPasswordConfirmForm() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isPreparing, setIsPreparing] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isRecoveryReady, setIsRecoveryReady] = useState(false);
  const prepareOnceRef = useRef(false);
  const saveInFlightRef = useRef(false);
  const { pushToast } = useToast();
  const router = useRouter();

  useEffect(() => {
    devLog("state-change", {
      isPreparing,
      isSaving,
      isRecoveryReady,
    });
  }, [isPreparing, isSaving, isRecoveryReady]);

  useEffect(() => {
    if (prepareOnceRef.current) {
      return;
    }
    prepareOnceRef.current = true;

    async function prepareRecoverySession() {
      const supabase = createSupabaseBrowserClient();
      const params = readRecoveryLinkParams();
      const maskedParams = {
        pathname: window.location.pathname,
        hasCode: Boolean(params.code),
        hasToken: Boolean(params.token),
        hasTokenHash: Boolean(params.tokenHash),
        hasType: Boolean(params.type),
        hasAccessToken: Boolean(params.accessToken),
        hasRefreshToken: Boolean(params.refreshToken),
      };

      devLog("prepare-start", maskedParams);
      setIsRecoveryReady(false);

      try {
        let lastPrepareError: AuthErrorLike | null = null;

        if (params.accessToken && params.refreshToken) {
          const { error: setSessionError } = await supabase.auth.setSession({
            access_token: params.accessToken,
            refresh_token: params.refreshToken,
          });

          devLog("prepare-set-session", {
            ok: !setSessionError,
            status: Number(setSessionError?.status ?? 0) || undefined,
            code: (setSessionError as AuthErrorLike | null)?.code ?? undefined,
          });

          if (setSessionError) {
            lastPrepareError = {
              status: Number(setSessionError.status ?? 0) || undefined,
              code: (setSessionError as AuthErrorLike).code ?? undefined,
              message: setSessionError.message ?? undefined,
            };
          }
        }

        if ((!params.accessToken || !params.refreshToken) && (params.tokenHash || params.token)) {
          const tokenHash = params.tokenHash ?? params.token;
          const otpType = resolveEmailOtpType(params.type);
          const { error: verifyError } = await supabase.auth.verifyOtp({
            token_hash: tokenHash ?? "",
            type: otpType,
          });

          devLog("prepare-verify-otp", {
            ok: !verifyError,
            type: otpType,
            status: Number(verifyError?.status ?? 0) || undefined,
            code: (verifyError as AuthErrorLike | null)?.code ?? undefined,
          });

          if (verifyError) {
            lastPrepareError = {
              status: Number(verifyError.status ?? 0) || undefined,
              code: (verifyError as AuthErrorLike).code ?? undefined,
              message: verifyError.message ?? undefined,
            };
          }
        }

        if ((!params.accessToken || !params.refreshToken) && params.code) {
          const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(params.code);
          devLog("prepare-exchange-code", {
            ok: !exchangeError,
            status: Number(exchangeError?.status ?? 0) || undefined,
            code: (exchangeError as AuthErrorLike | null)?.code ?? undefined,
          });

          if (exchangeError) {
            lastPrepareError = {
              status: Number(exchangeError.status ?? 0) || undefined,
              code: (exchangeError as AuthErrorLike).code ?? undefined,
              message: exchangeError.message ?? undefined,
            };
          }
        }

        const {
          data: { session },
        } = await supabase.auth.getSession();
        devLog("prepare-session-check", {
          hasSession: Boolean(session),
        });

        if (!session) {
          if (lastPrepareError) {
            devLog("prepare-failed", {
              kind: "auth_error",
              status: Number(lastPrepareError.status ?? 0) || undefined,
              code: lastPrepareError.code ?? undefined,
            });
            pushToast({
              kind: "error",
              message: mapRecoverySessionError(lastPrepareError),
            });
            return;
          }

          devLog("prepare-failed", {
            kind: "session_not_found",
          });
          pushToast({
            kind: "error",
            message: "Sessao de redefinicao nao encontrada. Abra o link enviado no email.",
          });
          return;
        }

        setIsRecoveryReady(true);
      } catch (error) {
        devLog("prepare-exception", {
          kind: error instanceof Error ? error.name : "unknown_error",
          error: error instanceof Error ? error.message : String(error),
        });
        pushToast({
          kind: "error",
          message: "Nao foi possivel validar o link de redefinicao. Solicite um novo link.",
        });
      } finally {
        setIsPreparing(false);
      }
    }

    void prepareRecoverySession();
  }, [pushToast]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    devLog("submit-triggered", {
      isPreparing,
      isSaving,
      isRecoveryReady,
    });

    if (!isRecoveryReady) {
      pushToast({
        kind: "error",
        message: "Sessao de redefinicao invalida. Solicite um novo link.",
      });
      return;
    }

    if (isSaving || saveInFlightRef.current) {
      return;
    }

    const trimmedPassword = password.trim();
    const trimmedConfirmPassword = confirmPassword.trim();

    if (!trimmedPassword || !trimmedConfirmPassword) {
      pushToast({
        kind: "error",
        message: "Preencha a nova senha e a confirmacao.",
      });
      return;
    }

    if (trimmedPassword.length < 6) {
      pushToast({
        kind: "error",
        message: "A senha deve ter no minimo 6 caracteres.",
      });
      return;
    }

    if (trimmedPassword !== trimmedConfirmPassword) {
      pushToast({
        kind: "error",
        message: "As senhas nao conferem.",
      });
      return;
    }

    saveInFlightRef.current = true;
    setIsSaving(true);

    try {
      const supabase = createSupabaseBrowserClient();
      const {
        data: { session },
      } = await supabase.auth.getSession();
      devLog("submit-session-before-update", {
        hasSession: Boolean(session),
      });

      const { error } = await supabase.auth.updateUser({
        password: trimmedPassword,
      });
      devLog("submit-update-user", {
        ok: !error,
        status: Number(error?.status ?? 0) || undefined,
        code: (error as AuthErrorLike | null)?.code ?? undefined,
      });

      if (error) {
        pushToast({
          kind: "error",
          message: mapUpdatePasswordError({
            status: Number(error.status ?? 0) || undefined,
            code: (error as AuthErrorLike).code ?? undefined,
            message: error.message ?? undefined,
          }),
        });
        return;
      }

      pushToast({
        kind: "success",
        message: "Senha atualizada com sucesso",
      });
      router.replace("/login");
      router.refresh();
    } catch (error) {
      devLog("submit-exception", {
        kind: error instanceof Error ? error.name : "unknown_error",
        error: error instanceof Error ? error.message : String(error),
      });
      pushToast({
        kind: "error",
        message: "Falha ao atualizar senha. Tente novamente em instantes.",
      });
    } finally {
      saveInFlightRef.current = false;
      setIsSaving(false);
    }
  }

  return (
    <form className="card stack-md" onSubmit={onSubmit}>
      <h1 className="heading">Definir nova senha</h1>
      <p className="text-muted">
        Digite sua nova senha para concluir a recuperacao da conta.
      </p>

      <label className="label" htmlFor="new-password">
        Nova senha
      </label>
      <input
        id="new-password"
        className="input"
        type="password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
        placeholder="Nova senha"
        disabled={isPreparing || isSaving}
        required
      />

      <label className="label" htmlFor="confirm-password">
        Confirmar senha
      </label>
      <input
        id="confirm-password"
        className="input"
        type="password"
        value={confirmPassword}
        onChange={(event) => setConfirmPassword(event.target.value)}
        placeholder="Confirme a nova senha"
        disabled={isPreparing || isSaving}
        required
      />

      <Button disabled={isPreparing || isSaving} type="submit">
        {isSaving ? "Salvando..." : "Salvar nova senha"}
      </Button>

      <div>
        <Link className="text-muted text-small" href="/login">
          Voltar para login
        </Link>
      </div>
    </form>
  );
}
