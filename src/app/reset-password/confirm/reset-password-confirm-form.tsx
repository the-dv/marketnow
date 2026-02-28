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
    if (prepareOnceRef.current) {
      return;
    }
    prepareOnceRef.current = true;

    async function prepareRecoverySession() {
      const supabase = createSupabaseBrowserClient();
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (exchangeError) {
          pushToast({
            kind: "error",
            message: "Link de redefinicao invalido ou expirado. Solicite um novo link.",
          });
          setIsPreparing(false);
          return;
        }
      }

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (!session) {
        pushToast({
          kind: "error",
          message: "Sessao de redefinicao nao encontrada. Abra o link enviado no email.",
        });
        setIsPreparing(false);
        return;
      }

      setIsRecoveryReady(true);
      setIsPreparing(false);
    }

    void prepareRecoverySession();
  }, [pushToast]);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

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
      const { error } = await supabase.auth.updateUser({
        password: trimmedPassword,
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
        message: "Senha atualizada com sucesso.",
      });
      router.replace("/login");
      router.refresh();
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

      <Button disabled={isPreparing || isSaving || !isRecoveryReady} type="submit">
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
