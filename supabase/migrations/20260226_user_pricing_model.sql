create extension if not exists pgcrypto;

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  slug text unique,
  name text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'products'
      and column_name = 'default_unit'
  ) then
    alter table public.products rename column default_unit to unit;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'products'
      and column_name = 'category_id'
  ) then
    alter table public.products add column category_id uuid null;
  end if;
end $$;

do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'products'
      and column_name = 'owner_user_id'
  ) then
    alter table public.products add column owner_user_id uuid null references auth.users(id) on delete cascade;
  end if;
end $$;

update public.categories set slug = lower(slug) where slug is not null;

insert into public.categories (slug, name)
values ('utilidades', 'Utilidades')
on conflict (slug) do nothing;

update public.products
set category_id = c.id
from public.categories c
where c.slug = 'utilidades'
  and public.products.category_id is null;

alter table public.products
  alter column category_id drop not null;

do $$
begin
  alter table public.products
    add constraint products_category_fk
    foreign key (category_id) references public.categories(id);
exception
  when duplicate_object then
    null;
end $$;

do $$
begin
  alter table public.products
    add constraint products_unit_check
    check (unit in ('un', 'kg', 'L'));
exception
  when duplicate_object then
    null;
end $$;

create index if not exists products_category_idx
  on public.products(category_id);
create index if not exists products_owner_user_idx
  on public.products(owner_user_id);

do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'shopping_list_items'
      and column_name = 'purchased_at'
  ) then
    alter table public.shopping_list_items add column purchased_at timestamptz null;
  end if;
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'shopping_list_items'
      and column_name = 'paid_price'
  ) then
    alter table public.shopping_list_items add column paid_price numeric(10,2) null;
  end if;
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'shopping_list_items'
      and column_name = 'paid_currency'
  ) then
    alter table public.shopping_list_items add column paid_currency char(3) null default 'BRL';
  end if;
end $$;

do $$
begin
  alter table public.shopping_list_items
    add constraint shopping_list_items_paid_price_check
    check (paid_price is null or paid_price > 0);
exception
  when duplicate_object then
    null;
end $$;

do $$
begin
  alter table public.shopping_list_items
    add constraint shopping_list_items_paid_currency_check
    check (paid_currency is null or paid_currency = 'BRL');
exception
  when duplicate_object then
    null;
end $$;

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

create index if not exists user_product_prices_lookup_idx
  on public.user_product_prices(user_id, product_id, purchased_at desc);

alter table public.categories enable row level security;
alter table public.user_product_prices enable row level security;
alter table public.products enable row level security;

drop policy if exists categories_select_authenticated on public.categories;
drop policy if exists products_select_authenticated on public.products;
drop policy if exists products_select_seed_or_own on public.products;
drop policy if exists products_insert_own_custom on public.products;
drop policy if exists products_update_own_custom on public.products;
drop policy if exists products_delete_own_custom on public.products;
drop policy if exists user_product_prices_select_own on public.user_product_prices;
drop policy if exists user_product_prices_insert_own on public.user_product_prices;
drop policy if exists user_product_prices_update_own on public.user_product_prices;
drop policy if exists user_product_prices_delete_own on public.user_product_prices;

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
