# Manual Steps (External Dependencies)

Este arquivo registra tarefas que dependem de painel externo (Supabase/Vercel) e nao podem ser executadas apenas pelo workspace local.

## Supabase - Aplicar banco do projeto

### Quando executar

- Projeto novo no Supabase.
- Mudanca estrutural de schema/migracao.

### Passos

1. Abrir Supabase Dashboard -> SQL Editor.
2. Executar `supabase/schema.sql`.
3. Se o banco ja existia com modelo antigo, executar:
   - `supabase/migrations/20260226_user_pricing_model.sql`
   - `supabase/migrations/20260226_categories_alignment.sql`
   - `supabase/migrations/20260226_dynamic_shopping_flow.sql`
   - `supabase/migrations/20260227_category_nullable_guard.sql`
4. Executar `supabase/seed.sql`.

### Validacao rapida (SQL)

```sql
select tablename
from pg_tables
where schemaname = 'public'
  and tablename in (
    'profiles','shopping_lists','shopping_list_items',
    'categories','products','user_product_prices','regional_prices'
  )
order by tablename;

select count(*) as categories_count from public.categories;
select count(*) as products_count from public.products where is_active = true;
```

## Supabase - Configuracao Auth Magic Link

1. Dashboard -> Authentication -> URL Configuration.
2. Garantir URL de callback permitida:
   - `http://localhost:3000/auth/callback`
   - URL de producao da Vercel (`https://<seu-projeto>.vercel.app/auth/callback`)
3. Em Authentication -> Providers -> Email:
   - Magic Link habilitado.

## Vercel - Variaveis de ambiente

1. Vercel Project -> Settings -> Environment Variables.
2. Definir:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Redeploy apos salvar.

## Bloqueios atuais

- Sem bloqueio tecnico local no momento.
- Para validar fluxo completo em ambiente real, os passos Supabase/Auth/Vercel acima precisam estar aplicados.

## STEP-05 (obrigatorio apos merge local)

Para alinhar cadastro de produto sem categoria + categorias oficiais:

1. Executar no Supabase SQL Editor:
   - `supabase/schema.sql` (ambiente novo), ou
   - `supabase/migrations/20260226_user_pricing_model.sql` e `supabase/migrations/20260226_categories_alignment.sql` (ambiente existente)
2. Executar `supabase/seed.sql`.
3. Validar policies de `products`:
   - seed global (`owner_user_id is null`) visivel a todos autenticados
   - produto privado visivel apenas ao dono
4. Testar no app:
   - criar produto custom em `/lists/:id`
   - confirmar que aparece na secao "Meus produtos" para o mesmo usuario

## STEP-06 (obrigatorio apos merge local)

Para habilitar o fluxo dinamico de compra em "Meus produtos":

1. Executar no Supabase SQL Editor:
   - `supabase/migrations/20260226_dynamic_shopping_flow.sql`
2. Validar que o indice unico existe:

```sql
select indexname
from pg_indexes
where schemaname = 'public'
  and tablename = 'shopping_list_items'
  and indexname = 'shopping_list_items_unique_list_product_idx';
```

3. Testar no app:
   - em `/lists/:id`, marcar um produto como comprado
   - informar preco no modal e confirmar
   - recarregar a pagina e validar checkbox persistido

## STEP-08 (obrigatorio apos merge local)

Para garantir categoria opcional sem regressao e recalculo de total:

1. Executar no Supabase SQL Editor:
   - `supabase/migrations/20260227_category_nullable_guard.sql`
2. Validar estrutura:

```sql
select is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'products'
  and column_name = 'category_id';
```

3. Testar no app:
   - criar produto sem categoria em `/lists/:id`
   - editar categoria para `Outros` e voltar para `Sem categoria`
   - marcar comprado, informar preco e depois excluir produto comprado para validar total atualizado

## STEP-09 (obrigatorio apos merge local)

Para estabilizar cadastro sem categoria e layout da grade:

1. Confirmar migracao nullable aplicada:
   - `supabase/migrations/20260227_category_nullable_guard.sql`
2. Validar coluna:

```sql
select is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'products'
  and column_name = 'category_id';
```

3. Testar no app:
   - criar produto com categoria vazia
   - validar grid alinhada com 4+ produtos em `/lists/:id`

