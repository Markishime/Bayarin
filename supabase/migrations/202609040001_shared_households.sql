-- Shared households. Apply after the existing Bayarin migrations.
-- A user belongs to one household at a time. The household creator is its admin.

create table if not exists public.households (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  join_id text not null unique default upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8)),
  created_by uuid not null references auth.users(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table if not exists public.household_memberships (
  household_id uuid not null references public.households(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'member' check (role in ('admin', 'member')),
  joined_at timestamptz not null default now(),
  primary key (household_id, user_id),
  unique (user_id)
);

create index if not exists households_name_lookup_idx on public.households (lower(btrim(name)));
create index if not exists household_memberships_household_idx on public.household_memberships (household_id, role);

alter table public.profiles add column if not exists household_id uuid references public.households(id) on delete set null;
alter table public.bills add column if not exists household_id uuid references public.households(id) on delete set null;
alter table public.activity_events add column if not exists household_id uuid references public.households(id) on delete set null;
create index if not exists bills_household_id_idx on public.bills (household_id, due_date);
create index if not exists activity_events_household_id_idx on public.activity_events (household_id, created_at desc);

-- Preserve existing accounts and their data as private, admin-owned households.
insert into public.households (name, created_by)
select coalesce(nullif(btrim(p.household_name), ''), 'My household'), p.id
from public.profiles p
where p.household_id is null
  and not exists (select 1 from public.households h where h.created_by = p.id);

update public.profiles p
set household_id = h.id
from public.households h
where h.created_by = p.id and p.household_id is null;

insert into public.household_memberships (household_id, user_id, role)
select p.household_id, p.id, 'admin'
from public.profiles p
where p.household_id is not null
on conflict (household_id, user_id) do nothing;

update public.bills b set household_id = p.household_id
from public.profiles p
where b.user_id = p.id and b.household_id is null;

update public.activity_events e set household_id = p.household_id
from public.profiles p
where e.user_id = p.id and e.household_id is null;

create or replace function public.is_household_member(target_household_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.household_memberships m
    where m.household_id = target_household_id and m.user_id = (select auth.uid())
  );
$$;

create or replace function public.is_household_admin(target_household_id uuid)
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.household_memberships m
    where m.household_id = target_household_id
      and m.user_id = (select auth.uid())
      and m.role = 'admin'
  );
$$;

drop policy if exists "Users can read their own profile" on public.profiles;
create policy "Household members can read profiles"
  on public.profiles for select to authenticated
  using ((select auth.uid()) = id or public.is_household_member(household_id));

alter table public.households enable row level security;
alter table public.household_memberships enable row level security;
grant select on public.households, public.household_memberships to authenticated;

drop policy if exists "Household members can view their household" on public.households;
create policy "Household members can view their household"
  on public.households for select to authenticated
  using (public.is_household_member(id));

drop policy if exists "Household members can view members" on public.household_memberships;
create policy "Household members can view members"
  on public.household_memberships for select to authenticated
  using (public.is_household_member(household_id));

-- Membership changes are deliberately limited to the RPCs below.
revoke insert, update, delete on public.households, public.household_memberships from authenticated;

drop policy if exists "Users can read household bills" on public.bills;
drop policy if exists "Users can create household bills" on public.bills;
drop policy if exists "Users can update household bills" on public.bills;
drop policy if exists "Users can delete household bills" on public.bills;
drop policy if exists "Users can read their own bills" on public.bills;
drop policy if exists "Users can create their own bills" on public.bills;
drop policy if exists "Users can update their own bills" on public.bills;
drop policy if exists "Users can delete their own bills" on public.bills;
create policy "Users can read household bills" on public.bills for select to authenticated
  using (public.is_household_member(household_id));
create policy "Users can create household bills" on public.bills for insert to authenticated
  with check ((select auth.uid()) = user_id and public.is_household_member(household_id));
create policy "Users can update household bills" on public.bills for update to authenticated
  using (public.is_household_member(household_id))
  with check (public.is_household_member(household_id));
create policy "Users can delete household bills" on public.bills for delete to authenticated
  using (public.is_household_member(household_id));

drop policy if exists "Users can read household activity" on public.activity_events;
drop policy if exists "Users can create household activity" on public.activity_events;
drop policy if exists "Users can read their own activity" on public.activity_events;
drop policy if exists "Users can create their own activity" on public.activity_events;
create policy "Users can read household activity" on public.activity_events for select to authenticated
  using (public.is_household_member(household_id));
create policy "Users can create household activity" on public.activity_events for insert to authenticated
  with check ((select auth.uid()) = user_id and public.is_household_member(household_id));

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
  update public.profiles set household_id = created.id, household_name = created.name where id = (select auth.uid());
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
  update public.profiles set household_id = target.id, household_name = target.name where id = (select auth.uid());
  return query select target.id, target.name, target.join_id, 'member'::text;
end;
$$;

create or replace function public.remove_household_member(target_user_id uuid)
returns void
language plpgsql security definer set search_path = public
as $$
declare target_household uuid;
begin
  select household_id into target_household from public.household_memberships where user_id = (select auth.uid());
  if target_household is null or not public.is_household_admin(target_household) then raise exception 'Only a household admin can remove members.'; end if;
  if target_user_id = (select auth.uid()) then raise exception 'An admin cannot remove themselves.'; end if;
  delete from public.household_memberships where household_id = target_household and user_id = target_user_id;
  update public.profiles set household_id = null, household_name = 'My household' where id = target_user_id;
end;
$$;

grant execute on function public.create_household(text), public.join_household(text), public.remove_household_member(uuid) to authenticated;
