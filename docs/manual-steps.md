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
   - `supabase/migrations/20260227_fix_optional_category_id.sql`
   - `supabase/migrations/20260227_category_fallback_outros.sql`
   - `supabase/migrations/202602271330_create_default_category_outros.sql`
   - `supabase/migrations/202602271730_bulk_mark_products_purchased.sql`
   - `supabase/migrations/202602271900_fix_bulk_on_conflict_uniques.sql`
   - `supabase/migrations/202602272030_enable_unpurchase_bulk.sql`
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

## Regra final de categoria (vigente)

- `products.category_id` deve permanecer `NOT NULL`.
- A UI pode usar "Sem categoria", mas o backend sempre persiste como categoria `outros`.
- O app nao deve criar categoria em runtime.

### Passo obrigatorio no Supabase Cloud

1. Abrir Supabase Dashboard -> SQL Editor.
2. Executar:
   - `supabase/migrations/202602271330_create_default_category_outros.sql`
3. Validar:

```sql
select id, slug, name
from public.categories
where slug = 'outros';
```

Se nao retornar linha, rode tambem `supabase/seed.sql` e repita a validacao.

## Supabase - Configuracao Auth Magic Link

1. Dashboard -> Authentication -> URL Configuration.
2. Definir **Site URL**:
   - local: `http://localhost:3000`
   - producao: `https://<seu-projeto>.vercel.app`
3. Definir **Redirect URLs** (lista permitida):
   - `http://localhost:3000/auth/callback`
   - `https://<seu-projeto>.vercel.app/auth/callback`
   - opcional (preview): `https://*-<seu-time>.vercel.app/auth/callback`
4. Em Authentication -> Providers -> Email:
   - Magic Link habilitado.
5. Validar no app:
   - `signInWithOtp` deve usar `emailRedirectTo = <origem-atual>/auth/callback`
   - se `redirectTo` nao estiver na lista permitida, o Supabase retorna erro 400/422

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

## STEP-08 (historico superado pela regra final de categoria)

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

## STEP-09 (historico superado pela regra final de categoria)

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

## STEP-10 (historico superado pela regra final de categoria)

Para corrigir definitivamente categoria opcional:

1. Abrir Supabase Dashboard -> SQL Editor.
2. Executar:
   - `supabase/migrations/20260227_fix_optional_category_id.sql`
3. Validar coluna nullable:

```sql
select is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'products'
  and column_name = 'category_id';
```

Resultado esperado: `YES`.

4. Validar com insert de teste (ajuste IDs para seu ambiente):

```sql
insert into public.products (slug, name, owner_user_id, category_id, unit, is_active)
values ('teste-sem-categoria-manual', 'Teste sem categoria', '<SEU_USER_ID>', null, 'un', true);
```

## STEP-11 (obrigatorio apos merge local)

Regra nova: categoria nunca e nula; "Sem categoria" vira "Outros".

1. Abrir Supabase Dashboard -> SQL Editor.
2. Executar:
   - `supabase/migrations/20260227_category_fallback_outros.sql`
3. Validar schema:

```sql
select is_nullable
from information_schema.columns
where table_schema = 'public'
  and table_name = 'products'
  and column_name = 'category_id';
```

Resultado esperado: `NO`.

4. Validar categoria `outros`:

```sql
select id, slug, name
from public.categories
where slug = 'outros';
```

5. Teste de insert sem categoria (na app):
   - Escolher "Sem categoria" no dropdown.
   - Confirmar no banco que `products.category_id` referencia `categories.slug = 'outros'`.

## STEP-18 (obrigatorio para corrigir erro 42P10 no bulk)

1. Abrir Supabase Dashboard -> SQL Editor.
2. Executar:
   - `supabase/migrations/202602271900_fix_bulk_on_conflict_uniques.sql`
3. Validar indices:

```sql
select schemaname, tablename, indexname, indexdef
from pg_indexes
where schemaname = 'public'
  and tablename in ('user_product_prices', 'shopping_list_items')
order by tablename, indexname;
```

4. Confirmar que existe indice unico para:
   - `shopping_list_items (shopping_list_id, product_id)`

## STEP-19 (obrigatorio para desmarcar todos no header)

1. Abrir Supabase Dashboard -> SQL Editor.
2. Executar:
   - `supabase/migrations/202602272030_enable_unpurchase_bulk.sql`
3. Validar policy de update em `shopping_list_items`:

```sql
select schemaname, tablename, policyname, cmd, qual, with_check
from pg_policies
where schemaname = 'public'
  and tablename = 'shopping_list_items'
  and cmd = 'UPDATE';
```

4. Teste no app:
   - abrir `/lists/:id` com todos os itens comprados
   - clicar no checkbox do header e confirmar "Desmarcar todos"
   - validar `purchased_at`, `paid_price` e `paid_currency` limpos nos itens da lista

