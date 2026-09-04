-- Real-time subscriptions, paid_by tracking, and notifications system.
-- Apply after 202609030002_household_features.sql.

-- 1. Add paid_by column to bills to track which household member paid.
alter table public.bills add column if not exists paid_by text;
comment on column public.bills.paid_by is 'Name of the household member who paid this bill';

-- 2. Create notifications table for real-time notification delivery.
create table if not exists public.notifications (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null,
  body text not null,
  type text not null default 'general',
  bill_id uuid,
  read boolean not null default false,
  metadata jsonb default '{}',
  created_at timestamptz not null default now()
);

create index if not exists notifications_user_id_idx
  on public.notifications(user_id, created_at desc);

create index if not exists notifications_user_unread_idx
  on public.notifications(user_id, read) where read = false;

-- 3. Enable RLS for notifications.
alter table public.notifications enable row level security;

revoke all on public.notifications from anon;
grant select, insert, update, delete on public.notifications to authenticated;

drop policy if exists "Notifications are private to their owner" on public.notifications;
create policy "Notifications are private to their owner"
  on public.notifications for all
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

-- 4. Enable Realtime on all tables (publication).
-- This allows Supabase realtime to broadcast changes.
alter publication supabase_realtime add table public.bills;
alter publication supabase_realtime add table public.activity_events;
alter publication supabase_realtime add table public.notifications;
alter publication supabase_realtime add table public.household_members;

-- 5. Add reminder_days default to 5 for new bills (user requested 5-day reminders).
-- Existing bills keep their current reminder_days, new ones default to 5.
alter table public.bills alter column reminder_days set default 5;

-- 6. Add push_token to profiles for push notifications.
alter table public.profiles add column if not exists push_token text;
