import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { supabase } from '../lib/supabase';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function registerForPushNotifications(userId: string): Promise<void> {
  if (!supabase || !userId) return;
  if (!Device.isDevice) return;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;
  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }
  if (finalStatus !== 'granted') return;

  const token = (await Notifications.getExpoPushTokenAsync()).data;
  if (!token) return;

  await supabase.from('profiles').update({ push_token: token }).eq('id', userId);
}

export async function scheduleLocalReminder(
  title: string,
  body: string,
  triggerDate: Date,
): Promise<string | null> {
  try {
    const id = await Notifications.scheduleNotificationAsync({
      content: { title, body, sound: 'default' },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: triggerDate },
    });
    return id;
  } catch {
    return null;
  }
}

export async function cancelLocalReminder(identifier: string): Promise<void> {
  await Notifications.cancelScheduledNotificationAsync(identifier);
}

export async function scheduleAllDueReminders(householdId: string): Promise<void> {
  if (!supabase || !householdId) return;
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

  const { data: bills } = await supabase
    .from('bills')
    .select('id, provider, amount, due_date, reminder_days, status')
    .eq('household_id', householdId)
    .not('status', 'in', '(paid,archived,draft)');

  if (!bills?.length) return;

  const reminderAt = new Date(today);
  reminderAt.setHours(9, 0, 0, 0);

  for (const bill of bills) {
    const dueDateStr = bill.due_date;
    const dueDate = dueDateStr ? new Date(`${dueDateStr}T00:00:00`) : new Date();
    const diffDays = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    const reminderDays = bill.reminder_days || 5;

    if (diffDays <= reminderDays && diffDays >= 0) {
      const provider = String(bill.provider).toUpperCase();
      const amount = new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(bill.amount));
      const dueStr = new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric' }).format(dueDate);
      void scheduleLocalReminder(
        `${provider} is due in ${diffDays === 0 ? 'today' : `${diffDays} day${diffDays > 1 ? 's' : ''}`}`,
        `${amount} due ${dueStr}`,
        reminderAt,
      );
    }
  }
}

export async function cancelAllLocalReminders(): Promise<void> {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
