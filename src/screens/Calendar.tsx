import { CalendarDays, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { AppHeader, Card, CinematicHero, ProviderMark, ScreenScroll, StatusPill } from '../components/ui';
import type { Copy } from '../i18n';
import { fetchHouseholdBills, formatBillDisplay, type DbBill } from '../services/household';
import { useRealtimeBills } from '../services/realtime';
import type { Palette } from '../theme';
import type { Screen } from '../types';

const week = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const monthFormat = new Intl.DateTimeFormat('en-PH', { month: 'long', year: 'numeric' });
const dayKey = (date: Date) => `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

export function CalendarScreen({ go, t, c, householdId }: { go: (screen: Screen) => void; t: Copy; c: Palette; householdId: string }) {
  const [month, setMonth] = useState(() => new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const [bills, setBills] = useState<DbBill[]>([]);
  const load = useCallback(async () => setBills(await fetchHouseholdBills(householdId)), [householdId]);
  useEffect(() => { void load(); }, [load]);
  useRealtimeBills(householdId, { onInsert: () => void load(), onUpdate: () => void load() });
  const billsByDate = useMemo(() => bills.reduce<Record<string, DbBill[]>>((all, bill) => {
    (all[bill.due_date] ||= []).push(bill); return all;
  }, {}), [bills]);
  const currentMonthBills = useMemo(() => bills.filter((bill) => {
    const d = new Date(`${bill.due_date}T00:00:00`); return d.getFullYear() === month.getFullYear() && d.getMonth() === month.getMonth();
  }), [bills, month]);
  const start = new Date(month.getFullYear(), month.getMonth(), 1).getDay();
  const count = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate();
  const cells = Array.from({ length: Math.ceil((start + count) / 7) * 7 }, (_, index) => index - start + 1);
  const today = dayKey(new Date());

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <AppHeader title="Bill calendar" onBack={() => go('home')} c={c} />
      <ScreenScroll>
        <CinematicHero pose="calendar" height={160} c={c} title="Stay ahead of due dates" subtitle="Every household bill appears on its due date." />
        <Card c={c} style={{ padding: 14, marginTop: 14 }}>
          <View style={styles.monthBar}>
            <Pressable onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))} style={[styles.arrow, { backgroundColor: c.surface2 }]}><ChevronLeft size={18} color={c.text} /></Pressable>
            <Text style={{ color: c.text, fontSize: 16, fontWeight: '800' }}>{monthFormat.format(month)}</Text>
            <Pressable onPress={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))} style={[styles.arrow, { backgroundColor: c.surface2 }]}><ChevronRight size={18} color={c.text} /></Pressable>
          </View>
          <View style={styles.grid}>{week.map((name) => <Text key={name} style={{ width: '14.285%', color: c.textMuted, textAlign: 'center', fontSize: 10, fontWeight: '800' }}>{name}</Text>)}</View>
          <View style={styles.grid}>{cells.map((day, index) => {
            if (day < 1 || day > count) return <View key={`empty-${index}`} style={styles.day} />;
            const key = dayKey(new Date(month.getFullYear(), month.getMonth(), day)); const due = billsByDate[key] || []; const isToday = key === today;
            return <View key={key} style={[styles.day, isToday && { backgroundColor: c.primarySoft, borderRadius: 12 }]}><Text style={{ color: isToday ? c.primary : c.text, fontWeight: isToday ? '900' : '600', fontSize: 12 }}>{day}</Text>{due.slice(0, 2).map((bill) => <View key={bill.id} style={[styles.dot, { backgroundColor: bill.status === 'paid' ? c.success : c.primary }]} />)}</View>;
          })}</View>
        </Card>
        <View style={styles.heading}><CalendarDays size={16} color={c.primary} /><Text style={{ color: c.text, fontWeight: '800', fontSize: 16 }}>Due this month</Text></View>
        {currentMonthBills.length ? currentMonthBills.map((bill) => {
          const display = formatBillDisplay(bill);
          return <Card key={bill.id} c={c} onPress={() => go('bill-detail')} style={styles.bill}>
            <ProviderMark tone={display.tone} letter={display.provider[0]} />
            <View style={{ flex: 1 }}><Text style={{ color: c.text, fontWeight: '800' }}>{display.provider}</Text><Text style={{ color: c.textMuted, fontSize: 12, marginTop: 2 }}>Due {display.dueDateShort} · {display.amount}</Text></View>
            <StatusPill status={display.status} c={c} />
          </Card>;
        }) : <View style={[styles.empty, { backgroundColor: c.surface, borderColor: c.border }]}><CalendarDays size={24} color={c.primary} /><Text style={{ color: c.text, fontWeight: '800', marginTop: 8 }}>No due dates this month</Text><Text style={{ color: c.textMuted, textAlign: 'center', fontSize: 12, marginTop: 3 }}>Add a household bill and its due date will appear here.</Text></View>}
      </ScreenScroll>
    </View>
  );
}

const styles = StyleSheet.create({
  intro: { padding: 15, borderRadius: 20 },
  monthBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 },
  arrow: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginBottom: 7 },
  day: { width: '14.285%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center', gap: 2 },
  dot: { width: 5, height: 5, borderRadius: 3 },
  heading: { flexDirection: 'row', alignItems: 'center', gap: 7, marginTop: 22, marginBottom: 9 },
  bill: { padding: 13, marginBottom: 9, flexDirection: 'row', alignItems: 'center', gap: 10 },
  empty: { borderWidth: 1, padding: 22, borderRadius: 18, alignItems: 'center' },
});
