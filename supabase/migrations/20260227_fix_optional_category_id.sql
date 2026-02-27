alter table public.products
  alter column category_id drop not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'products'
      and c.contype = 'f'
      and pg_get_constraintdef(c.oid) ilike '%(category_id)%references public.categories(id)%'
  ) then
    alter table public.products
      add constraint products_category_fk
      foreign key (category_id) references public.categories(id);
  end if;
end $$;
