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
  const [filter, setFilter] = useState('All');
  const [events, setEvents] = useState<DbActivityEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase || !householdId) { setLoading(false); return; }
    void fetchHouseholdActivityEvents(householdId).then((data) => { setEvents(data); setLoading(false); });
  }, [householdId]);

  useRealtimeActivity(householdId, {
    onInsert: (event) => setEvents((current) => [event as DbActivityEvent, ...current]),
  });

  const items = events.length > 0 ? events.map((evt) => {
    const tone = String(evt.title).toLowerCase().includes('meralco') ? 'orange' : String(evt.title).toLowerCase().includes('maynilad') ? 'blue' : 'indigo';
    const letter = (String(evt.title).match(/[A-Z]/)?.[0] || 'M');
    const amount = evt.amount != null ? new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(evt.amount)) : '—';
    const eventType = String(evt.event_type).replace(/_/g, ' ');
    const time = new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(evt.created_at));
    const category = String(evt.event_type).includes('paid') ? 'Bills' : 'Bills';
    return [letter, tone, String(evt.title), eventType, time, amount, 'Paid', category] as unknown as [string, string, string, string, string, string, string, string];
  }) : [];

  const visible = filter === 'All' ? items : items.filter((item) => item[7] === filter);
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <AppHeader title={t.activity.title} onBack={() => go('home')} c={c} />
      <ScreenScroll>
        <CinematicHero pose="bills" height={136} c={c} title={t.activity.title} subtitle="A clear record of your household’s bill activity." />
        <View style={{ flexDirection: 'row', gap: 7, marginBottom: 12 }}>
          {['All', 'Bills', 'Load', 'Lingkod'].map((item) => (
            <Pressable key={item} onPress={() => setFilter(item)} style={[styles.chip, { backgroundColor: filter === item ? c.primary : c.surface, borderColor: filter === item ? c.primary : c.border }]}>
              <Text style={{ color: filter === item ? c.onPrimary : c.text, fontWeight: '700', fontSize: 12 }}>{item}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={{ color: c.textMuted, fontSize: 12, marginBottom: 8 }}>{new Intl.DateTimeFormat('en-PH', { month: 'long', year: 'numeric' }).format(new Date())}</Text>
        <Card c={c} style={{ paddingVertical: 0, paddingHorizontal: 14 }}>
          {visible.length ? visible.map((i) => (
            <View key={i[2] + i[5]} style={[styles.actRow, { borderBottomColor: c.border }]}>
              <ProviderMark tone={i[1]} letter={i[0]} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.text, fontWeight: '800' }}>{i[2]}</Text>
                <Text style={{ color: c.textMuted, fontSize: 12 }}>{i[3]}</Text>
                <Text style={{ color: c.textMuted, fontSize: 11 }}>{i[4]}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text style={{ color: c.text, fontWeight: '800' }}>{i[5]}</Text>
                <StatusPill status={i[6]} c={c} />
              </View>
            </View>
          )) : (
            <View style={{ padding: 28, alignItems: 'center' }}>
              <CheckCircle2 size={28} color={c.primary} />
              <Text style={{ color: c.textMuted, marginTop: 8 }}>{t.activity.empty}</Text>
            </View>
          )}
        </Card>
      </ScreenScroll>
    </View>
  );
}

export function LoadScreen({ go, t, c }: { go: (s: Screen) => void; t: Copy; c: Palette }) {
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <AppHeader title={t.load.title} c={c} trailing={<Pressable style={[styles.accent, { backgroundColor: c.primary }]}><Plus size={18} color="#fff" /></Pressable>} />
      <ScreenScroll withNav>
        <CinematicHero pose="services" height={136} c={c} title={t.load.stay} subtitle={t.load.stayBody} />
        <Lead c={c} icon={<Smartphone size={20} color={c.primary} />} title={t.load.stay} body={t.load.stayBody} />
        <InfoBanner c={c}>{t.load.banner}</InfoBanner>
          {loads.map((l) => (
            <PressRow key={l.name} onPress={() => go('load-detail')} style={[styles.rowCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <ProviderMark tone={l.tone} letter={l.mark} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.text, fontWeight: '800' }}>{l.name}</Text>
              <Text style={{ color: c.textMuted, fontSize: 12 }}>{l.number}</Text>
            </View>
            <View><Text style={{ color: c.textMuted, fontSize: 10 }}>{t.load.next}</Text><Text style={{ color: c.text, fontWeight: '800' }}>{l.date}</Text></View>
            <View><Text style={{ color: c.textMuted, fontSize: 10 }}>{t.load.typical}</Text><Text style={{ color: c.text, fontWeight: '800' }}>{l.amount}</Text></View>
            <ChevronRight size={14} color={c.textMuted} />
          </PressRow>
        ))}
      </ScreenScroll>
      <BottomNav screen="load" go={go} c={c} t={t} />
    </View>
  );
}

export function LoadDetail({ go, t, c }: { go: (s: Screen) => void; t: Copy; c: Palette }) {
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <AppHeader title={t.load.details} onBack={() => go('load')} c={c} trailing={<Pressable style={[styles.iconBtn, { backgroundColor: c.surface }]}><Pencil size={16} color={c.text} /></Pressable>} />
      <ScreenScroll>
        <CinematicHero pose="services" height={132} c={c} title={t.load.details} subtitle="Keep your prepaid essentials on schedule." />
        <View style={[styles.hero, { backgroundColor: c.surface }]}>
          <ProviderMark tone="green" letter="S" size={46} />
          <View><Text style={{ color: c.text, fontSize: 18, fontWeight: '800' }}>SMART</Text><Text style={{ color: c.textMuted }}>0919 ••• 4821 · Nanay</Text></View>
        </View>
        <Card c={c}>
          <Line c={c} label={t.load.next} value="Sep 7, 2026" />
          <Line c={c} label={t.load.typical} value="₱299" />
          <Line c={c} label={t.load.repeats} value={t.load.every30} last />
        </Card>
        <Card c={c} style={styles.between}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={[styles.soft, { backgroundColor: c.primarySoft }]}><Bell size={17} color={c.primary} /></View>
            <View><Text style={{ color: c.text, fontWeight: '800' }}>{t.load.remindMe}</Text><Text style={{ color: c.textMuted, fontSize: 12 }}>Sep 7 at 9:00 AM</Text></View>
          </View>
          <Switch value trackColor={{ true: c.primary }} />
        </Card>
        <View style={{ gap: 9, marginTop: 16 }}>
          <PrimaryButton title={t.load.openProvider} onPress={() => {}} c={c} />
          <SecondaryButton title={t.load.markDone} onPress={() => go('load')} c={c} icon={<Check size={16} color={c.text} />} />
        </View>
        <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 12 }}>{t.load.legal}</Text>
      </ScreenScroll>
    </View>
  );
}

export function LingkodScreen({
  go, t, c, householdId, onSelectGovernment,
}: { go: (s: Screen) => void; t: Copy; c: Palette; householdId: string; onSelectGovernment: (government: GovernmentService) => void }) {
  const [bills, setBills] = useState<DbBill[]>([]);
  const load = () => { void fetchHouseholdBills(householdId).then(setBills); };
  useEffect(() => { load(); }, [householdId]);
  useRealtimeBills(householdId, { onInsert: load, onUpdate: load });
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <AppHeader title={t.lingkod.title} c={c} />
      <ScreenScroll withNav>
        <CinematicHero pose="government" height={168} c={c} title={t.lingkod.lead} subtitle={t.lingkod.leadBody} />
        <InfoBanner c={c}>{t.lingkod.banner}</InfoBanner>
        <Text style={{ color: c.text, fontSize: 17, fontWeight: '800', marginBottom: 10 }}>Government bills</Text>
        {governmentServices.map((government) => {
          const bill = bills.find((item) => item.provider === government.name);
          const display = bill ? formatBillDisplay(bill) : null;
          return <PressRow key={government.id} onPress={() => onSelectGovernment(government)} style={[styles.rowCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <View style={styles.govMark}><Text style={{ color: '#fff', fontWeight: '800' }}>{government.mark}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.text, fontWeight: '800', fontSize: 15 }}>{government.name}</Text>
              <Text style={{ color: c.textMuted, fontSize: 13, marginTop: 2 }}>{display ? `${display.dueDateShort} · ${display.amount}` : 'Add your household bill'}</Text>
            </View>
            {display ? <StatusPill status={display.status} c={c} /> : <Text style={{ color: c.primary, fontSize: 12, fontWeight: '800' }}>Add</Text>}
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
  const [bill, setBill] = useState<DbBill | null>(null);
  const [account, setAccount] = useState('');
  const [amount, setAmount] = useState('');
  const [dueDate, setDueDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const load = () => {
    void fetchHouseholdBills(householdId).then((items) => setBill(items.find((item) => item.provider === government.name) ?? null));
  };
  useEffect(() => { load(); }, [householdId, government.id]);
  const addBill = async () => {
    if (!supabase || !householdId || !userId) return;
    if (!amount.trim() || Number(amount) <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) { setMessage('Enter a valid amount and due date (YYYY-MM-DD).'); return; }
    setSaving(true); setMessage('');
    const { data, error } = await supabase.from('bills').insert({
      user_id: userId, household_id: householdId, provider: government.name, category: 'Government', account_number: account.trim() || null,
      alias: government.name, amount: Number(amount), due_date: dueDate, recurrence: 'monthly', reminder_days: 5, status: 'upcoming',
    }).select('*').single();
    if (error || !data) { setMessage(error?.message || 'Could not add this government bill.'); setSaving(false); return; }
    await createBillActivityEvent(userId, householdId, data.id, 'government_bill_added', `${government.name} bill added`, Number(amount));
    setBill(data as DbBill); setSaving(false);
  };
  const payBill = async () => {
    if (!bill) return;
    setSaving(true); setMessage('');
    try {
      await markBillPaid(bill.id, householdId, 'External payment', '', 'Household member');
      await createBillActivityEvent(userId, householdId, bill.id, 'government_bill_paid', `${government.name} marked paid`, Number(bill.amount));
      await load();
    } catch (reason) { setMessage(reason instanceof Error ? reason.message : 'Could not mark this bill as paid.'); }
    finally { setSaving(false); }
  };
  const display = bill ? formatBillDisplay(bill) : null;
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <AppHeader title={government.name} onBack={() => go('lingkod')} c={c} />
      <ScreenScroll>
        <CinematicHero pose="government" height={142} c={c} title={government.name} subtitle={government.detail} />
        <View style={[styles.hero, { backgroundColor: c.surface }]}>
          <View style={[styles.govMark, { width: 46, height: 46, borderRadius: 15 }]}><Text style={{ color: '#fff', fontWeight: '800', fontSize: 18 }}>{government.mark}</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.text, fontSize: 18, fontWeight: '800' }}>{government.name}</Text>
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
          <Text style={{ color: c.text, fontSize: 17, fontWeight: '800' }}>Add your bill</Text>
          <Text style={{ color: c.textMuted, fontSize: 13, lineHeight: 19 }}>Only your household’s own {government.name} bill is saved here.</Text>
          <Field c={c} label="Account or reference number" value={account} onChangeText={setAccount} placeholder="Optional" autoCapitalize="characters" />
          <Field c={c} label="Amount" value={amount} onChangeText={setAmount} placeholder="0.00" keyboardType="decimal-pad" />
          <Field c={c} label="Due date" value={dueDate} onChangeText={setDueDate} placeholder="YYYY-MM-DD" autoCapitalize="none" />
          <PrimaryButton title={saving ? 'Adding bill…' : 'Add government bill'} loading={saving} onPress={() => void addBill()} c={c} icon={<Check size={16} color="#fff" />} />
        </Card>}
        <View style={{ flexDirection: 'row', gap: 7, marginTop: 12 }}>
          <ShieldCheck size={13} color={c.primary} />
          <Text style={{ color: c.textMuted, fontSize: 12, flex: 1 }}>{t.lingkod.legal}</Text>
        </View>
      </ScreenScroll>
    </View>
  );
}

export function NotificationsScreen({ go, t, c, userId = '' }: { go: (s: Screen) => void; t: Copy; c: Palette; userId?: string }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unread, setUnread] = useState(false);

  useEffect(() => {
    if (!supabase || !userId) return;
    void fetchNotifications(userId).then((data) => {
      setNotifications(data);
      setUnread(data.some((n) => !n.read));
    });
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
      });
    },
  });

  const markAll = () => {
    if (!supabase || !userId) { setUnread(false); return; }
    void markAllNotificationsRead(userId);
    setNotifications((current) => current.map((n) => ({ ...n, read: true })));
    setUnread(false);
  };

  const open = (n: AppNotification) => {
    if (n.bill_id) go('bill-detail');
    else if (n.type === 'government') go('government-detail');
    else go('bill-detail');
    void markNotificationRead(n.id);
    setNotifications((current) => current.map((item) => item.id === n.id ? { ...item, read: true } : item));
    setUnread(notifications.some((x) => !x.read));
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
        <Text style={{ color: c.text, fontSize: 22, fontWeight: '800', marginTop: 16 }}>{data.title}</Text>
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
        <Text style={{ color: c.text, fontSize: 17, fontWeight: '800' }}>{title}</Text>
        <Text style={{ color: c.textMuted, fontSize: 13, lineHeight: 18, marginTop: 2 }}>{body}</Text>
      </View>
    </View>
  );
}

function Line({ c, label, value, large, last }: { c: Palette; label: string; value: string; large?: boolean; last?: boolean }) {
  return (
    <View style={[styles.between, { paddingVertical: 12, borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth, borderBottomColor: c.border }]}>
      <Text style={{ color: c.textMuted }}>{label}</Text>
      <Text style={{ color: c.text, fontWeight: '800', fontSize: large ? 17 : 14 }}>{value}</Text>
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
        <Text style={{ color: c.text, fontWeight: '800' }}>{title}</Text>
        <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 3 }}>{body}</Text>
        <Text style={{ color: c.textMuted, fontSize: 11, marginTop: 2 }}>{time}</Text>
      </View>
      {unread && <View style={[styles.unread, { backgroundColor: c.primary }]} />}
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  actRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth },
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
  storyH: { color: '#fff', fontSize: 28, fontWeight: '800', letterSpacing: -0.8, marginVertical: 8 },
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
