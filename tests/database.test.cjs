const { test } = require('node:test');
const assert = require('node:assert/strict');
const { PGlite } = require('@electric-sql/pglite');
const fs = require('node:fs');
const path = require('node:path');

test('full migration chain: RLS, exact bill payment, activity, recurrence and reminder preferences', async () => {
  const db = new PGlite();
  try {
    await db.exec(`create role anon; create role authenticated; create schema auth;
      create table auth.users(id uuid primary key, raw_user_meta_data jsonb default '{}');
      create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
      grant usage on schema public, auth to authenticated; grant execute on function auth.uid() to authenticated;
      create schema storage;
      create table storage.buckets(id text primary key,name text,public boolean,file_size_limit bigint,allowed_mime_types text[]);
      create table storage.objects(id uuid primary key default gen_random_uuid(),bucket_id text,name text);
      alter table storage.objects enable row level security;
      grant usage on schema storage to authenticated;
      grant select,insert,delete on storage.objects to authenticated;
      create function storage.foldername(text) returns text[] language sql immutable as $$ select string_to_array($1,'/') $$;`);
    for (const filename of fs.readdirSync(path.join(__dirname, '../supabase/migrations')).sort()) {
      const sql = fs.readFileSync(path.join(__dirname, '../supabase/migrations', filename), 'utf8').replace(/^alter publication .*;\r?$/gm, '');
      await db.exec(sql);
    }
    const admin = '11111111-1111-4111-8111-111111111111';
    const member = '22222222-2222-4222-8222-222222222222';
    const outsider = '33333333-3333-4333-8333-333333333333';
    await db.query(`insert into auth.users(id,raw_user_meta_data) values ($1,'{"full_name":"Test Admin"}'),($2,'{"full_name":"Test Member"}'),($3,'{}')`, [admin, member, outsider]);
    const asUser = async id => { await db.exec('reset role'); await db.query(`select set_config('request.jwt.claim.sub', $1, false)`, [id]); await db.exec('set role authenticated'); };
    await asUser(admin);
    const household = (await db.query(`select * from public.create_household('Workflow test')`)).rows[0];
    await asUser(member); await db.query(`select * from public.join_household($1)`, [household.join_id]);
    await asUser(admin);
    const add = async (provider, due, recurrence = 'monthly') => (await db.query(`insert into bills(user_id,household_id,provider,category,amount,due_date,recurrence,reminder_days) values ($1,$2,$3,'Electricity',299,$4,$5,5) returning *`, [admin,household.id,provider,due,recurrence])).rows[0];
    const first = await add('First provider','2026-01-31');
    const second = await add('Second provider','2026-02-28');
    const receiptName = `${household.id}/${second.id}/test.pdf`;
    await db.query(`insert into storage.objects(bucket_id,name) values('receipts',$1)`,[receiptName]);
    await asUser(member);
    await db.query(`update bills set status='paid', paid_by='Test Member', payment_method='Cash', paid_at=now() where id=$1 and household_id=$2 and status not in ('paid','archived')`, [second.id,household.id]);
    assert.equal((await db.query('select status from bills where id=$1',[first.id])).rows[0].status, 'upcoming');
    assert.equal((await db.query('select status from bills where id=$1',[second.id])).rows[0].status, 'paid');
    const next = (await db.query('select due_date::text, provider from bills where previous_bill_id=$1',[second.id])).rows;
    assert.equal(next.length, 1); assert.equal(next[0].due_date, '2026-03-28'); assert.equal(next[0].provider, 'Second provider');
    assert.equal((await db.query(`select * from activity_events where bill_id=$1 and event_type='bill_marked_paid'`,[second.id])).rows.length, 1);
    assert.equal((await db.query(`select * from notifications where bill_id=$1 and type='payment_update'`,[second.id])).rows.length, 1);
    assert.equal((await db.query(`update bills set status='paid' where id=$1 and status not in ('paid','archived') returning id`,[second.id])).rows.length, 0);
    await assert.rejects(db.query(`update profiles set household_id=null where id=$1`,[member]), /permission denied/);
    await asUser(outsider);
    assert.equal((await db.query('select * from bills')).rows.length, 0);
    assert.equal((await db.query('select * from notifications')).rows.length, 0);
    assert.equal((await db.query('select * from storage.objects')).rows.length, 0);
    await assert.rejects(db.query(`insert into storage.objects(bucket_id,name) values('receipts',$1)`,[receiptName]), /row-level security/);
    assert.equal((await db.query('update bills set amount=1 where id=$1 returning id',[first.id])).rows.length, 0);
    await assert.rejects(db.query('select sync_due_reminders($1)',[household.id]), /membership required/);
    await asUser(admin);
    const today = (await db.query(`select (now() at time zone 'Asia/Manila')::date::text as day`)).rows[0].day;
    const due = await add('Due today',today,'once');
    await db.query('select sync_due_reminders($1)',[household.id]); await db.query('select sync_due_reminders($1)',[household.id]);
    assert.equal((await db.query(`select * from notifications where bill_id=$1 and type='due_reminder'`,[due.id])).rows.length,1);
    await db.query('insert into notification_preferences(user_id,due_soon) values ($1,false) on conflict(user_id) do update set due_soon=false',[admin]);
    await db.query("update bills set status='paid' where id=$1",[first.id]);
    assert.equal((await db.query('select due_date::text from bills where previous_bill_id=$1',[first.id])).rows[0].due_date,'2026-02-28');
    const leap = await add('Yearly leap date','2028-02-29','yearly');
    await db.query("update bills set status='paid' where id=$1",[leap.id]);
    assert.equal((await db.query('select due_date::text from bills where previous_bill_id=$1',[leap.id])).rows[0].due_date,'2029-02-28');
    const muted = await add('Muted reminder',today,'once');
    await db.query('select sync_due_reminders($1)',[household.id]);
    assert.equal((await db.query(`select * from notifications where bill_id=$1 and type='due_reminder'`,[muted.id])).rows.length,0);
    // A dashboard deployment can be retried without deleting records or duplicating recurrence.
    await db.exec('reset role');
    const countBefore = (await db.query('select count(*)::int as count from bills')).rows[0].count;
    await db.exec(fs.readFileSync(path.join(__dirname, '../supabase/deploy-integrations.sql'), 'utf8'));
    assert.equal((await db.query('select count(*)::int as count from bills')).rows[0].count, countBefore);
    assert.equal((await db.query('select count(*)::int as count from bills where previous_bill_id=$1',[second.id])).rows[0].count, 1);
  } finally { await db.close(); }
});
