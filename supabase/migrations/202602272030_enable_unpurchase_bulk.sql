-- STEP-19
-- Garante policy de UPDATE para permitir desmarcar compras em massa
-- apenas para itens que pertencem a listas do usuario autenticado.

alter table public.shopping_list_items enable row level security;

drop policy if exists shopping_list_items_update_own on public.shopping_list_items;

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
