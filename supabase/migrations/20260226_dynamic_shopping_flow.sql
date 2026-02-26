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
