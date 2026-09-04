-- Qualify profile columns inside RPCs because their returned `id` field shares the same name.

create or replace function public.create_household(household_name text)
returns table (id uuid, name text, join_id text, role text)
language plpgsql security definer set search_path = public
as $$
declare created public.households;
begin
  if (select auth.uid()) is null then raise exception 'You need to sign in first.'; end if;
  if exists (select 1 from public.household_memberships where user_id = (select auth.uid())) then
    raise exception 'You already belong to a household.';
  end if;
  insert into public.households (name, created_by)
  values (btrim(household_name), (select auth.uid())) returning * into created;
  insert into public.household_memberships (household_id, user_id, role)
  values (created.id, (select auth.uid()), 'admin');
  update public.profiles as profile_row
    set household_id = created.id, household_name = created.name
    where profile_row.id = (select auth.uid());
  return query select created.id, created.name, created.join_id, 'admin'::text;
end;
$$;

create or replace function public.join_household(lookup text)
returns table (id uuid, name text, join_id text, role text)
language plpgsql security definer set search_path = public
as $$
declare target public.households;
declare match_count integer;
begin
  if (select auth.uid()) is null then raise exception 'You need to sign in first.'; end if;
  if exists (select 1 from public.household_memberships where user_id = (select auth.uid())) then
    raise exception 'You already belong to a household.';
  end if;
  select count(*) into match_count from public.households
    where upper(join_id) = upper(btrim(lookup)) or lower(btrim(name)) = lower(btrim(lookup));
  if match_count = 0 then raise exception 'We could not find that household. Check the ID or name and try again.'; end if;
  if match_count > 1 then raise exception 'More than one household has that name. Ask the organizer for the Household ID.'; end if;
  select * into target from public.households
    where upper(join_id) = upper(btrim(lookup)) or lower(btrim(name)) = lower(btrim(lookup));
  insert into public.household_memberships (household_id, user_id, role)
  values (target.id, (select auth.uid()), 'member');
  update public.profiles as profile_row
    set household_id = target.id, household_name = target.name
    where profile_row.id = (select auth.uid());
  return query select target.id, target.name, target.join_id, 'member'::text;
end;
$$;
