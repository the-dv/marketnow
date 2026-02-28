# Architecture Summary - MarketNow v1.0.0

## 1) Stack

- Next.js (App Router) + React + TypeScript
- Supabase (Auth + Postgres + RLS)
- Vitest para testes unitarios

## 2) Rotas principais

- `/`
  - Resolve sessao e redireciona para `/dashboard` ou `/login`.
- `/login`
  - Login com email/senha.
- `/register`
  - Cadastro de usuario (email/senha).
- `/reset-password`
  - Solicita envio do link de redefinicao.
- `/reset-password/confirm`
  - Define nova senha via sessao de recovery.
- `/dashboard`
  - CRUD de listas (criar, arquivar/reativar, excluir).
- `/lists/[listId]`
  - CRUD de produtos do usuario + compra individual/bulk + totais.
- `/auth/callback`
  - Callback de auth (troca `code` por sessao), com sanitizacao de redirect.

## 3) Camadas de codigo

- `src/app/**`
  - Paginas, client components e server actions.
- `src/lib/supabase/**`
  - Inicializacao de clients browser/server e middleware de sessao.
- `src/lib/validation.ts`
  - Validacoes de UUID/string para actions.
- `src/lib/security/rate-limit.ts`
  - Rate limit in-memory para mutacoes.
- `src/services/**`
  - Regras de negocio (preco, totals, formatacao/parse de input).
- `src/components/**`
  - Sistema de botoes, icon buttons, toasts.

## 4) Tabelas de dominio (resumo)

- `profiles`
- `shopping_lists`
- `shopping_list_items`
- `categories`
- `products`
- `user_product_prices`
- `regional_prices`

Regras criticas:
- `products.category_id` e `NOT NULL`.
- UI pode exibir `Sem categoria`, mas persistencia usa categoria `outros`.
- `shopping_list_items` possui unique `(shopping_list_id, product_id)`.

## 5) Fluxos de mutacao (server actions)

Dashboard (`src/app/dashboard/actions.ts`):
- `createShoppingListAction`
- `toggleShoppingListStatusAction`
- `deleteShoppingListAction`

Lista (`src/app/lists/[listId]/actions.ts`):
- `createUserProductAction`
- `updateUserProductDetailsAction`
- `recordProductPurchaseAction`
- `clearProductPurchaseAction`
- `bulkMarkProductsPurchasedAction` (usa RPC `bulk_mark_products_purchased`)
- `unpurchaseAllListItemsAction`
- `softDeleteUserProductAction`

## 6) Seguranca e isolamento

- RLS habilitada nas tabelas publicas principais.
- Ownership checado no servidor antes de mutacoes.
- Middleware SSR atualiza sessao via cookies Supabase.
- Callback de auth com protecao contra open redirect.

## 7) Operacao e dependencias externas

- Setup SQL: `schema.sql` + migrations obrigatorias + `seed.sql`.
- Auth settings no Supabase sao parte do funcionamento (providers, redirects, email confirmation).
- Variaveis minimas:
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `NEXT_PUBLIC_APP_URL`
