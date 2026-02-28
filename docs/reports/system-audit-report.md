# System Audit Report - MarketNow

Data da auditoria: 2026-02-27
Escopo: codigo + docs + SQL Supabase (somente diagnostico)

## 1) Resumo executivo

Status geral atual:
- O nucleo funcional do app (auth, dashboard, listas/produtos, compras, bulk, totais) esta implementado e coerente no codigo.
- `npm run lint`, `npm run build` e `npm test` passaram localmente.
- O principal gap para fechamento confiavel de "MVP 1.0.0 / Etapa 1" esta em **drift de documentacao e bootstrap de ambiente** (Auth descrito como Magic Link em varios docs e `schema.sql` sem a RPC de bulk usada pelo app).

Leitura objetiva para Etapa 1 (estado real):
- Codigo: **praticamente concluido** para o escopo MVP base.
- Operacionalizacao cloud (Supabase/Vercel/docs): **ainda precisa ajuste** para evitar setup incompleto e falso-negativo de login.

## 2) Auditoria de estrutura do repositorio

Pastas e responsabilidades principais:
- `src/app`: rotas Next App Router (`/login`, `/register`, `/reset-password`, `/dashboard`, `/lists/[listId]`, callback auth).
- `src/app/**/actions.ts`: server actions (mutacoes com validacao/ownership/rate-limit).
- `src/components`: UI reutilizavel (`Button`, `IconButton`, `ToastProvider`).
- `src/lib`: utilitarios de validacao, rate-limit e clients Supabase SSR/browser.
- `src/services`: regras de dominio (pricing, parsing BRL/quantidade, totais por categoria).
- `supabase/schema.sql`, `supabase/seed.sql`, `supabase/migrations/*.sql`: modelo, seed e evolucao SQL.
- `docs/steps`: historico de implementacao por step (STEP-01 a STEP-21).
- `docs/manual-steps.md`, `docs/development-roadmap.md`: operacao externa e roadmap.

Stack identificada:
- Next.js 16.1.6 + React 19 + TypeScript
- Supabase (`@supabase/ssr`, `@supabase/supabase-js`)
- Vitest

## 3) Checks locais executados

Comandos executados:
- `npm run lint` -> OK
- `npm run build` -> OK
- `npm test` -> OK (3 arquivos / 14 testes)

Resumo dos outputs:
- Lint sem erros.
- Build com geracao das rotas: `/login`, `/register`, `/reset-password`, `/reset-password/confirm`, `/dashboard`, `/lists/[listId]`.
- Testes verdes em:
  - `src/services/input-format.test.ts`
  - `src/services/list-totals.test.ts`
  - `src/services/pricing-logic.test.ts`

## 4) Auditoria funcional por fluxo

### 4.1 Auth (login/cadastro/reset/logout/protecao)

Evidencias no codigo:
- Login por senha: `supabase.auth.signInWithPassword` em `src/app/login/login-form.tsx:171`.
- Cadastro: `supabase.auth.signUp` em `src/app/register/register-form.tsx:166`.
- Reset request: `supabase.auth.resetPasswordForEmail` em `src/app/reset-password/reset-password-request-form.tsx:145`.
- Confirmacao de nova senha: `supabase.auth.updateUser` em `src/app/reset-password/confirm/reset-password-confirm-form.tsx:136`.
- Logout: `supabase.auth.signOut` em `src/app/dashboard/sign-out-button.tsx:12`.
- Protecao server-side de rotas:
  - dashboard: `src/app/dashboard/page.tsx:20-22`
  - lista: `src/app/lists/[listId]/page.tsx:98-100`
  - home redirect: `src/app/page.tsx:10`

Conclusao:
- Fluxo auth por email+senha esta implementado.
- Callback `/auth/callback` permanece e nao dispara OTP (apenas `exchangeCodeForSession`), sem conflito estrutural com senha.

### 4.2 Dashboard

Evidencias no codigo:
- Criar lista: `createShoppingListAction` em `src/app/dashboard/actions.ts`.
- Arquivar/Reativar: `toggleShoppingListStatusAction` com confirmacao no client (`window.confirm`) em `src/app/dashboard/dashboard-lists-panel.tsx:72-84`.
- Excluir lista: confirmacao em `src/app/dashboard/dashboard-lists-panel.tsx:87-97`.
- Lista arquivada sem navegacao: `onClick`/`onKeyDown` condicionais por status em `src/app/dashboard/dashboard-lists-panel.tsx:165-171`.

Conclusao:
- Regras funcionais do dashboard estao coerentes com os steps recentes.

### 4.3 Lista / Produtos

Evidencias no codigo:
- Criar produto: `createUserProductAction` em `src/app/lists/[listId]/actions.ts:367`.
- Editar nome/categoria/qtd/unid: `updateUserProductDetailsAction` em `src/app/lists/[listId]/actions.ts:450`.
- Excluir produto (soft delete): `softDeleteUserProductAction` em `src/app/lists/[listId]/actions.ts:843`.
- Marcar comprado individual: `recordProductPurchaseAction` em `src/app/lists/[listId]/actions.ts:609`.
- Desmarcar individual: `clearProductPurchaseAction` em `src/app/lists/[listId]/actions.ts:698`.
- Bulk marcar todos: `bulkMarkProductsPurchasedAction` + modal 2 etapas em `src/app/lists/[listId]/my-products-list.tsx`.
- Bulk desmarcar todos: `unpurchaseAllListItemsAction` em `src/app/lists/[listId]/actions.ts:802` + modal de confirmacao em `my-products-list.tsx:649-662`.
- Total por categoria + total geral: `src/app/lists/[listId]/page.tsx:245-268`.

Persistencia Supabase (tabelas usadas):
- `shopping_lists`, `shopping_list_items`, `products`, `categories`, `user_product_prices`, `profiles`, `regional_prices`.

Conclusao:
- Fluxos principais de CRUD + compra individual/bulk + totalizacao estao implementados.

### 4.4 UX/UI (robustez minima)

Evidencias:
- Toast flutuante top-right com auto-dismiss: `src/components/toast-provider.tsx:43` e `src/app/globals.css:777`.
- Hover/focus de botoes principais: `src/app/globals.css` (`.btn-primary`, `.btn-dark`, `.btn-danger`).
- Grid header/body da lista: `src/app/globals.css:406-426`.
- Checkbox com hit area e focus: `src/app/globals.css:446-463` e `my-products-list.tsx`.
- Validacao numerica:
  - quantidade: `normalizeQuantityInput` + `isBlockedNumericKey` (`src/services/input-format.ts`)
  - preco BRL mascarado/parsing: `formatBrlFromDigits`/`parseBrlToNumber`.

Conclusao:
- Padrao de UX solicitado nas etapas recentes esta refletido no codigo.

## 5) Auditoria Supabase (schema / migrations / seed / RLS)

### 5.1 Regras de dados criticas

Confirmado:
- `products.category_id` esta `NOT NULL` em `supabase/schema.sql`.
- `categories.slug` unico e seed contem `outros` em `supabase/seed.sql`.
- Fallback app para "Sem categoria" -> `outros` por SELECT (sem upsert runtime) em `src/app/lists/[listId]/actions.ts:283-335`.
- RLS em tabelas principais com policies de ownership/readonly coerentes no `schema.sql`.

### 5.2 Risco identificado de bootstrap (P0)

Achado:
- O codigo chama RPC `bulk_mark_products_purchased` (`src/app/lists/[listId]/actions.ts:777`),
  mas essa funcao **nao esta no `supabase/schema.sql`**.
- A funcao existe apenas em migration: `supabase/migrations/202602271730_bulk_mark_products_purchased.sql`.

Impacto:
- Em ambiente novo que rode apenas `schema.sql + seed.sql`, o bulk mark-all falha.

Status:
- Nao exige SQL novo (migration ja existe), mas exige ajuste de processo/documentacao para garantir aplicacao da migration tambem em projeto novo.

### 5.3 Auth settings (evidencia ambiente atual)

Consulta em `auth/v1/settings` (projeto apontado por `.env.local`) retornou:
- `mailer_autoconfirm=false`
- `disable_signup=false`
- `site_url_set=false`

Impacto:
- Confirmacao de email e obrigatoria; login antes de confirmar pode falhar (esperado).
- Site URL ausente aumenta risco de fluxo de email/reset inconsistente em cloud.

## 6) Auditoria de documentacao e checklists

### 6.1 Steps

- Todos os arquivos `docs/steps/STEP-01..STEP-21` estao 100% marcados (`[x]`), sem pendentes abertos.
- Estado do codigo confirma a maior parte dos fluxos descritos.

### 6.2 Drift de docs (alto impacto operacional)

Inconsistencias encontradas:
1. Auth legado em docs centrais:
- `README.md`, `docs/auth-flow.md`, `docs/development-roadmap.md`, `docs/architecture.md` ainda descrevem Magic Link como fluxo oficial.
- Codigo atual esta em email+senha + registro + reset.

2. Step-21 ainda cita "Enviar Magic Link":
- `docs/steps/STEP-21-button-system-and-hover-fix.md` referencia botao/fluxo antigo.

3. `security-performance-audit.md` e `audit-checklist.md` descrevem baseline que nao reflete completamente o estado atual do auth.

4. `manual-steps.md` tem conteudo historico misturado (STEP-08/09/10 superados) e instrucoes que podem confundir setups novos.

## 7) Etapa 1 (MVP 1.0.0) - status real

Definicao pratica usada para esta auditoria:
- Auth funcional (login/cadastro/reset/logout)
- Dashboard CRUD basico de listas
- Lista com CRUD de produtos + compra individual/bulk
- RLS/ownership e regra de categoria "outros" coerentes
- Qualidade minima (lint/build/test verde)

Status atual:
- Implementacao de codigo: **OK**
- Prontidao operacional/documental: **PARCIAL**

Bloqueios para declarar Etapa 1 "fechada" sem risco:
1. Ajustar docs oficiais para auth por senha (remover ambiguidade de Magic Link).
2. Ajustar processo de bootstrap para garantir aplicacao da migration da RPC bulk em ambiente novo.
3. Validar configuracao Auth no Supabase Dashboard (Site URL, Email provider, confirmacao de email e redirects de reset).

## 8) Pendencias priorizadas

### P0 (bloqueia fechamento seguro do MVP)

1. Drift de setup SQL para bulk
- Problema: `schema.sql` nao contempla RPC `bulk_mark_products_purchased`.
- Acao minima: garantir no manual que **sempre** deve executar `202602271730_bulk_mark_products_purchased.sql` (inclusive em projeto novo).

2. Drift de docs de auth
- Problema: docs chave ainda orientam Magic Link; codigo esta em email+senha.
- Acao minima: alinhar README + auth-flow + roadmap + architecture para fluxo atual.

### P1 (importante)

1. Configuracao externa Auth (Supabase)
- Confirmar no dashboard:
  - Providers > Email habilitado
  - Settings > Email confirmation (decisao explicita de negocio)
  - URL configuration (`Site URL` + redirects de reset/callback)

2. Manual de etapas com historico conflitando
- Manter steps historicos, mas separar claramente "vigente" vs "superado" para evitar aplicacao errada em cloud.

### P2 (melhoria)

1. Consolidar um "MVP 1.0.0 definition" unico em docs/reports para evitar contradicoes entre roadmap e steps.

## 9) Recomendacoes minimas (sem refatorar)

1. Atualizar docs de auth para senha (sem mexer em arquitetura).
2. Atualizar `manual-steps.md` com ordem unica de bootstrap SQL para ambiente novo:
   - `schema.sql`
   - todas as migrations funcionais obrigatorias (incluindo `202602271730...`, `202602271900...`, `202602272030...`, `202602271330...`)
   - `seed.sql`
3. Rodar smoke manual em cloud apos ajuste documental:
   - cadastro -> confirmacao email (se ativo) -> login -> dashboard
   - lista -> bulk mark all -> bulk unpurchase

## 10) SQL adicional

- Nenhum SQL novo foi gerado nesta auditoria.
- Motivo: os SQLs necessarios para os gaps identificados ja existem em `supabase/migrations/`.

## 11) Estado do workspace durante a auditoria

Workspace nao estava limpo no inicio (mudancas de auth ja presentes e ainda nao commitadas):
- `src/app/login/login-form.tsx` (modificado)
- `src/app/register/*` (novo)
- `src/app/reset-password/*` (novo)
- `docs/manual-steps.md` (modificado)

Isso foi considerado na auditoria como estado atual de trabalho local.
