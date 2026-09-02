-- Bayarin authentication, profile, preference, and household data model.
-- Run this migration from the Supabase SQL editor or Supabase CLI.

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  household_name text not null default 'My household',
  onboarding_completed boolean not null default false,
  preferred_language text not null default 'English'
    check (preferred_language in ('English', 'Filipino', 'Cebuano')),
  appearance text not null default 'light'
    check (appearance in ('light', 'dark', 'system')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bills (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  provider text not null,
  category text not null,
  account_number text,
  alias text,
  amount numeric(12,2) not null check (amount >= 0),
  due_date date not null,
  billing_period text,
  recurrence text not null default 'monthly',
  reminder_days integer not null default 3 check (reminder_days between 0 and 90),
  status text not null default 'upcoming'
    check (status in ('draft', 'upcoming', 'due_soon', 'paid', 'overdue', 'archived')),
  paid_at timestamptz,
  payment_method text,
  reference_number text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  bill_id uuid references public.bills(id) on delete set null,
  event_type text not null,
  title text not null,
  amount numeric(12,2),
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists bills_user_id_idx on public.bills(user_id);
create index if not exists bills_user_due_date_idx on public.bills(user_id, due_date);
create index if not exists activity_events_user_id_idx on public.activity_events(user_id);
create index if not exists activity_events_user_created_idx on public.activity_events(user_id, created_at desc);

alter table public.profiles enable row level security;
alter table public.bills enable row level security;
alter table public.activity_events enable row level security;

revoke all on table public.profiles, public.bills, public.activity_events from anon;
grant select, insert, update, delete on table public.profiles, public.bills, public.activity_events to authenticated;

create policy "Users can read their own profile"
on public.profiles for select to authenticated
using ((select auth.uid()) = id);

create policy "Users can update their own profile"
on public.profiles for update to authenticated
using ((select auth.uid()) = id)
with check ((select auth.uid()) = id);

create policy "Users can read their own bills"
on public.bills for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own bills"
on public.bills for insert to authenticated
with check ((select auth.uid()) = user_id);

create policy "Users can update their own bills"
on public.bills for update to authenticated
using ((select auth.uid()) = user_id)
with check ((select auth.uid()) = user_id);

create policy "Users can delete their own bills"
on public.bills for delete to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can read their own activity"
on public.activity_events for select to authenticated
using ((select auth.uid()) = user_id);

create policy "Users can create their own activity"
on public.activity_events for insert to authenticated
with check ((select auth.uid()) = user_id);

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, full_name, onboarding_completed)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    coalesce((new.raw_user_meta_data ->> 'onboarding_completed')::boolean, false)
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at before update on public.profiles
for each row execute procedure public.set_updated_at();

drop trigger if exists bills_set_updated_at on public.bills;
create trigger bills_set_updated_at before update on public.bills
for each row execute procedure public.set_updated_at();
