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
  if (error || !data) return [];
  return data as AppNotification[];
}

export async function markNotificationRead(notificationId: string): Promise<void> {
  if (!supabase) return;
  await supabase.from('notifications').update({ read: true }).eq('id', notificationId);
}

export async function markAllNotificationsRead(userId: string): Promise<void> {
  if (!supabase) return;
  await supabase.from('notifications').update({ read: true }).eq('user_id', userId).eq('read', false);
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
  if (!supabase || !householdId) return;

  const { data: bills } = await supabase
    .from('bills')
    .select('id, provider, amount, due_date, reminder_days, status')
    .eq('household_id', householdId)
    .not('status', 'in', '(paid,archived,draft)');

  if (!bills?.length) return;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  for (const bill of bills) {
    const dueDateStr = bill.due_date;
    const dueDate = dueDateStr ? new Date(`${dueDateStr}T00:00:00`) : new Date();
    const diffMs = dueDate.getTime() - today.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    const reminderDays = bill.reminder_days || 5;

    if (diffDays <= reminderDays && diffDays >= 0) {
      const { data: existing } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('bill_id', bill.id)
        .eq('type', 'due_reminder')
        .limit(1)
        .maybeSingle();

      if (!existing) {
        const providerName = String(bill.provider).toUpperCase();
        const amount = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(bill.amount));
        const dateStr = new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric' }).format(dueDate);

        let title: string;
        let body: string;

        if (diffDays === 0) {
          title = `${providerName} is due today`;
          body = `${amount} is due today. Pay now to avoid late fees.`;
        } else if (diffDays === 1) {
          title = `${providerName} is due tomorrow`;
          body = `${amount} is due tomorrow, ${dateStr}.`;
        } else {
          title = `${providerName} is due in ${diffDays} days`;
          body = `${amount} is due on ${dateStr}. You have ${diffDays} days left.`;
        }

        await createNotification(userId, title, body, 'due_reminder', bill.id);
      }
    }
  }
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
