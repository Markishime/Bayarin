import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowUpRight, Bell, Check, ChevronRight, Copy as CopyIcon, Home, Info, Pencil, Plus,
  Search, Upload, Users, X,
} from 'lucide-react-native';
import { useEffect, useState, useCallback, type ReactNode } from 'react';
import { Image, Modal, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { AppHeader, BottomNav, Card, CinematicHero, Field, PrimaryButton, ProviderMark, ScreenScroll, SecondaryButton, StatusPill } from '../components/ui';
import { images, type BillService, type ServiceProvider } from '../data';
import type { Copy } from '../i18n';
import { supabase, supabaseSetupMessage } from '../lib/supabase';
import { useRealtimeBills } from '../services/realtime';
import { fetchHouseholdBills, formatBillDisplay, markBillPaid, createBillActivityEvent, type DbBill } from '../services/household';
import { fetchHouseholdUsers, type HouseholdUser } from '../services/households';
import { createNotification, checkAndCreateDueDateReminders } from '../services/notifications';
import { gradient, type Palette } from '../theme';
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

function SearchInput({ c, value, onChangeText, placeholder, placeholderTextColor }: { c: Palette; value: string; onChangeText: (v: string) => void; placeholder: string; placeholderTextColor: string }) {
  const [focused, setFocused] = useState(false);
  const focusProgress = useSharedValue(0);

  useEffect(() => {
    focusProgress.value = withTiming(focused ? 1 : 0, { duration: 220, easing: Easing.out(Easing.quad) });
  }, [focused, focusProgress]);

  const anim = useAnimatedStyle(() => ({
    borderColor: focused ? c.primary : c.border,
    shadowRadius: interpolate(focusProgress.value, [0, 1], [0, 12]),
    shadowOpacity: interpolate(focusProgress.value, [0, 1], [0, 0.16]),
  }));

  return (
    <Animated.View style={[styles.search, { backgroundColor: c.surface, shadowColor: '#2F46E8', shadowOffset: { width: 0, height: 0 } }, anim]}>
      <Search size={15} color={c.textMuted} />
      <TextInput value={value} onChangeText={onChangeText} placeholder={placeholder} placeholderTextColor={placeholderTextColor}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ flex: 1, color: c.text, height: 42, outlineWidth: 0, outlineStyle: 'solid', outlineColor: 'transparent' }} />
    </Animated.View>
  );
}

type BillDisplay = ReturnType<typeof formatBillDisplay>;

export function BillsScreen({ go, t, c, userId, householdId }: { go: (s: Screen) => void; t: Copy; c: Palette; userId: string; householdId: string }) {
  const [filter, setFilter] = useState('All');
  const [query, setQuery] = useState('');
  const [userBills, setUserBills] = useState<BillDisplay[]>([]);
  const [loading, setLoading] = useState(true);

  const loadBills = useCallback(async () => {
    const bills = await fetchHouseholdBills(householdId);
    setUserBills(bills.map(formatBillDisplay));
    setLoading(false);
  }, [householdId]);

  useEffect(() => { void loadBills(); }, [loadBills]);

  useEffect(() => {
    if (userId && householdId) void checkAndCreateDueDateReminders(userId, householdId);
  }, [userId, householdId]);

  useRealtimeBills(householdId, {
    onUpdate: () => void loadBills(),
    onInsert: () => void loadBills(),
  });

  const labels: Record<string, string> = { All: t.bills.all, 'Due soon': t.bills.dueSoon, Upcoming: t.bills.upcoming, Paid: t.bills.paid, Overdue: t.bills.overdue };
  const displayBills = userBills;
  const filtered = displayBills.filter((b) => (filter === 'All' || b.status === filter) && `${b.provider} ${b.category} ${b.account}`.toLowerCase().includes(query.toLowerCase()));

  const unpaidTotal = userBills.filter((b) => !['Paid', 'paid'].includes(b.status)).reduce((sum, b) => sum + b.rawAmount, 0);
  const unpaidCount = userBills.filter((b) => !['Paid', 'paid'].includes(b.status)).length;
  const dueSoonCount = userBills.filter((b) => b.status.toLowerCase().includes('due')).length;
  const overdueCount = userBills.filter((b) => b.status.toLowerCase().includes('overdue')).length;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <AppHeader title={t.bills.title} c={c} trailing={
        <Pressable onPress={() => go('add-bill')} style={[styles.accentBtn, { backgroundColor: c.primary }]} accessibilityLabel={t.bills.add}>
          <Plus size={18} color="#fff" />
        </Pressable>
      } />
      <ScreenScroll withNav>
        <CinematicHero
          pose="bills"
          height={188}
          c={c}
          title={t.bills.stillUnpaid}
          subtitle={unpaidCount > 0 ? `${unpaidCount} bill${unpaidCount > 1 ? 's' : ''} remaining` : 'No household bills yet'}
        >
          <Text style={{ color: c.text, fontSize: 30, fontWeight: '800', letterSpacing: -0.8, marginTop: 4 }}>
            {unpaidTotal > 0 ? new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(unpaidTotal) : '₱0.00'}
          </Text>
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 8 }}>
            <Text style={{ color: c.textMuted, fontSize: 12 }}>{dueSoonCount} {t.bills.dueSoon.toLowerCase()}</Text>
            <Text style={{ color: c.danger, fontSize: 12 }}>{overdueCount} {t.bills.overdue.toLowerCase()}</Text>
          </View>
        </CinematicHero>
        <SearchInput c={c} value={query} onChangeText={setQuery} placeholder={t.bills.search} placeholderTextColor={c.textSoft} />
        <View style={styles.filters}>
          {['All', 'Due soon', 'Upcoming', 'Paid', 'Overdue'].map((f) => (
            <Pressable key={f} onPress={() => setFilter(f)} style={[styles.chip, { backgroundColor: filter === f ? c.primary : c.surface, borderColor: filter === f ? c.primary : c.border }]}>
              <Text style={{ color: filter === f ? c.onPrimary : c.text, fontSize: 12, fontWeight: '700' }}>{labels[f]}</Text>
            </Pressable>
          ))}
        </View>
        {filtered.length ? filtered.map((b, i) => (
          <PressRow key={b.id || i} onPress={() => go('bill-detail')} style={[styles.billCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
              <ProviderMark tone={b.tone} letter={b.provider[0]} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.text, fontWeight: '800', fontSize: 15 }}>{b.provider}</Text>
                <Text style={{ color: c.textMuted, fontSize: 13, marginTop: 2 }}>{b.category} · •••• {b.account}</Text>
              </View>
              {b.paidBy && (
                <View style={[styles.paidByChip, { backgroundColor: c.primarySoft }]}>
                  <Users size={10} color={c.primary} />
                  <Text style={{ color: c.primary, fontSize: 10, fontWeight: '700' }}>{b.paidBy}</Text>
                </View>
              )}
              <ChevronRight size={16} color={c.textMuted} />
            </View>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border }}>
              <View>
                <Text style={{ color: c.textMuted, fontSize: 11 }}>{t.bills.due}</Text>
                <Text style={{ color: c.text, fontWeight: '800' }}>{b.due}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text style={{ color: c.text, fontSize: 16, fontWeight: '800' }}>{b.amount}</Text>
                <StatusPill status={b.status} c={c} />
              </View>
            </View>
          </PressRow>
        )) : (
          <View style={{ alignItems: 'center', padding: 40 }}>
            <Text style={{ color: c.text, fontSize: 20, fontWeight: '800' }}>No bills yet</Text>
            <Text style={{ color: c.textMuted, marginVertical: 8, fontSize: 14, lineHeight: 20, textAlign: 'center' }}>Add the first bill for this household to begin tracking it.</Text>
            <PrimaryButton title={t.empty.add} onPress={() => go('add-bill')} c={c} icon={<Plus size={16} color="#fff" />} />
          </View>
        )}
      </ScreenScroll>
      <BottomNav screen="bills" go={go} c={c} t={t} />
    </View>
  );
}

export function BillDetail({ go, t, c, setPayOpen, userId, householdId }: { go: (s: Screen) => void; t: Copy; c: Palette; setPayOpen: (v: boolean) => void; userId: string; householdId: string }) {
  const [archiving, setArchiving] = useState(false);
  const [bill, setBill] = useState<BillDisplay | null>(null);

  useEffect(() => {
    if (!supabase || !householdId) return;
    void supabase.from('bills').select('*').eq('household_id', householdId).order('due_date').limit(1).maybeSingle().then(({ data }) => {
      if (data) setBill(formatBillDisplay(data as DbBill));
    });
  }, [householdId]);

  const display = bill || formatBillDisplay({ provider: 'MERALCO', category: 'Electricity', account_number: '1234 5678 9012', amount: 2450.36, due_date: '2026-09-08', status: 'due_soon', billing_period: 'Aug 10 – Sep 10, 2026', paid_by: null, paid_at: null, payment_method: null, reference_number: null } as DbBill);

  const archive = async () => {
    setArchiving(true);
    if (supabase && bill) {
      await supabase.from('bills').update({ status: 'archived' }).eq('id', bill.id).eq('household_id', householdId);
    }
    setArchiving(false);
    go('bills');
  };

  useRealtimeBills(householdId, {
    onUpdate: (updated) => {
      if (updated && typeof updated === 'object') setBill(formatBillDisplay(updated as DbBill));
    },
  });

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <AppHeader title={t.bills.details} onBack={() => go('bills')} c={c} trailing={
        <Pressable onPress={() => go('edit-bill')} style={[styles.iconBtn, { backgroundColor: c.surface }]}><Pencil size={16} color={c.text} /></Pressable>
      } />
      <ScreenScroll>
        <CinematicHero pose="bills" height={140} c={c} title={display.provider} subtitle="Review your household bill before payment." />
        <View style={[styles.hero, { backgroundColor: c.surface }]}>
          <ProviderMark tone={display.tone} letter={display.provider[0]} size={46} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.text, fontSize: 18, fontWeight: '800' }}>{display.provider}</Text>
            <Text style={{ color: c.textMuted, fontSize: 12 }}>{display.category} · {display.billingPeriod || 'Bahay'}</Text>
          </View>
          <StatusPill status={display.status} c={c} />
        </View>
        <Card c={c} style={styles.rowBetween}>
          <View>
            <Text style={{ color: c.textMuted, fontSize: 11 }}>{t.bills.account}</Text>
            <Text style={{ color: c.text, fontWeight: '800' }}>{display.account ? `•••• ${display.account}` : 'No account'}</Text>
          </View>
          <Pressable onPress={() => void Clipboard.setStringAsync(display.account)} style={[styles.copyBtn, { backgroundColor: c.primarySoft }]}>
            <CopyIcon size={13} color={c.primary} /><Text style={{ color: c.primary, fontWeight: '700', fontSize: 12 }}>{t.bills.copy}</Text>
          </Pressable>
        </Card>
        <Card c={c}>
          <Row c={c} label={t.bills.amount} value={display.amount} large />
          <Row c={c} label={t.bills.due} value={display.due} />
          {display.billingPeriod && <Row c={c} label={t.bills.period} value={display.billingPeriod} />}
          <View style={styles.rowBetween}><Text style={{ color: c.textMuted }}>{t.bills.status}</Text><StatusPill status={display.status} c={c} /></View>
        </Card>
        {display.paidBy && (
          <Card c={c} style={{ marginBottom: 12 }}>
            <View style={styles.rowBetween}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
              <View style={[styles.softIcon, { backgroundColor: c.successSoft }]}><Users size={17} color={c.success} /></View>
              <View>
                <Text style={{ color: c.text, fontWeight: '800' }}>{t.bills.paidBy || 'Paid by'}</Text>
                <Text style={{ color: c.textMuted, fontSize: 12 }}>{display.paidBy}</Text>
              </View>
            </View>
            {display.paidAt && (
              <Text style={{ color: c.textMuted, fontSize: 11 }}>
                {new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric' }).format(new Date(display.paidAt))}
              </Text>
            )}
            </View>
          </Card>
        )}
        {display.paymentMethod && (
          <Card c={c} style={{ marginBottom: 12 }}>
            <Row c={c} label={t.bills.method} value={display.paymentMethod} />
            {display.referenceNumber && <Row c={c} label={t.bills.reference} value={display.referenceNumber} last />}
          </Card>
        )}
        <Card c={c} style={styles.rowBetween}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={[styles.softIcon, { backgroundColor: c.primarySoft }]}><Bell size={17} color={c.primary} /></View>
            <View>
              <Text style={{ color: c.text, fontWeight: '800' }}>{t.bills.reminder}</Text>
              <Text style={{ color: c.textMuted, fontSize: 12 }}>{t.bills.reminderHint}</Text>
            </View>
          </View>
          <Switch value trackColor={{ true: c.primary }} />
        </Card>
        <View style={{ gap: 9, marginTop: 16 }}>
          <PrimaryButton title={t.bills.payOutside} onPress={() => setPayOpen(true)} c={c} icon={<ArrowUpRight size={16} color="#fff" />} />
          <SecondaryButton title={t.bills.markPaid} onPress={() => go('mark-paid')} c={c} icon={<Check size={16} color={c.text} />} />
        </View>
        <View style={{ flexDirection: 'row', gap: 7, marginTop: 14 }}>
          <Info size={13} color={c.textMuted} />
          <Text style={{ color: c.textMuted, fontSize: 12, flex: 1 }}>{t.bills.legal}</Text>
        </View>
        <View style={{ flexDirection: 'row', justifyContent: 'center', gap: 28, marginTop: 18 }}>
          <Pressable onPress={() => go('edit-bill')}><Text style={{ color: c.textMuted }}>{t.bills.edit}</Text></Pressable>
          <Pressable onPress={() => void archive()}><Text style={{ color: c.textMuted }}>{archiving ? t.bills.archiving : t.bills.archive}</Text></Pressable>
        </View>
      </ScreenScroll>
    </View>
  );
}

export function BillForm({ go, t, c, userId, householdId, service, provider, edit = false }: { go: (s: Screen) => void; t: Copy; c: Palette; userId: string; householdId: string; service: BillService; provider: ServiceProvider; edit?: boolean }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [account, setAccount] = useState('');
  const [alias, setAlias] = useState('');
  const [amount, setAmount] = useState('');
  const [due, setDue] = useState('');
  const [period, setPeriod] = useState('');
  const save = async () => {
    setError('');
    if (!supabase) { setError(supabaseSetupMessage); return; }
    setSaving(true);
    if (!householdId) { setError('Join a household before adding a bill.'); setSaving(false); return; }
    if (!account.trim() || !amount.trim() || Number(amount) <= 0 || !/^\d{4}-\d{2}-\d{2}$/.test(due)) { setError('Enter your account number, a valid amount, and a due date (YYYY-MM-DD).'); setSaving(false); return; }
    const payload = { user_id: userId, household_id: householdId, provider: provider.name, category: service.name, account_number: account.trim(), alias: alias.trim() || null, amount: Number(amount), due_date: due, billing_period: period.trim() || null, recurrence: 'monthly', reminder_days: 5, status: 'upcoming' };
    let authError;
    if (edit) {
      const { data: existing } = await supabase.from('bills').select('id').eq('household_id', householdId).eq('provider', provider.name).limit(1).maybeSingle();
      if (existing) ({ error: authError } = await supabase.from('bills').update(payload).eq('id', existing.id).eq('household_id', householdId));
      else ({ error: authError } = await supabase.from('bills').insert(payload));
    } else ({ error: authError } = await supabase.from('bills').insert(payload));
    setSaving(false);
    if (authError) { setError(authError.message); return; }
    await createBillActivityEvent(userId, householdId, null, edit ? 'bill_updated' : 'bill_added', `${provider.name} bill ${edit ? 'updated' : 'added'}`, payload.amount);
    await createNotification(userId, edit ? 'Bill updated' : 'Bill added', `${provider.name} bill ${edit ? 'updated' : 'added'} — ${new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(payload.amount)}`, 'bill_update', undefined, { status: edit ? 'updated' : 'added' });
    go('bills');
  };
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <AppHeader title={edit ? t.bills.edit : t.bills.add} onBack={() => go(edit ? 'bill-detail' : 'bills')} c={c} />
      <ScreenScroll>
        <CinematicHero pose="services" height={150} c={c} title={edit ? t.bills.update : t.bills.track} subtitle={t.bills.remindBefore} />
        <Card c={c} style={{ gap: 12 }}>
          {error ? <Text style={{ color: c.danger }}>{error}</Text> : null}
          <Text style={{ color: c.textMuted, fontSize: 12, fontWeight: '700' }}>{t.bills.provider}</Text>
          <View style={[styles.fake, { borderColor: c.border, backgroundColor: c.bg }]}>
            <ProviderMark tone={provider.tone} letter={provider.mark} size={28} />
            <View style={{ flex: 1 }}><Text style={{ color: c.text, fontWeight: '800' }}>{provider.name}</Text><Text style={{ color: c.textMuted, fontSize: 11 }}>{service.name}</Text></View>
            <ChevronRight size={14} color={c.textMuted} />
          </View>
          <Labeled c={c} label={t.bills.account} value={account} onChange={setAccount} />
          <Labeled c={c} label={`${t.bills.alias} ${t.bills.optional}`} value={alias} onChange={setAlias} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}><Labeled c={c} label={t.bills.amount} value={amount} onChange={setAmount} keyboardType="decimal-pad" /></View>
            <View style={{ flex: 1 }}><Labeled c={c} label={t.bills.due} value={due} onChange={setDue} /></View>
          </View>
          <Labeled c={c} label={`${t.bills.period} ${t.bills.optional}`} value={period} onChange={setPeriod} />
          <PrimaryButton title={saving ? t.bills.saving : edit ? t.bills.saveChanges : t.bills.save} loading={saving} onPress={() => void save()} c={c} icon={<Check size={16} color="#fff" />} />
        </Card>
      </ScreenScroll>
    </View>
  );
}

export function MarkPaid({ go, t, c, userId, householdId }: { go: (s: Screen) => void; t: Copy; c: Palette; userId: string; householdId: string }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [method, setMethod] = useState('GCash');
  const [reference, setReference] = useState('');
  const [selectedMember, setSelectedMember] = useState('');
  const [members, setMembers] = useState<HouseholdUser[]>([]);
  const [billId, setBillId] = useState('');

  useEffect(() => {
    if (!supabase || !householdId) return;
    void fetchHouseholdUsers(householdId).then(setMembers);
    void supabase.from('bills').select('id,provider,amount').eq('household_id', householdId).neq('status', 'paid').order('due_date').limit(1).maybeSingle().then(({ data }) => {
      if (data) setBillId(data.id);
    });
  }, [householdId]);

  const save = async () => {
    setError('');
    if (!supabase) { setError(supabaseSetupMessage); return; }
    if (!billId) { setError('No unpaid bill found. Add a bill first.'); return; }
    setSaving(true);
    try {
      const paidBy = selectedMember || 'You';
      await markBillPaid(billId, householdId, method, reference, paidBy);
      await createBillActivityEvent(userId, householdId, billId, 'bill_marked_paid', `Meralco marked paid by ${paidBy}`, 2450.36, { paid_by: paidBy, payment_method: method });
      await createNotification(
        userId,
        'Bill marked as paid',
        `Meralco bill marked as paid by ${paidBy} via ${method}`,
        'payment_update',
        billId,
        { actor: paidBy, payment_method: method, reference_number: reference, status: 'paid' },
      );
      setSaving(false);
      go('success');
    } catch (err) {
      setSaving(false);
      setError(err instanceof Error ? err.message : 'Failed to record payment');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <AppHeader title={t.bills.markTitle} onBack={() => go('bill-detail')} c={c} />
      <ScreenScroll>
        <CinematicHero pose="bills" height={140} c={c} title={t.bills.markTitle} subtitle="Keep your shared household record up to date." />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 }}>
          <ProviderMark tone="orange" letter="M" />
          <View style={{ flex: 1 }}><Text style={{ color: c.text, fontWeight: '800' }}>MERALCO</Text><Text style={{ color: c.textMuted, fontSize: 12 }}>{t.bills.amount}</Text></View>
          <Text style={{ color: c.text, fontSize: 18, fontWeight: '800' }}>₱2,450.36</Text>
        </View>
        <Card c={c} style={{ gap: 12 }}>
          {error ? <Text style={{ color: c.danger }}>{error}</Text> : null}
          {members.length > 0 && (
            <>
              <Text style={{ color: c.textMuted, fontSize: 12, fontWeight: '700' }}>{t.bills.paidBy || 'Paid by'}</Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                <Pressable onPress={() => setSelectedMember('')} style={[styles.chip, { backgroundColor: !selectedMember ? c.primary : c.bg, borderColor: !selectedMember ? c.primary : c.border }]}>
                  <Text style={{ color: !selectedMember ? c.onPrimary : c.text, fontWeight: '700', fontSize: 12 }}>{t.common.you || 'You'}</Text>
                </Pressable>
                {members.filter((m) => m.user_id !== userId).map((m) => {
                  const name = m.profile?.full_name || 'Household member';
                  return <Pressable key={m.user_id} onPress={() => setSelectedMember(name)} style={[styles.chip, { backgroundColor: selectedMember === name ? c.primary : c.bg, borderColor: selectedMember === name ? c.primary : c.border }]}>
                    <Text style={{ color: selectedMember === name ? c.onPrimary : c.text, fontWeight: '700', fontSize: 12 }}>{name}</Text>
                  </Pressable>
                })}
              </View>
            </>
          )}
          <Labeled c={c} label={t.bills.amount} value="₱ 2,450.36" editable={false} />
          <Labeled c={c} label={t.bills.datePaid} value={new Date().toISOString().split('T')[0]} editable={false} />
          <Text style={{ color: c.textMuted, fontSize: 12, fontWeight: '700' }}>{t.bills.method}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {['GCash', 'Maya', 'Bank', 'Cash'].map((m) => (
              <Pressable key={m} onPress={() => setMethod(m)} style={[styles.chip, { backgroundColor: method === m ? c.primary : c.bg, borderColor: method === m ? c.primary : c.border }]}>
                <Text style={{ color: method === m ? c.onPrimary : c.text, fontWeight: '700', fontSize: 12 }}>{m}</Text>
              </Pressable>
            ))}
          </View>
          <Labeled c={c} label={`${t.bills.reference} ${t.bills.optional}`} value={reference} onChange={setReference} />
          <View style={[styles.upload, { borderColor: c.border, backgroundColor: c.bg }]}>
            <Upload size={17} color={c.primary} />
            <Text style={{ color: c.primary, fontWeight: '800' }}>{t.bills.attach}</Text>
            <Text style={{ color: c.textMuted, fontSize: 11 }}>{t.bills.attachHint}</Text>
          </View>
          <PrimaryButton title={saving ? t.bills.recording : t.bills.confirmPaid} loading={saving} onPress={() => void save()} c={c} icon={<Check size={16} color="#fff" />} />
        </Card>
        <View style={{ flexDirection: 'row', gap: 7, marginTop: 14 }}>
          <Info size={13} color={c.textMuted} />
          <Text style={{ color: c.textMuted, fontSize: 12, flex: 1 }}>{t.bills.markLegal}</Text>
        </View>
      </ScreenScroll>
    </View>
  );
}

export function SuccessScreen({ go, t, c }: { go: (s: Screen) => void; t: Copy; c: Palette }) {
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <ScreenScroll>
        <View style={{ alignItems: 'center', paddingTop: 20 }}>
          <LinearGradient colors={[...gradient.hero]} style={styles.successVisual}>
            <Image source={images.onboarding} style={{ width: '100%', height: '100%' }} />
            <View style={styles.successCheck}><Check size={22} color="#fff" /></View>
          </LinearGradient>
          <Text style={{ color: c.primary, fontSize: 11, letterSpacing: 1.3, fontWeight: '800', marginTop: 16 }}>{t.bills.successKicker}</Text>
          <Text style={{ color: c.text, fontSize: 28, fontWeight: '800', marginTop: 8 }}>{t.bills.recorded}</Text>
          <Text style={{ color: c.textMuted }}>{t.bills.recordedBody}</Text>
        </View>
        <Card c={c} style={{ marginTop: 24 }}>
          <Text style={{ color: c.textMuted, fontSize: 11 }}>{t.bills.amountPaid}</Text>
          <Text style={{ color: c.text, fontSize: 32, fontWeight: '800', marginBottom: 12 }}>₱2,450.36</Text>
          <Row c={c} label={t.bills.paidTo} value="MERALCO" />
          <Row c={c} label={t.bills.datePaid} value={new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date())} />
          <Row c={c} label={t.bills.method} value="GCash" last />
        </Card>
        <View style={{ gap: 9, marginTop: 22 }}>
          <SecondaryButton title={t.bills.viewBill} onPress={() => go('bill-detail')} c={c} />
          <PrimaryButton title={t.bills.backHome} onPress={() => go('home')} c={c} icon={<Home size={16} color="#fff" />} />
        </View>
      </ScreenScroll>
    </View>
  );
}

export function PaySheets({
  payOpen, setPayOpen, returnOpen, setReturnOpen, go, t, c,
}: {
  payOpen: boolean; setPayOpen: (v: boolean) => void; returnOpen: boolean; setReturnOpen: (v: boolean) => void;
  go: (s: Screen) => void; t: Copy; c: Palette;
}) {
  const [copied, setCopied] = useState(false);
  const choose = () => { setPayOpen(false); setReturnOpen(true); };
  const copy = async () => {
    await Clipboard.setStringAsync('MERALCO · Account 1234 5678 9012 · ₱2,450.36 · Due Sep 8, 2026');
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  return (
    <>
      <Sheet visible={payOpen} onClose={() => setPayOpen(false)} c={c} title={t.pay.title} body={t.pay.body}>
        <View style={[styles.sheetBill, { backgroundColor: c.bg }]}>
          <ProviderMark tone="orange" letter="M" />
          <View style={{ flex: 1 }}><Text style={{ color: c.text, fontWeight: '800' }}>MERALCO</Text><Text style={{ color: c.textMuted, fontSize: 12 }}>Account •••• 9012</Text></View>
          <Text style={{ color: c.text, fontWeight: '800' }}>₱2,450.36</Text>
        </View>
        {[
          { label: t.pay.gcash, color: '#1776E8', mark: 'G', action: choose },
          { label: t.pay.maya, color: '#101513', mark: 'M', action: choose },
          { label: t.pay.web, color: '#5C5852', mark: 'W', action: choose },
          { label: copied ? t.pay.copied : t.pay.copy, color: '#264BD6', mark: 'C', action: () => void copy() },
        ].map((row) => (
          <Pressable key={row.label} onPress={row.action} style={[styles.extRow, { borderBottomColor: c.border }]}>
            <View style={[styles.extIcon, { backgroundColor: row.color }]}><Text style={{ color: '#fff', fontWeight: '900' }}>{row.mark}</Text></View>
            <Text style={{ flex: 1, color: c.text, fontWeight: '800' }}>{row.label}</Text>
            <ArrowUpRight size={14} color={c.textMuted} />
          </Pressable>
        ))}
        <Text style={{ textAlign: 'center', color: c.textMuted, fontSize: 12, marginTop: 12 }}>{t.pay.footer}</Text>
      </Sheet>
      <Sheet visible={returnOpen} onClose={() => setReturnOpen(false)} c={c} title={t.pay.finished} body={t.pay.finishedBody}>
        <View style={[styles.sheetBill, { backgroundColor: c.bg }]}>
          <ProviderMark tone="orange" letter="M" />
          <View style={{ flex: 1 }}><Text style={{ color: c.text, fontWeight: '800' }}>MERALCO</Text><Text style={{ color: c.textMuted, fontSize: 12 }}>Account •••• 9012</Text></View>
          <Text style={{ color: c.text, fontWeight: '800' }}>₱2,450.36</Text>
        </View>
        <PrimaryButton title={t.pay.yes} onPress={() => { setReturnOpen(false); go('mark-paid'); }} c={c} icon={<Check size={16} color="#fff" />} />
        <View style={{ height: 8 }} />
        <SecondaryButton title={t.pay.notYet} onPress={() => setReturnOpen(false)} c={c} />
      </Sheet>
    </>
  );
}

function Sheet({ visible, onClose, c, title, body, children }: { visible: boolean; onClose: () => void; c: Palette; title: string; body: string; children: ReactNode }) {
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose} />
      <View style={[styles.sheet, { backgroundColor: c.surface }]}>
        <View style={[styles.handle, { backgroundColor: c.border }]} />
        <Pressable onPress={onClose} style={styles.sheetClose}><X size={18} color={c.textMuted} /></Pressable>
        <Text style={{ color: c.text, fontSize: 22, fontWeight: '800', letterSpacing: -0.4 }}>{title}</Text>
        <Text style={{ color: c.textMuted, fontSize: 13, marginTop: 6, marginBottom: 12 }}>{body}</Text>
        {children}
      </View>
    </Modal>
  );
}

function Row({ c, label, value, large, last }: { c: Palette; label: string; value: string; large?: boolean; last?: boolean }) {
  return (
    <View style={[styles.rowBetween, !last && { borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.border, paddingVertical: 12 }]}>
      <Text style={{ color: c.textMuted }}>{label}</Text>
      <Text style={{ color: c.text, fontWeight: '800', fontSize: large ? 17 : 14 }}>{value}</Text>
    </View>
  );
}

function Labeled({ c, label, value, onChange, keyboardType, editable = true }: { c: Palette; label: string; value: string; onChange?: (v: string) => void; keyboardType?: 'decimal-pad'; editable?: boolean }) {
  return (
    <Field
      c={c}
      label={label}
      editable={editable}
      value={value}
      onChangeText={onChange}
      keyboardType={keyboardType}
      inputMode={keyboardType === 'decimal-pad' ? 'decimal' : 'text'}
      autoCapitalize={keyboardType ? 'none' : 'sentences'}
    />
  );
}

const styles = StyleSheet.create({
  accentBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  iconBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  search: { height: 42, marginTop: 13, paddingHorizontal: 12, borderWidth: 1, borderRadius: 13, flexDirection: 'row', alignItems: 'center', gap: 7 },
  filters: { flexDirection: 'row', flexWrap: 'wrap', gap: 7, paddingVertical: 14 },
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  billCard: { borderWidth: 1, borderRadius: 17, padding: 14, marginBottom: 10 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18, borderRadius: 20, marginBottom: 12 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  copyBtn: { borderRadius: 9, paddingHorizontal: 10, paddingVertical: 8, flexDirection: 'row', gap: 5, alignItems: 'center' },
  softIcon: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  fake: { height: 46, borderWidth: 1, borderRadius: 12, paddingHorizontal: 11, flexDirection: 'row', alignItems: 'center', gap: 9 },
  upload: { height: 80, borderWidth: 1, borderStyle: 'dashed', borderRadius: 13, alignItems: 'center', justifyContent: 'center', gap: 2 },
  successVisual: { width: 190, height: 150, borderRadius: 38, overflow: 'hidden' },
  successCheck: { position: 'absolute', right: 12, bottom: 12, width: 54, height: 54, borderRadius: 27, backgroundColor: '#16804E', alignItems: 'center', justifyContent: 'center', borderWidth: 5, borderColor: 'rgba(255,255,255,0.82)' },
  overlay: { flex: 1, backgroundColor: 'rgba(10,14,40,0.48)' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 32 },
  handle: { width: 42, height: 4, borderRadius: 5, alignSelf: 'center', marginBottom: 16 },
  sheetClose: { position: 'absolute', right: 18, top: 18 },
  sheetBill: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 15, marginBottom: 8 },
  extRow: { height: 52, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  extIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  paidByChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
});
