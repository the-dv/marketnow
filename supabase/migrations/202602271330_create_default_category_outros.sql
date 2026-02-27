do $$
begin
  if not exists (
    select 1
    from pg_constraint c
    join pg_class t on t.oid = c.conrelid
    join pg_namespace n on n.oid = t.relnamespace
    where n.nspname = 'public'
      and t.relname = 'categories'
      and c.contype = 'u'
      and c.conname = 'categories_slug_key'
  ) then
    alter table public.categories
      add constraint categories_slug_key unique (slug);
  end if;
end $$;

insert into public.categories (slug, name)
values ('outros', 'Outros')
on conflict (slug) do update set
  name = excluded.name,
  updated_at = now();
