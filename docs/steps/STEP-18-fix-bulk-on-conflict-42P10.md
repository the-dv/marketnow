# STEP-18 - Fix Bulk On Conflict 42P10

## Objetivo

Corrigir definitivamente o erro Postgres `42P10` no fluxo "Marcar todos como comprados", alinhando `ON CONFLICT` com indice unico real no schema.

## Diagnostico

- Fluxo acionado por:
  - Botao **"Nao, apenas marcar"** (modal bulk etapa 1).
  - Botao **"Salvar valores"** (modal bulk etapa 2).
- Caminho de codigo:
  - Frontend chama `bulkMarkProductsPurchasedAction` em `src/app/lists/[listId]/actions.ts`.
  - A action chama RPC `bulk_mark_products_purchased` com payload:
    - `p_list_id`
    - `p_items` (array de `{ productId, paidPrice? }`)
    - `p_save_reference` (boolean).
- Ponto exato do erro `42P10`:
  - Em `supabase/migrations/202602271730_bulk_mark_products_purchased.sql`, no trecho:
    - `insert into public.shopping_list_items (...) ... on conflict (shopping_list_id, product_id) do update ...`
- Tabela/ON CONFLICT envolvidos:
  - Tabela: `public.shopping_list_items`
  - `on conflict`: `(shopping_list_id, product_id)`
  - Colunas no payload do insert: `shopping_list_id, product_id, quantity, unit, purchased_at, paid_price, paid_currency, updated_at`.
- Observacao de regra:
  - `user_product_prices` no bulk usa `insert` (historico), **sem** `on conflict`.

## Decisao de regra de negocio (final)

- `shopping_list_items`: **no maximo 1 linha por `(shopping_list_id, product_id)`**.
  - Requer indice unico correspondente ao `on conflict`.
- `user_product_prices`: **historico de referencias por produto/usuario**.
  - Nao adotar unique `(user_id, product_id)`.
  - Nao usar upsert nessa tabela no fluxo bulk.

## Requisitos (Checklist)

- [x] Diagnostico documentado com tabela, `onConflict`, payload e caminho de execucao.
- [x] Schema revisado para `shopping_list_items` e `user_product_prices`.
- [x] Nova migracao criada: `YYYYMMDDHHMM_fix_bulk_on_conflict_uniques.sql`.
- [x] Migracao remove duplicados de `shopping_list_items` por `(shopping_list_id, product_id)`, preservando o mais recente.
- [x] Migracao cria indice unico idempotente para `shopping_list_items (shopping_list_id, product_id)`.
- [x] Fluxo "Nao, apenas marcar" nao toca `user_product_prices`.
- [x] Fluxo "Salvar valores" continua com insert historico em `user_product_prices` (sem upsert).
- [x] `docs/manual-steps.md` atualizado com instrucao da migracao e query de verificacao em `pg_indexes`.
- [x] `npm run lint` executado com sucesso.
- [x] `npm run build` executado com sucesso.
- [x] Commit realizado com referencia `STEP-18`.

## Criterios de aceite

- "Nao, apenas marcar" executa sem `42P10`.
- "Salvar valores" executa sem `42P10`.
- Total e total por categoria atualizam apos bulk.
- Indice unico de `shopping_list_items` confirmado no banco.

## Plano de testes

- Aplicar migracao `202602271900_fix_bulk_on_conflict_uniques.sql` no Supabase cloud.
- Validar indices com query em `pg_indexes`.
- Testar fluxo manual:
  - abrir `/lists/:id`
  - clicar "Marcar todos"
  - escolher "Nao, apenas marcar" -> sucesso
  - repetir com "Sim, salvar precos" + preencher -> sucesso
- Executar `npm run lint`.
- Executar `npm run build`.
