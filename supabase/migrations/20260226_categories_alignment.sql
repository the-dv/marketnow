alter table public.products
  alter column category_id drop not null;

with official_categories(sort_order, slug, name) as (
  values
    (1, 'alimentos', 'Alimentos'),
    (2, 'bebidas', 'Bebidas'),
    (3, 'higiene', 'Higiene'),
    (4, 'limpeza', 'Limpeza'),
    (5, 'utilidades', 'Utilidades'),
    (6, 'outros', 'Outros')
)
insert into public.categories (slug, name)
select slug, name
from official_categories
on conflict (slug) do update set
  name = excluded.name,
  updated_at = now();
