# Security Considerations - MarketNow

## Objetivo

Definir controles minimos de seguranca para o MVP com Supabase, com foco em isolamento de dados por usuario e protecao da base seed de precos.

## Principios

- Menor privilegio por padrao.
- RLS obrigatorio em tabelas acessadas pelo client.
- Chaves sensiveis restritas ao server.
- Validacao de entrada em todos os pontos de escrita.

## RLS Obrigatorio

Tabelas de usuario (acesso por ownership):
- `shopping_lists`
- `shopping_list_items`
- `profiles`

Tabelas de catalogo seed:
- `products`
- `regional_prices`

Decisao MVP:
- `products` e `regional_prices` com leitura apenas autenticada.
- Sem escrita por client nessas tabelas.

## Exemplo de Policies SQL (referencia)

> Observacao: exemplos para documentacao; ajustes podem ser feitos na implementacao conforme migracoes reais.

### Habilitar RLS

```sql
alter table profiles enable row level security;
alter table shopping_lists enable row level security;
alter table shopping_list_items enable row level security;
alter table products enable row level security;
alter table regional_prices enable row level security;
```

### `profiles`

```sql
create policy "profiles_select_own"
on profiles for select
to authenticated
using (id = auth.uid());

create policy "profiles_update_own"
on profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "profiles_insert_own"
on profiles for insert
to authenticated
with check (id = auth.uid());
```

### `shopping_lists`

```sql
create policy "shopping_lists_select_own"
on shopping_lists for select
to authenticated
using (user_id = auth.uid());

create policy "shopping_lists_insert_own"
on shopping_lists for insert
to authenticated
with check (user_id = auth.uid());

create policy "shopping_lists_update_own"
on shopping_lists for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy "shopping_lists_delete_own"
on shopping_lists for delete
to authenticated
using (user_id = auth.uid());
```

### `shopping_list_items`

```sql
create policy "shopping_list_items_select_own"
on shopping_list_items for select
to authenticated
using (
  exists (
    select 1
    from shopping_lists l
    where l.id = shopping_list_items.shopping_list_id
      and l.user_id = auth.uid()
  )
);

create policy "shopping_list_items_insert_own"
on shopping_list_items for insert
to authenticated
with check (
  exists (
    select 1
    from shopping_lists l
    where l.id = shopping_list_items.shopping_list_id
      and l.user_id = auth.uid()
  )
);

create policy "shopping_list_items_update_own"
on shopping_list_items for update
to authenticated
using (
  exists (
    select 1
    from shopping_lists l
    where l.id = shopping_list_items.shopping_list_id
      and l.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from shopping_lists l
    where l.id = shopping_list_items.shopping_list_id
      and l.user_id = auth.uid()
  )
);

create policy "shopping_list_items_delete_own"
on shopping_list_items for delete
to authenticated
using (
  exists (
    select 1
    from shopping_lists l
    where l.id = shopping_list_items.shopping_list_id
      and l.user_id = auth.uid()
  )
);
```

### `products` e `regional_prices` (catalogo read-only para autenticado)

```sql
create policy "products_select_authenticated"
on products for select
to authenticated
using (true);

create policy "regional_prices_select_authenticated"
on regional_prices for select
to authenticated
using (true);
```

Sem policies de insert/update/delete para `authenticated` nessas tabelas.

## Chaves e Segredos

- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: permitido no client.
- `SUPABASE_SERVICE_ROLE_KEY`: apenas server-side.
- Proibir logging de segredos em runtime.
- Revisar escopo de variaveis na Vercel.

## Validacao de Entrada

- `quantity > 0`.
- `unit` em (`un`, `kg`, `L`).
- `name` de lista com limite de tamanho.
- Sanitizacao de entrada textual para prevenir abuso.

## Auditoria e Monitoramento

- Registrar eventos relevantes de auth (sem dados sensiveis).
- Monitorar erros de acesso negado por RLS.
- Revisar periodicamente cobertura da seed e lacunas de preco.

## Riscos Conhecidos e Mitigacoes

- Falha de cobertura regional de preco:
  - Mitigacao: preco nacional obrigatorio por produto ativo.

- Exposicao indevida de dados entre usuarios:
  - Mitigacao: RLS estrito por ownership e testes de autorizacao.

- Uso incorreto de chave privilegiada:
  - Mitigacao: restringir `service_role` a server-only e casos pontuais.
