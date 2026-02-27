-- STEP-18
-- Fix definitivo para ON CONFLICT do bulk mark-all.
-- Regra adotada:
-- - shopping_list_items: no maximo 1 linha por (shopping_list_id, product_id).
-- - user_product_prices: historico (nao unico por user_id+product_id).

with ranked_items as (
  select
    id,
    row_number() over (
      partition by shopping_list_id, product_id
      order by updated_at desc, created_at desc, id desc
    ) as rn
  from public.shopping_list_items
)
delete from public.shopping_list_items items
using ranked_items ranked
where items.id = ranked.id
  and ranked.rn > 1;

create unique index if not exists shopping_list_items_unique_list_product_idx
  on public.shopping_list_items(shopping_list_id, product_id);
