# STEP-11 - Category Fallback Outros

## Objetivo

Aplicar a nova regra de negocio: `products.category_id` permanece `NOT NULL`, e toda selecao "Sem categoria" no front deve persistir automaticamente como categoria "Outros".

## Escopo

- Criar migracao SQL para garantir `category_id NOT NULL`.
- Garantir existencia idempotente da categoria `outros`.
- Backfill de produtos com `category_id` nulo para `outros`.
- Ajustar actions para converter "Sem categoria" em `outros` no backend.
- Ajustar UI da coluna de checkbox conforme solicitado (sem header textual/padding excessivo).
- Atualizar `manual-steps.md` com aplicacao no Supabase Cloud.

## Fora de escopo

- Mudar RLS base do projeto.
- Refatorar fluxo de precificacao.
- Alterar modelo de categorias seed alem do necessario.

## Requisitos (Checklist)

- [x] Migracao nova criada para `ALTER COLUMN category_id SET NOT NULL`.
- [x] UPSERT idempotente da categoria `outros` implementado na migracao.
- [x] Backfill de `products.category_id` nulo para id de `outros`.
- [x] FK de `products.category_id` continua valida.
- [x] `createUserProductAction` converte "Sem categoria" para `outros`.
- [x] Update de produto tambem converte "Sem categoria" para `outros`.
- [x] Payload nunca envia `category_id = null` em create/update.
- [x] Dropdown segue com opcao "Sem categoria" para UX.
- [x] Header da coluna checkbox sem texto "Comprado"/"OK".
- [x] Coluna checkbox com alinhamento vertical e espacamento enxuto.
- [x] `manual-steps.md` atualizado com passos SQL e validacao.
- [x] `npm run lint` executado com sucesso.
- [x] `npm run build` executado com sucesso.
- [x] Commit realizado com referencia `STEP-11`.

## Criterios de aceite

- Salvar produto com "Sem categoria" nao gera erro `23502`.
- No banco, produto salvo com `category_id` apontando para `outros`.
- Salvar com categoria explicita continua funcionando.
- Editar para "Sem categoria" persiste como `outros`.
- Coluna de checkbox permanece limpa e alinhada.

## Arquitetura / Design

- Conversao de categoria opcional acontece somente no backend para manter consistencia.
- Resolucao de `outros` acontece por `SELECT` (somente leitura) em `categories`.
- Se `outros` nao existir, a action retorna erro orientando aplicar migracao/seed no Supabase.
- SQL e backend funcionam em conjunto para evitar regressao (schema + regra de aplicacao).

## Alteracoes esperadas (arquivos)

- `docs/steps/STEP-11-category-fallback-outros.md`
- `supabase/migrations/20260227_category_fallback_outros.sql`
- `supabase/schema.sql`
- `src/app/lists/[listId]/actions.ts`
- `src/app/lists/[listId]/my-products-list.tsx`
- `src/app/lists/[listId]/create-product-form.tsx`
- `src/app/globals.css`
- `docs/manual-steps.md`

## Modelo de dados / SQL

- `public.products.category_id` como `NOT NULL`.
- Categoria `outros` garantida em `public.categories`.

## Seguranca / RLS

- RLS de produtos inalterada (`owner_user_id = auth.uid()` para escrita).
- Sem ampliacao de visibilidade de dados.

## UI/UX

- "Sem categoria" mantida como atalho de UX.
- Persistencia real vira "Outros" no backend.
- Coluna checkbox minimalista e alinhada.

## Plano de testes

- Manual:
  - Criar produto com "Sem categoria".
  - Validar no banco referencia para categoria `outros`.
  - Criar produto com categoria explicita.
  - Editar produto para "Sem categoria".
  - Validar coluna checkbox sem header textual e alinhamento central.
- Automatizado:
  - `npm run lint`
  - `npm run build`

## Riscos e mitigacao

- Risco: ambiente cloud sem migracao aplicada continuar aceitando `NULL`/estado inconsistente.
  - Mitigacao: `manual-steps.md` com query de verificacao e ordem de execucao.
- Risco: categoria `outros` ausente em ambiente legado.
  - Mitigacao: helper backend cria sob demanda + migracao faz UPSERT.

## Decisoes e trade-offs

- Decisao: nao salvar `NULL` para categoria.
  - Trade-off: elimina erro 23502 e simplifica regras no banco, com pequena diferenca semantica de UX.
- Decisao: manter opcao "Sem categoria" no frontend.
  - Trade-off: UX amigavel, mas exige mapeamento explicito no backend.

## Pos-etapa (follow-ups)

- Adicionar teste automatizado de create/update com categoria "__NONE__".
- Revisar docs de data model para refletir regra final de `NOT NULL`.

## Changelog curto

- Regra de negocio alterada para fallback automatico em `Outros` (sem persistir `NULL`).
- Migracao adicionada para reforcar `category_id NOT NULL` com backfill idempotente.
- Helper backend para resolver/criar categoria `outros` com cache simples por execucao.
- Manual atualizado com passo a passo de aplicacao no Supabase Cloud.
