import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from 'react';
import { AppState, Text, View } from 'react-native';
import { checkAndCreateDueDateReminders } from './notifications';
import { supabase } from '../lib/supabase';
import type { Palette } from '../theme';
import { fetchHouseholdBills, getBillById, type DbBill } from './household';
import { useRealtimeBills } from './realtime';
import { scheduleAllDueReminders } from './push';

type BillData = { bills: DbBill[]; selected: DbBill | null; selectBill: (id: string) => void; loading: boolean; error: string; refresh: () => Promise<void> };
export const BillDataContext = createContext<BillData | null>(null);

export function BillDataProvider({ householdId, userId, c, children }: { householdId: string; userId: string; c: Palette; children: ReactNode }) {
  const [bills, setBills] = useState<DbBill[]>([]);
  const [selectedId, selectBill] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reminderError, setReminderError] = useState('');
  const [detail, setDetail] = useState<DbBill | null>(null);
  const generation = useRef(0);
  const refresh = useCallback(async () => {
    const request = ++generation.current;
    try {
      const next = await fetchHouseholdBills(householdId);
      if (request === generation.current) { setBills(next); setError(''); }
    } catch (reason) {
      if (request === generation.current) setError(reason instanceof Error ? reason.message : 'Could not load household records.');
    } finally { if (request === generation.current) setLoading(false); }
  }, [householdId]);
  useEffect(() => {
    setBills([]); selectBill(''); setLoading(true); void refresh();
    return () => { generation.current++; };
  }, [refresh]);
  useEffect(() => {
    const listener = AppState.addEventListener('change', state => { if (state === 'active') void refresh(); });
    return () => listener.remove();
  }, [refresh]);
  useRealtimeBills(householdId, { onInsert: () => void refresh(), onUpdate: () => void refresh(), onDelete: () => void refresh() });
  useEffect(() => {
    let active = true;
    setDetail(null);
    if (selectedId && householdId && !loading && !bills.some(b => b.id === selectedId)) {
      void getBillById(selectedId, householdId).then(bill => { if (active) setDetail(bill); }).catch(reason => { if (active) setError(reason.message); });
    }
    return () => { active = false; };
  }, [selectedId, householdId, loading, bills]);
  useEffect(() => {
    let active = true;
    if (userId && householdId && !loading) void Promise.allSettled([scheduleAllDueReminders(householdId, userId), checkAndCreateDueDateReminders(userId, householdId)]).then(results => {
      if (!active) return;
      const failure = results.find(result => result.status === 'rejected');
      setReminderError(failure ? 'Your bills are saved, but reminders could not sync. Reopen the app or check notification settings.' : '');
    });
    return () => { active = false; };
  }, [bills, householdId, userId, loading]);
  return <BillDataContext.Provider value={{ bills, selected: bills.find(b => b.id === selectedId) ?? (detail?.id === selectedId ? detail : null), selectBill, loading, error, refresh }}>
    {error ? <View style={{ padding: 12, backgroundColor: c.dangerSoft }}><Text accessibilityRole="alert" style={{ color: c.danger }}>{error}</Text><Text accessibilityRole="button" onPress={() => void refresh()} style={{ color: c.primary, paddingTop: 8 }}>Try again</Text></View> : null}
    {reminderError && !error ? <View style={{ padding: 10, backgroundColor: c.warningSoft }}><Text accessibilityRole="alert" style={{ color: c.warning, fontSize: 12 }}>{reminderError}</Text></View> : null}
    {children}
  </BillDataContext.Provider>;
}

export function useBills() {
  const value = useContext(BillDataContext);
  if (!value) throw new Error('BillDataProvider is required');
  return value;
}
