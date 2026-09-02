# Bayarin Supabase setup

1. Create or select a Supabase project.
2. Run `supabase/migrations/202609030001_bayarin_auth.sql` in the Supabase SQL editor.
3. In Authentication → URL Configuration, set the Site URL to:
   `https://bayarin-household-organizer.gunz123.chatgpt.site`
4. Add these redirect URLs:
   - `https://bayarin-household-organizer.gunz123.chatgpt.site/**`
   - `http://localhost:3000/**`
5. Configure the app with the project URL and publishable key:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`

Never expose a Supabase secret key or legacy `service_role` key in this client application.
