import { validDate, validAmount } from '../services/bill-rules';
import { openPaymentDestination } from '../services/external';
import { DataState } from '../components/ui';
import { useBills } from '../services/bill-context';
import {
  Bell, Check, CheckCircle2, ChevronRight, Clock3, Landmark, Pencil,
  Plus, ShieldCheck, Smartphone, WifiOff, AlertTriangle, RefreshCw,
} from 'lucide-react-native';
import { useEffect, useState, type ReactNode } from 'react';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { AppHeader, BottomNav, Card, CinematicHero, Field, InfoBanner, PrimaryButton, ProviderMark, ScreenScroll, SecondaryButton, StatusPill } from '../components/ui';
import { governmentServices, loads, type GovernmentService } from '../data';
import type { Copy } from '../i18n';
import { supabase } from '../lib/supabase';
import { useRealtimeActivity, useRealtimeBills, useRealtimeNotifications } from '../services/realtime';
import { createBillActivityEvent, fetchHouseholdActivityEvents, fetchHouseholdBills, formatBillDisplay, markBillPaid, type DbActivityEvent, type DbBill } from '../services/household';
import { fetchNotifications, markNotificationRead, markAllNotificationsRead, groupNotificationsByDate, type AppNotification } from '../services/notifications';

import { type Palette } from '../theme';
import type { Screen } from '../types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function PressRow({ onPress, style, children }: { onPress?: () => void; style?: object; children: ReactNode }) {
  const s = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <AnimatedPressable
      onPressIn={() => { s.value = withSpring(0.975, { damping: 16, stiffness: 320 }); }}
      onPressOut={() => { s.value = withSpring(1, { damping: 12, stiffness: 260 }); }}
      onPress={onPress}
      style={[anim, style]}
    >
      {children}
    </AnimatedPressable>
  );
}

export function ActivityScreen({ go, t, c, householdId = '' }: { go: (s: Screen) => void; t: Copy; c: Palette; householdId?: string }) {
  const { selectBill } = useBills();
  const [filter, setFilter] = useState('All');
  const [activityError, setActivityError] = useState('');
  const [events, setEvents] = useState<DbActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase || !householdId) { setLoading(false); return; }
    void fetchHouseholdActivityEvents(householdId).then((data) => { setEvents(data); setLoading(false); }).catch(e => { setActivityError(e.message); setLoading(false); });
  }, [householdId]);

  useRealtimeActivity(householdId, {
    onInsert: (event) => setEvents((current) => [event as DbActivityEvent, ...current.filter(item => item.id !== event.id)]),
  });

  const items = events.length > 0 ? events.map((evt) => {
    const tone = String(evt.title).toLowerCase().includes('meralco') ? 'orange' : String(evt.title).toLowerCase().includes('maynilad') ? 'blue' : String(evt.title).toLowerCase().includes('pldt') ? 'red' : 'indigo';
    const letter = (String(evt.title).match(/[A-Z]/)?.[0] || 'M');
    const amount = evt.amount != null ? new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(evt.amount)) : '—';
    const eventType = String(evt.event_type).replace(/_/g, ' ');
    const time = new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(evt.created_at));
    const category = evt.metadata?.category === 'Government' ? 'Lingkod' : String(evt.metadata?.category).toLowerCase().includes('load') ? 'Load' : 'Bills';
    return [letter, tone, String(evt.title), eventType, time, amount, String(evt.event_type).includes('paid') ? 'Paid' : String(evt.event_type).includes('added') ? 'Added' : 'Updated', category, evt.bill_id || '', evt.id];
  }) : [];

  const visible = filter === 'All' ? items : items.filter((item) => item[7] === filter);
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <AppHeader title={t.activity.title} onBack={() => go('home')} c={c} />
      <ScreenScroll withNav>
        <View style={{ flexDirection: 'row', gap: 7, marginBottom: 12 }}>
          {['All', 'Bills', 'Load', 'Lingkod'].map((item) => (
            <Pressable key={item} onPress={() => setFilter(item)} style={[styles.chip, { backgroundColor: filter === item ? c.primary : c.surface, borderColor: filter === item ? c.primary : c.border }]}>
              <Text style={{ color: filter === item ? c.onPrimary : c.text, fontWeight: '700', fontSize: 12 }}>{item}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={{ color: c.textMuted, fontSize: 12, marginBottom: 8 }}>{new Intl.DateTimeFormat('en-PH', { month: 'long', year: 'numeric' }).format(new Date())}</Text>
        <View style={{ gap: 8 }}>
          {activityError ? <InfoBanner c={c} tone="danger">{activityError}</InfoBanner> : loading ? <DataState c={c} loading title="Loading activity" /> : visible.length ? visible.map((i) => (
            <Pressable accessibilityRole="button" disabled={!i[8]} key={i[9]} onPress={() => { selectBill(i[8]); go('bill-detail'); }} style={[styles.actRow, { backgroundColor: c.surface, borderColor: c.border }]}>
              <ProviderMark tone={i[1]} letter={i[0]} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.text, fontWeight: '600' }}>{i[2]}</Text>
                <Text style={{ color: c.textMuted, fontSize: 12 }}>{i[3]}</Text>
                <Text style={{ color: c.textMuted, fontSize: 11 }}>{i[4]}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text style={{ color: c.text, fontWeight: '600' }}>{i[5]}</Text>
                <StatusPill status={i[6]} c={c} />
              </View>
            </Pressable>
          )) : (
            <View style={{ padding: 28, alignItems: 'center' }}>
              <CheckCircle2 size={28} color={c.primary} />
              <Text style={{ color: c.textMuted, marginTop: 8 }}>{t.activity.empty}</Text>
            </View>
          )}
        </View>
      <View style={{ marginTop: 16 }}><SecondaryButton title="View all activity" onPress={() => setFilter('All')} c={c} /></View></ScreenScroll>
      <BottomNav screen="activity" go={go} c={c} t={t} />
    </View>
  );
}

export function LoadScreen({ go, t, c }: { go: (s: Screen) => void; t: Copy; c: Palette }) {
  const { bills, selectBill, loading } = useBills();
  const items = bills.filter(b => b.category.toLowerCase().includes('load'));
  return <View style={{ flex: 1, backgroundColor: c.bg }}>
    <AppHeader title={t.load.title} onBack={() => go('home')} c={c} trailing={<Pressable accessibilityLabel="Add load reminder" onPress={() => go('add-bill')} style={[styles.accent, { backgroundColor: c.primary }]}><Plus size={18} color="#fff" /></Pressable>} />
    <ScreenScroll withNav><CinematicHero pose="services" height={180} c={c} title={t.load.stay} subtitle={t.load.stayBody} /><InfoBanner c={c}>{t.load.banner}</InfoBanner>
      {loading ? <DataState c={c} loading title="Loading reminders" /> : items.length ? items.map(bill => { const display = formatBillDisplay(bill); return <Card c={c} key={bill.id} onPress={() => { selectBill(bill.id); go('load-detail'); }} style={{ marginBottom: 12, gap: 10 }}><View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}><ProviderMark tone={display.tone} letter={display.provider.charAt(0)} /><View style={{ flex: 1 }}><Text style={{ color: c.text, fontWeight: '600' }}>{bill.alias || bill.provider}</Text><Text style={{ color: c.textMuted, marginTop: 4 }}>{bill.account_number}</Text></View><ChevronRight color={c.textMuted} size={18} /></View><View style={styles.between}><Text style={{ color: c.textMuted }}>{display.dueDateShort} · {display.amount}</Text><StatusPill c={c} status={display.status} /></View></Card>; }) : <DataState c={c} title="Keep the family connected" body="Add a number, choose a telco, and set the next load date." action={() => go('add-bill')} actionLabel="Add load reminder" />}
    </ScreenScroll><BottomNav screen="load" go={go} c={c} t={t} />
  </View>;
}

export function LoadDetail({ go, t, c }: { go: (s: Screen) => void; t: Copy; c: Palette }) {
  const { selected } = useBills();
  const [error, setError] = useState('');
  const display = selected ? formatBillDisplay(selected) : null;
  return <View style={{ flex: 1, backgroundColor: c.bg }}><AppHeader title={t.load.details} onBack={() => go('load')} c={c} /><ScreenScroll>
    {display && selected ? <><CinematicHero c={c} pose="services" height={180} title={selected.alias || selected.provider} subtitle={selected.account_number || 'Mobile load reminder'} /><Card c={c}><Line c={c} label={t.load.next} value={display.due} /><Line c={c} label={t.load.typical} value={display.amount} /><Line c={c} label={t.load.repeats} value={selected.recurrence} last /></Card><View style={{ gap: 12, marginTop: 20 }}>{error ? <InfoBanner c={c} tone="danger">{error}</InfoBanner> : null}<PrimaryButton title={t.load.openProvider} onPress={() => void openPaymentDestination('Provider', selected.provider).catch(e => setError(e.message))} c={c} /><SecondaryButton title="Review or record payment" onPress={() => go('bill-detail')} c={c} /><SecondaryButton title="Edit reminder" onPress={() => go('edit-bill')} c={c} /></View></> : <DataState c={c} title="Select a load reminder" action={() => go('load')} actionLabel="View reminders" />}
  </ScreenScroll></View>;
}

export function LingkodScreen({
  go, t, c, householdId, onSelectGovernment,
}: { go: (s: Screen) => void; t: Copy; c: Palette; householdId: string; onSelectGovernment: (government: GovernmentService) => void }) {
  const { bills } = useBills();
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <AppHeader title={t.lingkod.title} c={c} />
      <ScreenScroll withNav>
        <CinematicHero pose="government" height={168} c={c} title={t.lingkod.lead} subtitle={t.lingkod.leadBody} />
        <InfoBanner c={c}>{t.lingkod.banner}</InfoBanner>
        <Text style={{ color: c.text, fontSize: 17, fontWeight: '600', marginBottom: 10 }}>Government bills</Text>
        {governmentServices.map((government) => {
          const bill = bills.find((item) => item.provider === government.name);
          const display = bill ? formatBillDisplay(bill) : null;
          return <PressRow key={government.id} onPress={() => onSelectGovernment(government)} style={[styles.rowCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <View style={styles.govMark}><Text style={{ color: '#fff', fontWeight: '600' }}>{government.mark}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.text, fontWeight: '600', fontSize: 15 }}>{government.name}</Text>
              <Text style={{ color: c.textMuted, fontSize: 13, marginTop: 2 }}>{display ? `${display.dueDateShort} · ${display.amount}` : 'Add your household bill'}</Text>
            </View>
            {display ? <StatusPill status={display.status} c={c} /> : <Text style={{ color: c.primary, fontSize: 12, fontWeight: '600' }}>Add</Text>}
            <ChevronRight size={14} color={c.textMuted} />
          </PressRow>;
        })}
      </ScreenScroll>
      <BottomNav screen="lingkod" go={go} c={c} t={t} />
    </View>
  );
}

export function GovernmentDetail({
  go, t, c, userId, householdId, government,
}: { go: (s: Screen) => void; t: Copy; c: Palette; userId: string; householdId: string; government: GovernmentService }) {
  const { bills, refresh, selectBill } = useBills();
  const bill = bills.find(item => item.provider === government.name && item.status !== 'paid') || bills.find(item => item.provider === government.name) || null;
  const [account, setAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const addBill = async () => {
    if (!supabase || !householdId || !userId) return;
    if (!validAmount(amount) || !validDate(dueDate)) { setMessage('Enter a valid amount and due date (YYYY-MM-DD).'); return; }
    setSaving(true); setMessage('');
    const { data, error } = await supabase.from('bills').insert({
      user_id: userId, household_id: householdId, provider: government.name, category: 'Government', account_number: account.trim() || null,
      alias: government.name, amount: Number(amount), due_date: dueDate, recurrence: 'monthly', reminder_days: 5, status: 'upcoming',
    }).select('*').single();
    if (error || !data) { setMessage(error?.message || 'Could not add this government bill.'); setSaving(false); return; }
    await refresh(); setSaving(false);
  };
  const payBill = async () => { if (bill) { selectBill(bill.id); go('mark-paid'); } };
  const display = bill ? formatBillDisplay(bill) : null;
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <AppHeader title={government.name} onBack={() => go('lingkod')} c={c} />
      <ScreenScroll>
        <CinematicHero pose="government" height={142} c={c} title={government.name} subtitle={government.detail} />
        <View style={[styles.hero, { backgroundColor: c.surface }]}>
          <View style={[styles.govMark, { width: 46, height: 46, borderRadius: 15 }]}><Text style={{ color: '#fff', fontWeight: '600', fontSize: 18 }}>{government.mark}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.text, fontSize: 18, fontWeight: '600' }}>{government.name}</Text>
            <Text style={{ color: c.textMuted }}>{government.detail}</Text>
          </View>
          {display ? <StatusPill status={display.status} c={c} /> : null}
        </View>
        {message ? <InfoBanner c={c}>{message}</InfoBanner> : null}
        {display ? <>
          <Card c={c}>
            <Line c={c} label={t.lingkod.prepare} value={display.amount} large />
            <Line c={c} label={t.bills.due} value={display.due} />
            <Line c={c} label={t.lingkod.reference} value={bill?.account_number ? `•••• ${String(bill.account_number).slice(-4)}` : 'No account reference'} last />
          </Card>
          {display.status.toLowerCase() !== 'paid' ? <View style={{ marginTop: 14 }}><PrimaryButton title={saving ? 'Saving…' : 'Mark as paid'} loading={saving} onPress={() => void payBill()} c={c} icon={<Check size={16} color="#fff" />} /></View> : <InfoBanner c={c}>This government bill has been marked paid.</InfoBanner>}
        </> : <Card c={c} style={{ gap: 14 }}>
          <Text style={{ color: c.text, fontSize: 17, fontWeight: '600' }}>Add your bill</Text>
          <Text style={{ color: c.textMuted, fontSize: 13, lineHeight: 19 }}>Only your household’s own {government.name} bill is saved here.</Text>
          <Field c={c} label="Account or reference number" value={account} onChangeText={setAccount} placeholder="Optional" autoCapitalize="characters" />
          <Field c={c} label="Amount" value={amount} onChangeText={setAmount} placeholder="0.00" keyboardType="decimal-pad" />
          <Field c={c} label="Due date" value={dueDate} onChangeText={setDueDate} placeholder="YYYY-MM-DD" autoCapitalize="none" />
          <PrimaryButton title={saving ? 'Adding bill…' : 'Add government bill'} loading={saving} onPress={() => void addBill()} c={c} icon={<Check size={16} color="#fff" />} />
        </Card>}
        <View style={{ marginTop: 16 }}><SecondaryButton title="Open official website" c={c} onPress={() => void openPaymentDestination('Provider', government.name).catch(e => setMessage(e.message))} /></View>
        <View style={{ flexDirection: 'row', gap: 7, marginTop: 12 }}>
          <ShieldCheck size={13} color={c.primary} />
          <Text style={{ color: c.textMuted, fontSize: 12, flex: 1 }}>{t.lingkod.legal}</Text>
        </View>
      </ScreenScroll>
    </View>
  );
}

export function NotificationsScreen({ go, t, c, userId = '' }: { go: (s: Screen) => void; t: Copy; c: Palette; userId?: string }) {
  const { selectBill } = useBills();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(false);

  useEffect(() => {
    if (!supabase || !userId) { setLoading(false); return; }
    void fetchNotifications(userId).then((data) => {
      setNotifications(data);
      setUnread(data.some((n) => !n.read)); setLoading(false);
    }).catch(e => { setError(e.message); setLoading(false); });
  }, [userId]);

  useRealtimeNotifications(userId, {
    onInsert: (notification) => {
      setNotifications((current) => [notification as AppNotification, ...current]);
      if (!(notification as AppNotification).read) setUnread(true);
    },
    onUpdate: () => {
      void fetchNotifications(userId).then((data) => {
        setNotifications(data);
        setUnread(data.some((n) => !n.read));
      }).catch(e => setError(e.message));
    },
  });

  const markAll = async () => {
    try { await markAllNotificationsRead(userId); setNotifications(current => current.map(n => ({ ...n, read: true }))); setUnread(false); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not update notifications.'); }
  };
  const open = async (n: AppNotification) => {
    try {
      await markNotificationRead(n.id);
      setNotifications(current => current.map(item => item.id === n.id ? { ...item, read: true } : item));
      setUnread(notifications.some(x => x.id !== n.id && !x.read));
      if (n.bill_id) { selectBill(n.bill_id); go('bill-detail'); } else go('activity');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not open this notification.'); }
  };
  const groups = groupNotificationsByDate(notifications);

  const displayGroups = notifications.length > 0 ? groups : [];
  const displayUnread = unread;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <AppHeader title={t.notifications.title} onBack={() => go('home')} c={c} trailing={
        <Pressable onPress={markAll}><Text style={{ color: c.primary, fontWeight: '700', fontSize: 12 }}>{displayUnread ? t.notifications.markRead : t.notifications.allRead}</Text></Pressable>
      } />
      <ScreenScroll>
        <CinematicHero pose="calendar" height={136} c={c} title={t.notifications.title} subtitle="Your household reminders, all in one place." />
        {error ? <InfoBanner c={c} tone="danger">{error}</InfoBanner> : loading ? <DataState c={c} loading title="Loading reminders" /> : !displayGroups.length ? <DataState c={c} title="You’re all caught up" body="Bill reminders and household updates will appear here." /> : null}
        {displayGroups.map((group) => (
          <View key={group.label}>
            <Text style={[styles.group, { color: c.textMuted }]}>{group.label}</Text>
            {group.items.map((n) => {
              const isDue = n.type === 'due_reminder';
              const icon = isDue ? <Clock3 size={16} color={c.warning} /> : <Bell size={16} color={c.primary} />;
              const tone = isDue ? 'amber' : 'green';
              const time = new Intl.DateTimeFormat('en-PH', { hour: 'numeric', minute: '2-digit' }).format(new Date(n.created_at));
              return (
                <Note key={n.id} c={c} unread={!n.read} icon={icon} tone={tone} title={n.title} body={n.body} time={time} onPress={() => open(n)} />
              );
            })}
          </View>
        ))}
      </ScreenScroll>
    </View>
  );
}

export function StateScreen({ kind, go, t, c }: { kind: 'offline' | 'empty' | 'error'; go: (s: Screen) => void; t: Copy; c: Palette }) {
  const data = kind === 'offline'
    ? { icon: <WifiOff size={28} color={c.textMuted} />, title: t.states.offline, body: t.states.offlineBody, action: t.states.tryAgain }
    : kind === 'error'
      ? { icon: <AlertTriangle size={28} color={c.danger} />, title: t.states.error, body: t.states.errorBody, action: t.states.tryAgain }
      : { icon: <CheckCircle2 size={28} color={c.primary} />, title: t.empty.caught, body: t.empty.noneDue, action: t.empty.add };
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <AppHeader title={kind === 'offline' ? t.states.offline : t.bills.title} onBack={() => go('settings')} c={c} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 42, paddingBottom: 80 }}>
        <View style={[styles.stateIcon, { backgroundColor: kind === 'error' ? c.dangerSoft : kind === 'offline' ? c.surface2 : c.primarySoft }]}>{data.icon}</View>
        <Text style={{ color: c.text, fontSize: 22, fontWeight: '600', marginTop: 16 }}>{data.title}</Text>
        <Text style={{ color: c.textMuted, textAlign: 'center', marginVertical: 8 }}>{data.body}</Text>
        <View style={{ width: '100%' }}>
          <PrimaryButton title={data.action} onPress={() => go(kind === 'empty' ? 'add-bill' : kind === 'error' ? 'bill-detail' : 'home')} c={c} icon={kind === 'empty' ? <Plus size={16} color="#fff" /> : <RefreshCw size={16} color="#fff" />} />
        </View>
      </View>
    </View>
  );
}

function Lead({ c, icon, title, body, gov }: { c: Palette; icon: ReactNode; title: string; body: string; gov?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', paddingBottom: 14 }}>
      <View style={[styles.soft, { width: 44, height: 44, borderRadius: 14, backgroundColor: gov ? c.surface2 : c.primarySoft }]}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: c.text, fontSize: 17, fontWeight: '600' }}>{title}</Text>
        <Text style={{ color: c.textMuted, fontSize: 13, lineHeight: 18, marginTop: 2 }}>{body}</Text>
      </View>
    </View>
  );
}

function Line({ c, label, value, large, last }: { c: Palette; label: string; value: string; large?: boolean; last?: boolean }) {
  return (
    <View style={[styles.between, { paddingVertical: 12, borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth, borderBottomColor: c.border }]}>
      <Text style={{ color: c.textMuted }}>{label}</Text>
      <Text style={{ color: c.text, fontWeight: '600', fontSize: large ? 17 : 14 }}>{value}</Text>
    </View>
  );
}

function Note({ c, unread, icon, tone, title, body, time, onPress }: { c: Palette; unread?: boolean; icon: ReactNode; tone: string; title: string; body: string; time: string; onPress: () => void }) {
  const bg = tone === 'amber' ? c.warningSoft : tone === 'green' ? c.primarySoft : c.surface2;
  const s = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <AnimatedPressable
      onPressIn={() => { s.value = withSpring(0.985, { damping: 16, stiffness: 320 }); }}
      onPressOut={() => { s.value = withSpring(1, { damping: 12, stiffness: 260 }); }}
      onPress={onPress}
      style={[styles.note, { backgroundColor: unread ? c.primarySoft : c.surface, borderBottomColor: c.border }, anim]}
    >
      <View style={[styles.noteIcon, { backgroundColor: bg }]}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: c.text, fontWeight: '600' }}>{title}</Text>
        <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 3 }}>{body}</Text>
        <Text style={{ color: c.textMuted, fontSize: 11, marginTop: 2 }}>{time}</Text>
      </View>
      {unread && <View style={[styles.unread, { backgroundColor: c.primary }]} />}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  actRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 13, borderWidth: 1, borderRadius: 16, boxShadow: '0 4px 12px #18196106' },
  accent: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  iconBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  rowCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 10 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18, borderRadius: 20, marginBottom: 12 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  soft: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  govMark: { width: 35, height: 35, borderRadius: 11, backgroundColor: '#42576B', alignItems: 'center', justifyContent: 'center' },
  emptyState: { alignItems: 'center', paddingVertical: 30 },
  group: { fontSize: 13, fontWeight: '700', marginTop: 12, marginBottom: 8 },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, padding: 13, borderBottomWidth: StyleSheet.hairlineWidth },
  noteIcon: { width: 35, height: 35, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  unread: { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
  stage: { height: 420, borderRadius: 27, overflow: 'hidden', backgroundColor: '#08155C' },
  storyCopy: { position: 'absolute', left: 20, right: 20, bottom: 28 },
  storyH: { color: '#fff', fontSize: 28, fontWeight: '600', letterSpacing: -0.8, marginVertical: 8 },
  filmBtn: { marginTop: 10, alignSelf: 'flex-start', flexDirection: 'row', gap: 6, alignItems: 'center', paddingHorizontal: 13, height: 34, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', backgroundColor: 'rgba(255,255,255,0.13)' },
  metrics: { flexDirection: 'row', gap: 7, marginVertical: 13 },
  metric: { flex: 1, padding: 12, borderRadius: 14, alignItems: 'center' },
  scene: { flexDirection: 'row', gap: 10, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth },
  sceneNum: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  cta: { minHeight: 170, marginVertical: 13, borderRadius: 20, overflow: 'hidden', padding: 18, justifyContent: 'center' },
  ctaImg: { position: 'absolute', width: 200, height: 180, right: -56, bottom: -31, opacity: 0.55 },
  ctaBtn: { alignSelf: 'flex-start', backgroundColor: '#fff', height: 37, paddingHorizontal: 14, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 4 },
  stateIcon: { width: 74, height: 74, borderRadius: 37, alignItems: 'center', justifyContent: 'center' },
});
