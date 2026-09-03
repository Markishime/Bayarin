-- Household collaboration and reminder preferences.
-- Apply after 202609030001_bayarin_auth.sql.

create table if not exists public.household_members (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 120),
  role text not null default 'Household member',
  contact text,
  created_at timestamptz not null default now()
);

create index if not exists household_members_user_id_idx
  on public.household_members(user_id, created_at);

create table if not exists public.notification_preferences (
  user_id uuid primary key references auth.users(id) on delete cascade,
  due_soon boolean not null default true,
  weekly_summary boolean not null default true,
  payment_updates boolean not null default true,
  government_deadlines boolean not null default true,
  updated_at timestamptz not null default now()
);

alter table public.household_members enable row level security;
alter table public.notification_preferences enable row level security;

revoke all on public.household_members from anon;
revoke all on public.notification_preferences from anon;
grant select, insert, update, delete on public.household_members to authenticated;
grant select, insert, update, delete on public.notification_preferences to authenticated;

drop policy if exists "Members are private to their owner" on public.household_members;
create policy "Members are private to their owner"
  on public.household_members for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

drop policy if exists "Notification preferences are private to their owner" on public.notification_preferences;
create policy "Notification preferences are private to their owner"
  on public.notification_preferences for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);
