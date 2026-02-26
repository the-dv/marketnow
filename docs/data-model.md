# Data Model - Supabase

## Objetivo

Modelar o MarketNow com foco em preco por usuario como fonte principal e seed regional apenas fallback.

## Tabelas principais

### `profiles`
- `id uuid` PK/FK `auth.users(id)`
- `full_name text`
- `preferred_uf char(2)`
- `created_at timestamptz`
- `updated_at timestamptz`

### `shopping_lists`
- `id uuid` PK
- `user_id uuid` FK `auth.users`
- `name text`
- `status text` (`active|archived`)
- `created_at timestamptz`
- `updated_at timestamptz`

### `shopping_list_items`
- `id uuid` PK
- `shopping_list_id uuid` FK `shopping_lists`
- `product_id uuid` FK `products`
- `quantity numeric(10,3)` > 0
- `unit text` (`un|kg|L`)
- `purchased_at timestamptz null`
- `paid_price numeric(10,2) null`
- `paid_currency char(3) null default 'BRL'`
- `created_at timestamptz`
- `updated_at timestamptz`

Uso:
- `paid_price` registra o valor real daquela compra/lista.
- Esse valor pode ou nao virar referencia futura em `user_product_prices`.

### `categories`
- `id uuid` PK
- `slug text` unique
- `name text` unique
- `created_at timestamptz`
- `updated_at timestamptz`

Categorias seed do MVP:
- Alimentos
- Higiene
- Limpeza
- Bebidas
- Utilidades

### `products`
- `id uuid` PK
- `slug text` unique
- `name text`
- `category_id uuid` FK `categories`
- `unit text` (`un|kg|L`)
- `is_active boolean`
- `created_at timestamptz`
- `updated_at timestamptz`

### `user_product_prices` (fonte principal de referencia)
- `id uuid` PK
- `user_id uuid` FK `auth.users`
- `product_id uuid` FK `products`
- `paid_price numeric(10,2)` > 0
- `currency char(3)` = BRL
- `purchased_at timestamptz`
- `source text` (ex.: `manual`)
- `created_at timestamptz`

Sem compartilhamento entre usuarios.

### `user_product_price_stats` (opcional)

Pode ser tabela materializada ou view para acelerar leitura:
- `user_id`
- `product_id`
- `last_price`
- `avg_price`
- `last_purchased_at`

No MVP atual, o calculo usa `user_product_prices` direto.

### `regional_prices` (fallback seed)
- `id uuid` PK
- `product_id uuid` FK `products`
- `region_type text` (`state|macro_region|national`)
- `region_code text` (UF, macro-regiao, BR)
- `avg_price numeric(10,2)` > 0
- `currency char(3)` = BRL
- `source text`
- `effective_date date`
- `created_at timestamptz`
- `updated_at timestamptz`

Importante:
- `regional_prices` nao e fonte principal.
- e somente fallback quando nao existe historico do proprio usuario.

## Relacionamentos

- `auth.users` 1:N `shopping_lists`
- `shopping_lists` 1:N `shopping_list_items`
- `categories` 1:N `products`
- `products` 1:N `shopping_list_items`
- `auth.users` 1:N `user_product_prices`
- `products` 1:N `user_product_prices`
- `products` 1:N `regional_prices`

## Indices principais

- `shopping_lists(user_id, updated_at desc)`
- `shopping_list_items(shopping_list_id)`
- `products(category_id)`
- `user_product_prices(user_id, product_id, purchased_at desc)`
- `regional_prices(product_id, region_type, region_code, effective_date desc)`

## RLS (resumo)

- `shopping_lists`, `shopping_list_items`, `user_product_prices`, `profiles`:
  usuario so acessa os proprios dados.
- `categories`, `products`, `regional_prices`:
  leitura autenticada.
- Escrita em tabelas seed via migracao/seed (nao pelo client).
