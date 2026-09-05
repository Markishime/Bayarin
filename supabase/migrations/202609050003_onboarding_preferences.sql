alter table public.profiles add column if not exists selected_services text[] not null default array['electricity','water','internet','load'];
grant update(selected_services) on public.profiles to authenticated;
alter table public.notification_preferences add column if not exists load_reminders boolean not null default true;

create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = '' as $$
begin
  insert into public.profiles(id,full_name,onboarding_completed,preferred_language,appearance,selected_services)
  values(new.id,coalesce(new.raw_user_meta_data->>'full_name',''),
    coalesce((new.raw_user_meta_data->>'onboarding_completed')::boolean,false),
    case when new.raw_user_meta_data->>'preferred_language' in ('English','Filipino','Cebuano') then new.raw_user_meta_data->>'preferred_language' else 'English' end,
    case when new.raw_user_meta_data->>'appearance' = 'dark' then 'dark' else 'light' end,
    case when jsonb_typeof(new.raw_user_meta_data->'services')='array' then array(select jsonb_array_elements_text(new.raw_user_meta_data->'services')) else array['electricity','water','internet','load'] end);
  insert into public.notification_preferences(user_id,due_soon,weekly_summary,load_reminders,government_deadlines)
  values(new.id,coalesce((new.raw_user_meta_data->>'dueSoon')::boolean,true),coalesce((new.raw_user_meta_data->>'weeklySummary')::boolean,true),coalesce((new.raw_user_meta_data->>'loadReminders')::boolean,true),coalesce((new.raw_user_meta_data->>'lingkodDeadlines')::boolean,true));
  return new;
end;
$$;

create unique index if not exists notifications_weekly_unique on public.notifications(user_id,(metadata->>'week')) where type='weekly_summary';
create or replace function public.sync_due_reminders(target_household_id uuid)
returns void language plpgsql security definer set search_path = '' as $$
declare today date := (now() at time zone 'Asia/Manila')::date;
begin
  if auth.uid() is null or not public.is_household_member(target_household_id) then raise exception 'Household membership required'; end if;
  insert into public.notifications(user_id,title,body,type,bill_id,metadata)
  select auth.uid(),b.provider || case when b.due_date=today then ' is due today' else ' is due soon' end,
    '₱' || b.amount::text || ' due ' || b.due_date::text,'due_reminder',b.id,jsonb_build_object('due_date',b.due_date::text,'reminder_day',today::text)
  from public.bills b left join public.notification_preferences p on p.user_id=auth.uid()
  where b.household_id=target_household_id and b.status not in ('paid','archived','draft') and b.reminder_days>0
    and b.due_date between today and today+b.reminder_days and coalesce(p.due_soon,true)
    and (b.category<>'Government' or coalesce(p.government_deadlines,true))
    and (lower(b.category) not like '%load%' or coalesce(p.load_reminders,true))
  on conflict do nothing;
  insert into public.notifications(user_id,title,body,type,metadata)
  select auth.uid(),'Your week at home',count(*)::text || ' unpaid bills due in the next 7 days · ₱' || sum(b.amount)::text,
    'weekly_summary',jsonb_build_object('week',date_trunc('week',today::timestamp)::date::text)
  from public.bills b left join public.notification_preferences p on p.user_id=auth.uid()
  where b.household_id=target_household_id and b.status not in ('paid','archived','draft') and b.due_date between today and today+6
    and coalesce(p.weekly_summary,true)
  having count(*)>0 on conflict do nothing;
end;
$$;
