import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { supabase } from '../lib/supabase';
import { localDateKey } from './bill-rules';

Notifications.setNotificationHandler({
  handleNotification: async () => ({ shouldShowBanner: true, shouldShowList: true, shouldPlaySound: true, shouldSetBadge: false }),
});

export async function registerForPushNotifications(_userId: string): Promise<void> {
  if (Platform.OS === 'android') await Notifications.setNotificationChannelAsync('bill-reminders', { name: 'Bill reminders', importance: Notifications.AndroidImportance.DEFAULT });
  const permission = await Notifications.requestPermissionsAsync();
  if (permission.status !== 'granted') throw new Error('Device notifications are off. Enable them in your device settings to receive reminders.');
}

let scheduling = Promise.resolve();
export function scheduleAllDueReminders(householdId: string, userId?: string): Promise<void> {
  const run = async () => {
    if (!supabase || !householdId) return;
    if ((await Notifications.getPermissionsAsync()).status !== 'granted') return;
    const { data: bills, error } = await supabase.from('bills').select('*').eq('household_id', householdId).not('status', 'in', '(paid,archived,draft)').order('due_date');
    if (error) throw new Error(error.message);
    const { data: prefs, error: prefError } = userId ? await supabase.from('notification_preferences').select('*').eq('user_id', userId).maybeSingle() : { data: null, error: null };
    if (prefError) throw new Error(prefError.message);
    // Preserve unchanged schedules and remember delivered reminders across launches.
    const existing = await Notifications.getAllScheduledNotificationsAsync();
    const desired = new Set<string>();
    const now = new Date();
    const today = localDateKey(now);
    for (const bill of (prefs?.due_soon === false ? [] : bills || []).filter(b => b.reminder_days > 0 && b.due_date >= today && (!b.category.toLowerCase().includes('load') || prefs?.load_reminders !== false) && (b.category !== 'Government' || prefs?.government_deadlines !== false)).slice(0, 50)) {
      const identifier = `bayarin-${userId}-${bill.id}-${bill.due_date}-${bill.reminder_days}-${bill.amount}`;
      desired.add(identifier);
      if (existing.some(item => item.identifier === identifier)) continue;
      const trigger = new Date(`${bill.due_date}T09:00:00`);
      trigger.setDate(trigger.getDate() - bill.reminder_days);
      if (trigger <= now) {
        if (await AsyncStorage.getItem(identifier)) continue;
        trigger.setTime(now.getTime() + 60000);
      }
      await Notifications.scheduleNotificationAsync({
        identifier,
        content: { title: `${bill.provider} · upcoming bill`, body: `₱${Number(bill.amount).toLocaleString('en-PH')} due ${bill.due_date}`, data: { bayarin: true, bill_id: bill.id, household_id: householdId } },
        trigger: { type: Notifications.SchedulableTriggerInputTypes.DATE, date: trigger, channelId: 'bill-reminders' },
      });
      await AsyncStorage.setItem(identifier, 'scheduled');
    }
    for (const item of existing) if (item.content.data?.bayarin && !desired.has(item.identifier)) await Notifications.cancelScheduledNotificationAsync(item.identifier);
  };
  scheduling = scheduling.catch(() => {}).then(run);
  return scheduling;
}

export async function cancelAllLocalReminders(): Promise<void> {
  await scheduling.catch(() => {});
  for (const item of await Notifications.getAllScheduledNotificationsAsync()) if (item.content.data?.bayarin) await Notifications.cancelScheduledNotificationAsync(item.identifier);
}
