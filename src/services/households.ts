import { supabase } from '../lib/supabase';

export type Household = {
  id: string;
  name: string;
  join_id: string;
  role: 'admin' | 'member';
};

export type HouseholdUser = {
  user_id: string;
  role: 'admin' | 'member';
  joined_at: string;
  profile: { full_name: string } | null;
};

export async function fetchCurrentHousehold(userId: string): Promise<Household | null> {
  if (!supabase || !userId) return null;
  const { data, error } = await supabase
    .from('household_memberships')
    .select('role, household:households(id,name,join_id)')
    .eq('user_id', userId)
    .maybeSingle();
  if (error) throw new Error(error.message);
  if (!data || !data.household) return null;
  const household = data.household as unknown as { id: string; name: string; join_id: string };
  return { ...household, role: data.role as Household['role'] };
}

export async function createHousehold(name: string): Promise<Household> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.rpc('create_household', { household_name: name.trim() }).single();
  if (error || !data) throw error || new Error('Could not create the household.');
  return data as Household;
}

export async function joinHousehold(lookup: string): Promise<Household> {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data, error } = await supabase.rpc('join_household', { lookup: lookup.trim() }).single();
  if (error || !data) throw error || new Error('Could not join the household.');
  return data as Household;
}

export async function fetchHouseholdUsers(householdId: string): Promise<HouseholdUser[]> {
  if (!supabase || !householdId) return [];
  const { data, error } = await supabase
    .from('household_memberships')
    .select('user_id,role,joined_at')
    .eq('household_id', householdId)
    .order('role', { ascending: true })
    .order('joined_at');
  if (error) throw new Error(error.message);
  if (!data) return [];
  const members = data as Array<Omit<HouseholdUser, 'profile'>>;
  if (!members.length) return [];
  const { data: profiles, error: profileError } = await supabase
    .from('profiles')
    .select('id,full_name')
    .in('id', members.map((member) => member.user_id));
  if (profileError) throw new Error(profileError.message);
  const names = new Map((profiles || []).map((profile) => [profile.id, profile.full_name]));
  return members.map((member) => ({ ...member, profile: names.has(member.user_id) ? { full_name: names.get(member.user_id) || '' } : null }));
}

export async function removeHouseholdUser(userId: string) {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { error } = await supabase.rpc('remove_household_member', { target_user_id: userId });
  if (error) throw error;
}
