import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey =
  process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

export const isSupabaseConfigured = Boolean(supabaseUrl && supabaseKey);

export const supabase: SupabaseClient | null = isSupabaseConfigured
  ? createClient(supabaseUrl!, supabaseKey!, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
        flowType: 'pkce',
      },
    })
  : null;

export function readableAuthError(error: unknown) {
  const message = error instanceof Error ? error.message : 'Something went wrong. Please try again.';
  const normalized = message.toLowerCase();

  if (normalized.includes('invalid login credentials')) {
    return 'Incorrect email or password. Please try again.';
  }
  if (normalized.includes('email not confirmed')) {
    return 'Please confirm your email before logging in.';
  }
  if (normalized.includes('user already registered')) {
    return 'An account already exists for this email.';
  }
  if (normalized.includes('password')) {
    return message;
  }
  return message;
}

export const supabaseSetupMessage =
  'Supabase is not connected yet. Add the project URL and publishable key to continue.';
