-- Atomic household activity, payment notifications, and recurring bills.
create or replace function public.join_household(lookup text)
returns table (id uuid, name text, join_id text, role text)
language plpgsql security definer set search_path = '' as $$
declare target public.households; match_count integer;
begin
  if auth.uid() is null then raise exception 'You need to sign in first.'; end if;
  if exists (select 1 from public.household_memberships m where m.user_id = auth.uid()) then raise exception 'You already belong to a household.'; end if;
  select count(*) into match_count from public.households h
    where upper(h.join_id) = upper(btrim(lookup)) or lower(btrim(h.name)) = lower(btrim(lookup));
  if match_count = 0 then raise exception 'We could not find that household. Check the ID or name and try again.'; end if;
  if match_count > 1 then raise exception 'More than one household has that name. Ask for the Household ID.'; end if;
  select h.* into target from public.households h
    where upper(h.join_id) = upper(btrim(lookup)) or lower(btrim(h.name)) = lower(btrim(lookup));
  insert into public.household_memberships(household_id,user_id,role) values(target.id,auth.uid(),'member');
  update public.profiles p set household_id=target.id, household_name=target.name where p.id=auth.uid();
  return query select target.id,target.name,target.join_id,'member'::text;
end;
$$;

alter table public.bills add column if not exists previous_bill_id uuid references public.bills(id) on delete set null;
alter table public.bills add column if not exists receipt_path text;
create unique index if not exists bills_previous_bill_unique on public.bills(previous_bill_id) where previous_bill_id is not null;

create or replace function public.record_household_bill_change()
returns trigger language plpgsql security definer set search_path = '' as $$
declare
  actor uuid := auth.uid();
  event_name text;
  event_title text;
  next_date date;
begin
  if actor is null or new.household_id is null then return new; end if;
  if tg_op = 'INSERT' then
    event_name := 'bill_added'; event_title := new.provider || ' bill added';
  elsif old.status is distinct from new.status and new.status = 'paid' then
    event_name := 'bill_marked_paid'; event_title := new.provider || ' marked paid';
  elsif old.status is distinct from new.status and new.status = 'archived' then
    event_name := 'bill_archived'; event_title := new.provider || ' archived';
  else
    event_name := 'bill_updated'; event_title := new.provider || ' updated';
  end if;
  insert into public.activity_events(user_id, household_id, bill_id, event_type, title, amount, metadata)
  values(actor, new.household_id, new.id, event_name, event_title, new.amount,
    jsonb_build_object('category', new.category, 'status', new.status, 'paid_by', new.paid_by, 'payment_method', new.payment_method));

  if event_name = 'bill_marked_paid' then
    insert into public.notifications(user_id, title, body, type, bill_id, metadata)
    select m.user_id, event_title, new.provider || ' payment recorded: ₱' || new.amount::text,
      'payment_update', new.id, jsonb_build_object('actor_id', actor, 'status', 'paid')
    from public.household_memberships m
    left join public.notification_preferences p on p.user_id = m.user_id
    where m.household_id = new.household_id and coalesce(p.payment_updates, true);
    next_date := case new.recurrence
      when 'weekly' then new.due_date + 7
      when 'monthly' then (new.due_date + interval '1 month')::date
      when 'yearly' then (new.due_date + interval '1 year')::date
      else null end;
    if next_date is not null then
      insert into public.bills(user_id, household_id, provider, category, account_number, alias, amount, due_date, recurrence, reminder_days, status, previous_bill_id)
      values(actor, new.household_id, new.provider, new.category, new.account_number, new.alias, new.amount, next_date, new.recurrence, new.reminder_days, 'upcoming', new.id)
      on conflict do nothing;
    end if;
  end if;
  return new;
end;
$$;
revoke all on function public.record_household_bill_change() from public;
drop trigger if exists record_household_bill_change on public.bills;
create trigger record_household_bill_change after insert or update on public.bills for each row execute function public.record_household_bill_change();

-- Race-safe daily reminders. Run on app open and after household changes.
create unique index if not exists notifications_reminder_day_unique
on public.notifications(user_id, bill_id, (metadata->>'due_date'), (metadata->>'reminder_day'))
where type = 'due_reminder' and metadata ? 'reminder_day';

create or replace function public.sync_due_reminders(target_household_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare today date := (now() at time zone 'Asia/Manila')::date;
begin
  if auth.uid() is null or not public.is_household_member(target_household_id) then raise exception 'Household membership required'; end if;
  insert into public.notifications(user_id, title, body, type, bill_id, metadata)
  select auth.uid(), b.provider || case when b.due_date = today then ' is due today' else ' is due soon' end,
    '₱' || b.amount::text || ' due ' || b.due_date::text, 'due_reminder', b.id,
    jsonb_build_object('due_date', b.due_date::text, 'reminder_day', today::text)
  from public.bills b left join public.notification_preferences p on p.user_id = auth.uid()
  where b.household_id = target_household_id and b.status not in ('paid','archived','draft')
    and b.reminder_days > 0 and b.due_date between today and today + b.reminder_days
    and coalesce(p.due_soon, true) and (b.category <> 'Government' or coalesce(p.government_deadlines, true))
  on conflict do nothing;
end;
$$;
revoke all on function public.sync_due_reminders(uuid) from public;
grant execute on function public.sync_due_reminders(uuid) to authenticated;

-- A user's household membership is managed only by the household RPCs.
revoke update on public.profiles from authenticated;
grant update(full_name, onboarding_completed, preferred_language, appearance, push_token) on public.profiles to authenticated;
