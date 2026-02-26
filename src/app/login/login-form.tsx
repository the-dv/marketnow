"use client";

import { FormEvent, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import { createSupabaseBrowserClient } from "@/lib/supabase/browser";

type Status = {
  type: "idle" | "success" | "error";
  message?: string;
};

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [status, setStatus] = useState<Status>({ type: "idle" });
  const searchParams = useSearchParams();
  const callbackError = useMemo(
    () => searchParams.get("error") === "auth_callback_failed",
    [searchParams],
  );

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsLoading(true);
    setStatus({ type: "idle" });

    const supabase = createSupabaseBrowserClient();
    const emailRedirectTo = `${window.location.origin}/auth/callback`;

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo },
    });

    if (error) {
      setStatus({
        type: "error",
        message: "Nao foi possivel enviar o Magic Link. Tente novamente.",
      });
      setIsLoading(false);
      return;
    }

    setStatus({
      type: "success",
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

      {callbackError ? (
        <p className="text-error">Falha ao confirmar login. Solicite um novo link.</p>
      ) : null}

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

      <button className="button" type="submit" disabled={isLoading}>
        {isLoading ? "Enviando..." : "Enviar Magic Link"}
      </button>

      {status.type === "success" ? <p className="text-success">{status.message}</p> : null}
      {status.type === "error" ? <p className="text-error">{status.message}</p> : null}
    </form>
  );
}

