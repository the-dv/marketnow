# Supabase Runbook - MarketNow v1.0.0

Este runbook define a ordem exata para preparar o banco e o Auth no Supabase.

## 1) Variaveis de ambiente

Baseado em `.env.example`:

- `NEXT_PUBLIC_SUPABASE_URL`
  - Uso: cliente/browser e server SSR.
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - Uso: cliente/browser e server SSR (com sessao do usuario).
- `NEXT_PUBLIC_APP_URL`
  - Uso: `redirectTo` no fluxo de reset de senha.
  - Exemplo local: `http://localhost:3000`
  - Exemplo prod: `https://<seu-projeto>.vercel.app`

## 2) Setup SQL (ambiente novo)

No Supabase Dashboard -> SQL Editor, executar nesta ordem:

1. `supabase/schema.sql`
2. `supabase/migrations/202602271330_create_default_category_outros.sql`
3. `supabase/migrations/202602271730_bulk_mark_products_purchased.sql`
4. `supabase/migrations/202602271900_fix_bulk_on_conflict_uniques.sql`
5. `supabase/migrations/202602272030_enable_unpurchase_bulk.sql`
6. `supabase/seed.sql`

Observacao:
- As migrations sao idempotentes e podem ser reaplicadas com seguranca.

## 3) Upgrade SQL (ambiente legado)

Se o projeto nasceu antes das etapas atuais, executar:

1. `supabase/migrations/20260226_user_pricing_model.sql`
2. `supabase/migrations/20260226_categories_alignment.sql`
3. `supabase/migrations/20260226_dynamic_shopping_flow.sql`
4. `supabase/migrations/20260227_category_nullable_guard.sql` (historico)
5. `supabase/migrations/20260227_fix_optional_category_id.sql` (historico)
6. `supabase/migrations/20260227_category_fallback_outros.sql`
7. `supabase/migrations/202602271330_create_default_category_outros.sql`
8. `supabase/migrations/202602271730_bulk_mark_products_purchased.sql`
9. `supabase/migrations/202602271900_fix_bulk_on_conflict_uniques.sql`
10. `supabase/migrations/202602272030_enable_unpurchase_bulk.sql`
11. `supabase/seed.sql`

## 4) Queries de verificacao (SQL)

```sql
select id, slug, name
from public.categories
where slug = 'outros';
```

```sql
select schemaname, tablename, indexname
from pg_indexes
where schemaname = 'public'
  and tablename in ('shopping_list_items', 'user_product_prices')
order by tablename, indexname;
```

```sql
select proname
from pg_proc p
join pg_namespace n on n.oid = p.pronamespace
where n.nspname = 'public'
  and proname = 'bulk_mark_products_purchased';
```

```sql
select schemaname, tablename, policyname, cmd
from pg_policies
where schemaname = 'public'
  and tablename in ('shopping_list_items', 'shopping_lists', 'products', 'user_product_prices')
order by tablename, policyname;
```

## 5) Checklist de Auth (Dashboard)

Authentication -> Providers -> Email:
- Email/Password habilitado.

Authentication -> URL Configuration:
- Site URL:
  - local: `http://localhost:3000`
  - prod: `https://<seu-projeto>.vercel.app`
- Redirect URLs:
  - `http://localhost:3000/reset-password/confirm`
  - `http://localhost:3000/auth/callback` (legado)
  - `https://<seu-projeto>.vercel.app/reset-password/confirm`
  - `https://<seu-projeto>.vercel.app/auth/callback` (se usado)

Authentication -> Settings:
- Definir politica de confirmacao de email:
  - Se ativo: usuario precisa confirmar email antes do login.
  - Se inativo: login imediato apos cadastro.

Authentication -> Logs / Rate limits:
- Verificar eventos `signup`, `token`, `recover` em caso de 429.

## 6) Smoke check manual apos setup

1. Criar conta (`/register`).
2. Se necessario, confirmar email.
3. Login (`/login`).
4. Criar lista e abrir.
5. Criar produto com `Sem categoria` (deve persistir em `outros`).
6. Marcar comprado individual.
7. Marcar todos em lote e salvar valores.
8. Desmarcar todos.
