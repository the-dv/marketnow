# Debug - Falha ao enviar Magic Link

Data: 2026-02-27

## 1) Sintoma

Na tela de login, ao enviar email, o app exibia a mensagem:

- "Nao foi possivel enviar o Magic Link. Tente novamente."

Sem detalhar a causa real (`status code`/tipo do erro).

## 2) Erro real capturado (evidencias)

### 2.1 Fluxo de codigo revisado

- Chamada principal: `src/app/login/login-form.tsx`
- Metodo: `supabase.auth.signInWithOtp({ email, options: { emailRedirectTo } })`
- `emailRedirectTo` atual: `${window.location.origin}/auth/callback`

### 2.2 Reproducao tecnica local (sem segredos)

Validacao de env (apenas metadados):

- `NEXT_PUBLIC_SUPABASE_URL`: setado
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: setado
- Host detectado: `sdrohihsylttnmeumkzr.supabase.co`

Teste de OTP capturado:

- `status`: `400`
- `name`: `AuthApiError`
- `code`: `email_address_invalid`
- `message`: `Email address "...@example.com" is invalid`

Interpretacao:
- O projeto Supabase esta acessivel.
- O endpoint de OTP responde e retorna erro sem quebrar client.
- Para email invalido, retorno esperado e 400.

## 3) Causa provavel (hipoteses priorizadas)

1. **Email invalido/rejeitado pelo Auth** (mais provavel em 400/422)
- Formato invalido ou dominio rejeitado.

2. **Configuracao incompleta de URL no Supabase**
- `redirectTo` nao permitido em `Redirect URLs` (tambem pode retornar 400/422).

3. **Rate limit de Auth**
- Muitas tentativas em curto intervalo (retorno 429).

4. **Falha temporaria do servico**
- Erros 5xx no Supabase/Auth provider.

## 4) Correcoes aplicadas no codigo

Arquivo: `src/app/login/login-form.tsx`

1. Tratamento de erro por status (mensagem amigavel)
- `429` -> "Muitas tentativas. Aguarde 60s e tente novamente."
- `400/422` -> "Email invalido ou configuracao de login incompleta."
- `>=500` -> "Falha temporaria do servico. Tente novamente em instantes."
- fallback generico para demais casos.

2. Instrumentacao segura (sem vazamento)
- Log em dev com snapshot seguro:
  - `status`, `name`, `code`, `message`
- Sem token/chave/secret.

3. Anti-duplo-submit / debounce
- Botao permanece desabilitado enquanto request esta em andamento.
- Cooldown adicional de 2 segundos entre envios para evitar spam acidental.

4. UX de feedback
- Erros/sucessos agora em **toast** (nao ficam persistentes no layout).
- Erro de callback (`auth_callback_failed`) tambem vai para toast.

5. Verificacao de loop
- `signInWithOtp` e chamado apenas no `onSubmit`.
- Nao foi identificado loop por `useEffect`/re-render.

## 5) Passos manuais no Supabase Dashboard (obrigatorio)

### A) Authentication > URL Configuration

1. Site URL
- local: `http://localhost:3000`
- producao: `https://<seu-projeto>.vercel.app`

2. Redirect URLs
- `http://localhost:3000/auth/callback`
- `https://<seu-projeto>.vercel.app/auth/callback`
- opcional preview: `https://*-<seu-time>.vercel.app/auth/callback`

### B) Authentication > Providers > Email

- Habilitar Email provider
- Habilitar Magic Link

### C) Authentication > Logs

Filtrar por tentativas recentes de OTP e observar (sem expor PII em compartilhamento):
- status HTTP
- error code (ex.: `email_address_invalid`, rate limit)
- mensagem resumida

## 6) Como testar (passo a passo)

1. Rodar app local:
```bash
npm run dev
```

2. Abrir `/login`.
3. Testar email valido real:
- Deve mostrar toast de sucesso e enviar Magic Link.

4. Testar envio repetido rapido:
- Segundo clique em curto intervalo deve ser bloqueado (cooldown/debounce).

5. Forcar cenario de erro:
- email invalido -> toast de 400/422.
- muitas tentativas -> toast de 429.

6. Verificar callback:
- abrir link do email e confirmar redirecionamento para `/dashboard`.
