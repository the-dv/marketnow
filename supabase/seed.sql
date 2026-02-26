with category_seed(slug, name) as (
  values
    ('alimentos', 'Alimentos'),
    ('higiene', 'Higiene'),
    ('limpeza', 'Limpeza'),
    ('bebidas', 'Bebidas'),
    ('utilidades', 'Utilidades')
)
insert into public.categories (slug, name)
select slug, name
from category_seed
on conflict (slug) do update set
  name = excluded.name,
  updated_at = now();

with product_seed(slug, name, category_slug, unit) as (
  values
    ('arroz-5kg', 'Arroz 5kg', 'alimentos', 'kg'),
    ('feijao-1kg', 'Feijao 1kg', 'alimentos', 'kg'),
    ('oleo-900ml', 'Oleo 900ml', 'alimentos', 'L'),
    ('acucar-1kg', 'Acucar 1kg', 'alimentos', 'kg'),
    ('cafe-500g', 'Cafe 500g', 'alimentos', 'kg'),
    ('leite-1l', 'Leite 1L', 'bebidas', 'L'),
    ('ovos-duzia', 'Ovos (duzia)', 'alimentos', 'un'),
    ('pao-forma', 'Pao de forma', 'alimentos', 'un'),
    ('macarrao-500g', 'Macarrao 500g', 'alimentos', 'kg'),
    ('molho-tomate', 'Molho de tomate', 'alimentos', 'un'),
    ('farinha-trigo-1kg', 'Farinha de trigo 1kg', 'alimentos', 'kg'),
    ('sal-1kg', 'Sal 1kg', 'alimentos', 'kg'),
    ('manteiga-200g', 'Manteiga 200g', 'alimentos', 'kg'),
    ('queijo-300g', 'Queijo 300g', 'alimentos', 'kg'),
    ('frango-1kg', 'Frango 1kg', 'alimentos', 'kg'),
    ('carne-bovina-1kg', 'Carne bovina 1kg', 'alimentos', 'kg'),
    ('banana-1kg', 'Banana 1kg', 'alimentos', 'kg'),
    ('batata-1kg', 'Batata 1kg', 'alimentos', 'kg'),
    ('cebola-1kg', 'Cebola 1kg', 'alimentos', 'kg'),
    ('tomate-1kg', 'Tomate 1kg', 'alimentos', 'kg')
)
insert into public.products (slug, name, category_id, unit, is_active)
select ps.slug, ps.name, c.id, ps.unit, true
from product_seed ps
join public.categories c on c.slug = ps.category_slug
on conflict (slug) do update set
  name = excluded.name,
  category_id = excluded.category_id,
  unit = excluded.unit,
  is_active = true,
  updated_at = now();

delete from public.regional_prices where source = 'marketnow_seed_v1';

with base_prices(slug, national_price) as (
  values
    ('arroz-5kg', 28.90::numeric),
    ('feijao-1kg', 8.49::numeric),
    ('oleo-900ml', 7.89::numeric),
    ('acucar-1kg', 5.29::numeric),
    ('cafe-500g', 16.90::numeric),
    ('leite-1l', 4.79::numeric),
    ('ovos-duzia', 11.50::numeric),
    ('pao-forma', 9.90::numeric),
    ('macarrao-500g', 5.49::numeric),
    ('molho-tomate', 3.99::numeric),
    ('farinha-trigo-1kg', 6.39::numeric),
    ('sal-1kg', 2.49::numeric),
    ('manteiga-200g', 10.90::numeric),
    ('queijo-300g', 14.90::numeric),
    ('frango-1kg', 14.50::numeric),
    ('carne-bovina-1kg', 39.90::numeric),
    ('banana-1kg', 8.90::numeric),
    ('batata-1kg', 7.50::numeric),
    ('cebola-1kg', 6.90::numeric),
    ('tomate-1kg', 8.10::numeric)
),
price_products as (
  select p.id as product_id, b.national_price
  from public.products p
  join base_prices b on b.slug = p.slug
),
ufs(code, factor) as (
  values
    ('AC', 1.09::numeric), ('AL', 1.00::numeric), ('AP', 1.08::numeric), ('AM', 1.10::numeric),
    ('BA', 0.99::numeric), ('CE', 0.98::numeric), ('DF', 1.03::numeric), ('ES', 1.01::numeric),
    ('GO', 1.00::numeric), ('MA', 0.97::numeric), ('MT', 1.02::numeric), ('MS', 1.01::numeric),
    ('MG', 1.00::numeric), ('PA', 1.07::numeric), ('PB', 0.98::numeric), ('PR', 1.01::numeric),
    ('PE', 0.99::numeric), ('PI', 0.97::numeric), ('RJ', 1.05::numeric), ('RN', 0.99::numeric),
    ('RS', 1.02::numeric), ('RO', 1.06::numeric), ('RR', 1.11::numeric), ('SC', 1.01::numeric),
    ('SP', 1.04::numeric), ('SE', 0.99::numeric), ('TO', 1.02::numeric)
),
macro_regions(code, factor) as (
  values
    ('N', 1.08::numeric), ('NE', 0.99::numeric), ('CO', 1.02::numeric), ('SE', 1.03::numeric), ('S', 1.02::numeric)
)
insert into public.regional_prices (
  product_id, region_type, region_code, avg_price, currency, source, effective_date
)
select
  pp.product_id,
  'national',
  'BR',
  pp.national_price,
  'BRL',
  'marketnow_seed_v1',
  current_date
from price_products pp

union all

select
  pp.product_id,
  'state',
  u.code,
  round(pp.national_price * u.factor, 2),
  'BRL',
  'marketnow_seed_v1',
  current_date
from price_products pp
cross join ufs u

union all

select
  pp.product_id,
  'macro_region',
  mr.code,
  round(pp.national_price * mr.factor, 2),
  'BRL',
  'marketnow_seed_v1',
  current_date
from price_products pp
cross join macro_regions mr;

