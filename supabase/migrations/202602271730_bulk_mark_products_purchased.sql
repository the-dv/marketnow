create or replace function public.bulk_mark_products_purchased(
  p_list_id uuid,
  p_items jsonb,
  p_save_reference boolean default true
)
returns void
language plpgsql
security invoker
set search_path = public
as $$
declare
  v_user_id uuid;
  v_now timestamptz := now();
  v_input_count integer;
  v_owned_count integer;
begin
  v_user_id := auth.uid();

  if v_user_id is null then
    raise exception 'AUTH_REQUIRED';
  end if;

  if not exists (
    select 1
    from public.shopping_lists l
    where l.id = p_list_id
      and l.user_id = v_user_id
  ) then
    raise exception 'FORBIDDEN';
  end if;

  create temporary table _bulk_items (
    product_id uuid primary key,
    paid_price numeric(10,2) null
  ) on commit drop;

  insert into _bulk_items (product_id, paid_price)
  select
    nullif(trim(elem->>'productId'), '')::uuid as product_id,
    case
      when coalesce(trim(elem->>'paidPrice'), '') = '' then null
      else (elem->>'paidPrice')::numeric(10,2)
    end as paid_price
  from jsonb_array_elements(coalesce(p_items, '[]'::jsonb)) elem
  on conflict (product_id) do update
    set paid_price = excluded.paid_price;

  if exists (select 1 from _bulk_items where product_id is null) then
    raise exception 'VALIDATION_ERROR';
  end if;

  if exists (select 1 from _bulk_items where paid_price is not null and paid_price <= 0) then
    raise exception 'VALIDATION_ERROR';
  end if;

  select count(*) into v_input_count from _bulk_items;

  if v_input_count = 0 then
    raise exception 'VALIDATION_ERROR';
  end if;

  select count(*) into v_owned_count
  from public.products p
  join _bulk_items bi on bi.product_id = p.id
  where p.owner_user_id = v_user_id
    and p.is_active = true;

  if v_owned_count <> v_input_count then
    raise exception 'FORBIDDEN';
  end if;

  insert into public.shopping_list_items (
    shopping_list_id,
    product_id,
    quantity,
    unit,
    purchased_at,
    paid_price,
    paid_currency,
    updated_at
  )
  select
    p_list_id,
    p.id,
    coalesce(existing_item.quantity, 1),
    coalesce(existing_item.unit, p.unit),
    v_now,
    bi.paid_price,
    case when bi.paid_price is null then null else 'BRL'::char(3) end,
    v_now
  from _bulk_items bi
  join public.products p on p.id = bi.product_id
  left join public.shopping_list_items existing_item
    on existing_item.shopping_list_id = p_list_id
   and existing_item.product_id = bi.product_id
  on conflict (shopping_list_id, product_id)
  do update set
    quantity = excluded.quantity,
    unit = excluded.unit,
    purchased_at = excluded.purchased_at,
    paid_price = excluded.paid_price,
    paid_currency = excluded.paid_currency,
    updated_at = excluded.updated_at;

  if p_save_reference then
    insert into public.user_product_prices (
      user_id,
      product_id,
      paid_price,
      currency,
      purchased_at,
      source
    )
    select
      v_user_id,
      bi.product_id,
      bi.paid_price,
      'BRL'::char(3),
      v_now,
      'bulk'
    from _bulk_items bi
    where bi.paid_price is not null;
  end if;
end;
$$;

grant execute on function public.bulk_mark_products_purchased(uuid, jsonb, boolean) to authenticated;
