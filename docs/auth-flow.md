# Auth Flow - Supabase Email/Senha + Reset

## Objetivo

Documentar o fluxo de autenticacao por email/senha, reset de senha, controle de sessao e protecao de rotas privadas no MarketNow.

## Fluxo de Login (Email/Senha)

1. Solicitacao
- Usuario informa email e senha na tela de login (`/login`).
- App chama `supabase.auth.signInWithPassword`.

2. Sessao
- Em sucesso, Supabase retorna sessao autenticada.
- Usuario e redirecionado para `/dashboard`.

## Fluxo de Cadastro

1. Usuario cria conta em `/register` com email/senha (`signUp`).
2. Se confirmacao de email estiver ativa no projeto Supabase, usuario precisa confirmar antes do primeiro login.
3. Se confirmacao estiver desativada, sessao pode ser criada imediatamente.

## Fluxo de Reset de senha

1. Usuario solicita reset em `/reset-password` (`resetPasswordForEmail`).
2. Link redireciona para `/reset-password/confirm`.
3. App troca `code` por sessao de recovery (quando presente) e chama `updateUser({ password })`.

## Callback de auth

- Rota: `/auth/callback`.
- Funcao: processar `code` (`exchangeCodeForSession`) e redirecionar de forma segura.
- Observacao: mantida por compatibilidade de fluxo auth do Supabase e links legados.

## Protecao de Rotas Privadas

### Server-side
- Validar sessao em rotas protegidas (page server).
- Redirecionar para login se sessao ausente.

### Client-side
- Formularios de auth fazem validacao basica e exibem feedback via toast.
- Nao persistir erro fixo na tela.

## Logout

- Encerrar sessao via `supabase.auth.signOut`.
- Redirecionar para login.

## Boas praticas de seguranca

- Usar `NEXT_PUBLIC_SUPABASE_ANON_KEY` apenas no client.
- Aplicar RLS nas tabelas de dados de usuario.
- Tratar `auth.uid()` como fonte de verdade para ownership.

## Variaveis de ambiente

Obrigatorias:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `NEXT_PUBLIC_APP_URL`

## Tratamento de erros

Cenarios previstos:
- Credenciais invalidas.
- Conta sem confirmacao de email (quando exigido no Supabase).
- Rate limit de auth.
- Sessao ausente em rota privada.

Comportamento recomendado:
- Exibir mensagem objetiva via toast.
- Evitar detalhar erro interno sensivel.

## Convencao de erros de dominio

- `AUTH_REQUIRED`: usuario nao autenticado para acao privada.
- `SESSION_INVALID`: sessao expirada/invalida.
