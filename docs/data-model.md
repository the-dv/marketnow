# Data Model - Supabase

## Objetivo

Definir o modelo relacional minimo do MVP no Supabase para suportar autenticacao, listas de compras e precificacao regional seed.

## Convencoes Gerais

- Banco: PostgreSQL (Supabase).
- IDs: `uuid`.
- Timestamps: `created_at`, `updated_at` com timezone.
- Moeda padrao: BRL.
- Escopo geografico inicial: Brasil.

## Tabelas

### `profiles` (opcional no dominio, incluida no MVP)

Finalidade: armazenar preferencias basicas do usuario.

Colunas sugeridas:
- `id uuid primary key references auth.users(id) on delete cascade`
- `full_name text null`
- `preferred_uf char(2) null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Indice sugerido:
- `profiles_preferred_uf_idx(preferred_uf)`

### `shopping_lists`

Finalidade: listas pertencentes ao usuario autenticado.

Colunas sugeridas:
- `id uuid primary key default gen_random_uuid()`
- `user_id uuid not null references auth.users(id) on delete cascade`
- `name text not null`
- `status text not null default 'active'` (ex.: `active`, `archived`)
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Indices sugeridos:
- `shopping_lists_user_updated_idx(user_id, updated_at desc)`

### `shopping_list_items`

Finalidade: itens vinculados a uma lista.

Colunas sugeridas:
- `id uuid primary key default gen_random_uuid()`
- `shopping_list_id uuid not null references shopping_lists(id) on delete cascade`
- `product_id uuid not null references products(id)`
- `quantity numeric(10,3) not null`
- `unit text not null` (`un`, `kg`, `L`)
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Constraints sugeridas:
- `check (quantity > 0)`
- `check (unit in ('un', 'kg', 'L'))`

Indices sugeridos:
- `shopping_list_items_list_idx(shopping_list_id)`
- `shopping_list_items_product_idx(product_id)`

### `products`

Finalidade: catalogo base de produtos disponiveis para composicao da lista.

Colunas sugeridas:
- `id uuid primary key default gen_random_uuid()`
- `slug text not null unique`
- `name text not null`
- `default_unit text not null` (`un`, `kg`, `L`)
- `is_active boolean not null default true`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Constraints sugeridas:
- `check (default_unit in ('un', 'kg', 'L'))`

Indices sugeridos:
- `products_slug_uidx(slug)` unique
- `products_active_idx(is_active)`

### `regional_prices`

Finalidade: precos medios por produto e recorte regional (seed propria).

Colunas sugeridas:
- `id uuid primary key default gen_random_uuid()`
- `product_id uuid not null references products(id) on delete cascade`
- `region_type text not null` (`state`, `macro_region`, `national`)
- `region_code text not null`
  - UF: `SP`, `RJ`, etc.
  - Macro-regiao: `SE`, `S`, `NE`, `N`, `CO`
  - Nacional: `BR`
- `avg_price numeric(10,2) not null`
- `currency char(3) not null default 'BRL'`
- `source text not null` (ex.: `marketnow_seed_v1`)
- `effective_date date not null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()`

Constraints sugeridas:
- `check (avg_price > 0)`
- `check (region_type in ('state', 'macro_region', 'national'))`
- `check (currency = 'BRL')`

Indices sugeridos:
- `regional_prices_lookup_idx(product_id, region_type, region_code, effective_date desc)`
- `regional_prices_region_idx(region_type, region_code)`

## Relacionamentos

- `auth.users (1) -> (1) profiles`
- `auth.users (1) -> (N) shopping_lists`
- `shopping_lists (1) -> (N) shopping_list_items`
- `products (1) -> (N) shopping_list_items`
- `products (1) -> (N) regional_prices`

## Estrategia de Seed Inicial

Objetivo minimo:
- Pelo menos 20 produtos ativos no catalogo.
- Para cada produto:
  - pelo menos 1 preco nacional (`region_type='national', region_code='BR'`)
  - precos por UF para cobertura principal
  - opcional: precos por macro-regiao para melhorar fallback

Sugestao de produtos base (exemplo):
- Arroz 5kg
- Feijao 1kg
- Oleo 900ml
- Acucar 1kg
- Cafe 500g
- Leite 1L
- Ovo (duzia)
- Pao de forma
- Macarrao 500g
- Molho de tomate
- Farinha de trigo 1kg
- Sal 1kg
- Manteiga 200g
- Queijo 300g
- Frango 1kg
- Carne bovina 1kg
- Banana 1kg
- Batata 1kg
- Cebola 1kg
- Tomate 1kg

## Integridade e Regras

- `shopping_list_items.quantity` sempre maior que 0.
- Unidade do item deve ser valida (`un`, `kg`, `L`).
- Unidade do item deve ser compativel com `products.default_unit` no MVP.
- `regional_prices` deve sempre possuir preco nacional para evitar lacuna de estimativa.
