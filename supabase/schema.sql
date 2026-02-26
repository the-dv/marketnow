create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text null,
  preferred_uf char(2) null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.shopping_lists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shopping_lists_status_check check (status in ('active', 'archived'))
);

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  name text not null,
  owner_user_id uuid null references auth.users(id) on delete cascade,
  category_id uuid not null references public.categories(id),
  unit text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint products_unit_check check (unit in ('un', 'kg', 'L'))
);

create table if not exists public.shopping_list_items (
  id uuid primary key default gen_random_uuid(),
  shopping_list_id uuid not null references public.shopping_lists(id) on delete cascade,
  product_id uuid not null references public.products(id),
  quantity numeric(10,3) not null,
  unit text not null,
  purchased_at timestamptz null,
  paid_price numeric(10,2) null,
  paid_currency char(3) null default 'BRL',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint shopping_list_items_quantity_check check (quantity > 0),
  constraint shopping_list_items_unit_check check (unit in ('un', 'kg', 'L')),
  constraint shopping_list_items_paid_price_check check (paid_price is null or paid_price > 0),
  constraint shopping_list_items_paid_currency_check check (paid_currency is null or paid_currency = 'BRL')
);

create table if not exists public.user_product_prices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  paid_price numeric(10,2) not null,
  currency char(3) not null default 'BRL',
  purchased_at timestamptz not null default now(),
  source text not null default 'manual',
  created_at timestamptz not null default now(),
  constraint user_product_prices_paid_price_check check (paid_price > 0),
  constraint user_product_prices_currency_check check (currency = 'BRL')
);

create table if not exists public.regional_prices (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  region_type text not null,
  region_code text not null,
  avg_price numeric(10,2) not null,
  currency char(3) not null default 'BRL',
  source text not null,
  effective_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint regional_prices_avg_price_check check (avg_price > 0),
  constraint regional_prices_region_type_check check (region_type in ('state', 'macro_region', 'national')),
  constraint regional_prices_currency_check check (currency = 'BRL')
);

create index if not exists profiles_preferred_uf_idx
  on public.profiles(preferred_uf);
create index if not exists shopping_lists_user_updated_idx
  on public.shopping_lists(user_id, updated_at desc);
create index if not exists shopping_list_items_list_idx
  on public.shopping_list_items(shopping_list_id);
create index if not exists shopping_list_items_product_idx
  on public.shopping_list_items(product_id);
create index if not exists products_category_idx
  on public.products(category_id);
create index if not exists products_owner_user_idx
  on public.products(owner_user_id);
create index if not exists products_active_idx
  on public.products(is_active);
create index if not exists user_product_prices_lookup_idx
  on public.user_product_prices(user_id, product_id, purchased_at desc);
create index if not exists regional_prices_lookup_idx
  on public.regional_prices(product_id, region_type, region_code, effective_date desc);

alter table public.profiles enable row level security;
alter table public.shopping_lists enable row level security;
alter table public.shopping_list_items enable row level security;
alter table public.user_product_prices enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.regional_prices enable row level security;

drop policy if exists profiles_select_own on public.profiles;
drop policy if exists profiles_insert_own on public.profiles;
drop policy if exists profiles_update_own on public.profiles;

create policy profiles_select_own
on public.profiles for select to authenticated
using (id = auth.uid());

create policy profiles_insert_own
on public.profiles for insert to authenticated
with check (id = auth.uid());

create policy profiles_update_own
on public.profiles for update to authenticated
using (id = auth.uid())
with check (id = auth.uid());

drop policy if exists shopping_lists_select_own on public.shopping_lists;
drop policy if exists shopping_lists_insert_own on public.shopping_lists;
drop policy if exists shopping_lists_update_own on public.shopping_lists;
drop policy if exists shopping_lists_delete_own on public.shopping_lists;

create policy shopping_lists_select_own
on public.shopping_lists for select to authenticated
using (user_id = auth.uid());

create policy shopping_lists_insert_own
on public.shopping_lists for insert to authenticated
with check (user_id = auth.uid());

create policy shopping_lists_update_own
on public.shopping_lists for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy shopping_lists_delete_own
on public.shopping_lists for delete to authenticated
using (user_id = auth.uid());

drop policy if exists shopping_list_items_select_own on public.shopping_list_items;
drop policy if exists shopping_list_items_insert_own on public.shopping_list_items;
drop policy if exists shopping_list_items_update_own on public.shopping_list_items;
drop policy if exists shopping_list_items_delete_own on public.shopping_list_items;

create policy shopping_list_items_select_own
on public.shopping_list_items for select to authenticated
using (
  exists (
    select 1
    from public.shopping_lists l
    where l.id = shopping_list_items.shopping_list_id
      and l.user_id = auth.uid()
  )
);

create policy shopping_list_items_insert_own
on public.shopping_list_items for insert to authenticated
with check (
  exists (
    select 1
    from public.shopping_lists l
    where l.id = shopping_list_items.shopping_list_id
      and l.user_id = auth.uid()
  )
);

create policy shopping_list_items_update_own
on public.shopping_list_items for update to authenticated
using (
  exists (
    select 1
    from public.shopping_lists l
    where l.id = shopping_list_items.shopping_list_id
      and l.user_id = auth.uid()
  )
)
with check (
  exists (
    select 1
    from public.shopping_lists l
    where l.id = shopping_list_items.shopping_list_id
      and l.user_id = auth.uid()
  )
);

create policy shopping_list_items_delete_own
on public.shopping_list_items for delete to authenticated
using (
  exists (
    select 1
    from public.shopping_lists l
    where l.id = shopping_list_items.shopping_list_id
      and l.user_id = auth.uid()
  )
);

drop policy if exists user_product_prices_select_own on public.user_product_prices;
drop policy if exists user_product_prices_insert_own on public.user_product_prices;
drop policy if exists user_product_prices_update_own on public.user_product_prices;
drop policy if exists user_product_prices_delete_own on public.user_product_prices;

create policy user_product_prices_select_own
on public.user_product_prices for select to authenticated
using (user_id = auth.uid());

create policy user_product_prices_insert_own
on public.user_product_prices for insert to authenticated
with check (user_id = auth.uid());

create policy user_product_prices_update_own
on public.user_product_prices for update to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

create policy user_product_prices_delete_own
on public.user_product_prices for delete to authenticated
using (user_id = auth.uid());

drop policy if exists categories_select_authenticated on public.categories;
drop policy if exists products_select_authenticated on public.products;
drop policy if exists products_select_seed_or_own on public.products;
drop policy if exists products_insert_own_custom on public.products;
drop policy if exists products_update_own_custom on public.products;
drop policy if exists products_delete_own_custom on public.products;
drop policy if exists regional_prices_select_authenticated on public.regional_prices;

create policy categories_select_authenticated
on public.categories for select to authenticated
using (true);

create policy products_select_seed_or_own
on public.products for select to authenticated
using (owner_user_id is null or owner_user_id = auth.uid());

create policy products_insert_own_custom
on public.products for insert to authenticated
with check (owner_user_id = auth.uid());

create policy products_update_own_custom
on public.products for update to authenticated
using (owner_user_id = auth.uid())
with check (owner_user_id = auth.uid());

create policy products_delete_own_custom
on public.products for delete to authenticated
using (owner_user_id = auth.uid());

create policy regional_prices_select_authenticated
on public.regional_prices for select to authenticated
using (true);
