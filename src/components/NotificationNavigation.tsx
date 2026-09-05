import { useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { useBills } from '../services/bill-context';
import type { Screen } from '../types';

export function NotificationNavigation({ householdId, go }: { householdId: string; go: (screen: Screen) => void }) {
  const { selectBill, refresh } = useBills();
  const navigate = useRef(go);
  navigate.current = go;
  useEffect(() => {
    if (Platform.OS === 'web' || !householdId) return;
    let active = true;
    const open = (response: Notifications.NotificationResponse | null) => {
      const data = response?.notification.request.content.data;
      if (!active || !data?.bayarin || data.household_id !== householdId || typeof data.bill_id !== 'string') return;
      selectBill(data.bill_id);
      navigate.current('bill-detail');
      void refresh();
      void Notifications.clearLastNotificationResponseAsync().catch(() => {});
    };
    void Notifications.getLastNotificationResponseAsync().then(open).catch(() => {});
    const listener = Notifications.addNotificationResponseReceivedListener(open);
    return () => { active = false; listener.remove(); };
  }, [householdId, selectBill, refresh]);
  return null;
}
