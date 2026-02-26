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

