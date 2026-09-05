import { supabase } from '../lib/supabase';

export type AppNotification = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  bill_id: string | null;
  read: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
};

export async function fetchNotifications(userId: string): Promise<AppNotification[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from('notifications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw new Error(error.message);
  if (!data) return [];
  return data as AppNotification[];
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('notifications').update({ read: true }).eq('id', notificationId);
  if (error) throw new Error(error.message);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  if (!supabase) return;
  const { error } = await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false);
  if (error) throw new Error(error.message);
}

export async function createNotification(
  userId: string,
  title: string,
  body: string,
  type: string = 'general',
  billId?: string,
  metadata: Record<string, unknown> = {},
): Promise<void> {
  if (!supabase) return;
  await supabase.from('notifications').insert({
    user_id: userId,
    title,
    body,
    type,
    bill_id: billId || null,
    metadata,
  });
}

export async function checkAndCreateDueDateReminders(userId: string, householdId: string): Promise<void> {
  if (!supabase || !householdId || !userId) return;
  const { error } = await supabase.rpc('sync_due_reminders', { target_household_id: householdId });
  if (error) throw new Error(error.message);
}

export function getUnreadCount(notifications: AppNotification[]): number {
  return notifications.filter((n) => !n.read).length;
}

export function groupNotificationsByDate(notifications: AppNotification[]): { label: string; items: AppNotification[] }[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  const groups: Record<string, AppNotification[]> = {};

  for (const n of notifications) {
    const date = new Date(n.created_at);
    date.setHours(0, 0, 0, 0);

    let label: string;
    if (date.getTime() === today.getTime()) {
      label = 'Today';
    } else if (date.getTime() === yesterday.getTime()) {
      label = 'Yesterday';
    } else {
      label = new Intl.DateTimeFormat('en-PH', { month: 'long', year: 'numeric' }).format(date);
    }

    if (!groups[label]) groups[label] = [];
    groups[label].push(n);
  }

  return Object.entries(groups).map(([label, items]) => ({ label, items }));
}
