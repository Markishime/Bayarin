-- Membership changes update profiles through the protected household RPCs.
-- Publishing both tables lets signed-in clients refresh household access and rosters.
do $$
begin
  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'profiles') then
      alter publication supabase_realtime add table public.profiles;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'household_memberships') then
      alter publication supabase_realtime add table public.household_memberships;
    end if;
  end if;
end $$;
