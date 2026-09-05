// Read-only deployment check. Never prints keys or household records.
const url = process.env.EXPO_PUBLIC_SUPABASE_URL;
const key = process.env.EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
async function main() {
  if (!url || !key) throw new Error('Supabase environment is missing.');
  const headers = { apikey: key, 'Content-Type': 'application/json' };
  const health = await fetch(`${url}/auth/v1/health`, { headers });
  console.log(`Supabase Auth reachable: ${health.ok}`);
  const schema = await fetch(`${url}/rest/v1/bills?select=previous_bill_id&limit=0`, { headers });
  const payload = await schema.json();
  console.log(`Recurring bill schema: ${schema.ok ? 'available' : payload.code === '42703' || payload.code === 'PGRST204' ? 'migration required' : 'restricted (' + schema.status + ')'}`);
  let ready = health.ok && schema.ok;
  for (const [table, columns] of [['profiles', 'selected_services'], ['notification_preferences', 'load_reminders'], ['bills', 'receipt_path']]) {
    const response = await fetch(`${url}/rest/v1/${table}?select=${columns}&limit=0`, { headers });
    const body = await response.json();
    console.log(`${table}.${columns}: ${response.ok ? 'available' : ['42703','PGRST204'].includes(body.code) ? 'migration required' : 'restricted (' + response.status + ')'}`);
    ready = ready && response.ok;
  }
  const rpc = await fetch(`${url}/rest/v1/rpc/sync_due_reminders`, { method: 'POST', headers, body: JSON.stringify({ target_household_id: '00000000-0000-0000-0000-000000000000' }) });
  const result = await rpc.json();
  console.log(`Reminder RPC: ${result.code === 'PGRST202' ? 'migration required' : rpc.ok ? 'available' : 'access protected (' + rpc.status + ')'}`);
  if (!ready || result.code === 'PGRST202') process.exitCode = 2;
}
main().catch(error => { console.error(error.message); process.exitCode = 1; });
