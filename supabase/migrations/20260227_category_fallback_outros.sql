do $$
declare
  v_outros_id uuid;
begin
  insert into public.categories (slug, name)
  values ('outros', 'Outros')
  on conflict (slug) do update set
    name = excluded.name,
    updated_at = now();

  select id into v_outros_id
  from public.categories
  where slug = 'outros'
  limit 1;

  if v_outros_id is null then
    raise exception 'Nao foi possivel resolver categoria outros';
  end if;

  update public.products p
  set category_id = v_outros_id,
      updated_at = now()
  where p.category_id is null;

  alter table public.products
    alter column category_id set not null;
end $$;

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
