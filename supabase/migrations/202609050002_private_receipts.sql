insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values('receipts','receipts',false,10485760,array['image/jpeg','image/png','application/pdf'])
on conflict(id) do update set public=false, file_size_limit=10485760, allowed_mime_types=array['image/jpeg','image/png','application/pdf'];

drop policy if exists "Household members read receipts" on storage.objects;
create policy "Household members read receipts" on storage.objects for select to authenticated
using(bucket_id='receipts' and exists (
  select 1 from public.household_memberships m where m.user_id=auth.uid() and m.household_id::text=(storage.foldername(name))[1]
));
drop policy if exists "Household members upload receipts" on storage.objects;
create policy "Household members upload receipts" on storage.objects for insert to authenticated
with check(bucket_id='receipts' and exists (
  select 1 from public.bills b join public.household_memberships m on m.household_id=b.household_id
  where m.user_id=auth.uid() and b.household_id::text=(storage.foldername(name))[1] and b.id::text=(storage.foldername(name))[2]
));
drop policy if exists "Household members remove receipts" on storage.objects;
create policy "Household members remove receipts" on storage.objects for delete to authenticated
using(bucket_id='receipts' and exists (
  select 1 from public.household_memberships m where m.user_id=auth.uid() and m.household_id::text=(storage.foldername(name))[1]
));
