import { SuccessArt } from '../components/Artwork';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { validAmount, validDate, localDateKey } from '../services/bill-rules';
import { openPaymentDestination, providerUrl } from '../services/external';
import { useBills } from '../services/bill-context';
import * as Clipboard from 'expo-clipboard';
import { chooseReceipt, uploadReceipt, receiptUrl, type Receipt } from '../services/receipts';
import { Linking } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Archive, MoreHorizontal, ReceiptText, Globe, ArrowUpRight, Bell, Check, ChevronRight, Copy as CopyIcon, Home, Info, Pencil, Plus,
  Search, Upload, Users, X,
} from 'lucide-react-native';
import { useEffect, useState, useRef, useCallback, type ReactNode } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withSpring, withTiming } from 'react-native-reanimated';
import { AppHeader, BottomNav, Card, CinematicHero, Field, PrimaryButton, ProviderMark, ScreenScroll, SecondaryButton, StatusPill, DataState, InfoBanner } from '../components/ui';
import { images, billServices, type BillService, type ServiceProvider } from '../data';
import type { Copy } from '../i18n';
import { supabase, supabaseSetupMessage } from '../lib/supabase';
import { useRealtimeBills } from '../services/realtime';
import { fetchHouseholdBills, formatBillDisplay, markBillPaid, createBillActivityEvent, type DbBill } from '../services/household';
import { fetchHouseholdUsers, type HouseholdUser } from '../services/households';
import { createNotification, checkAndCreateDueDateReminders } from '../services/notifications';
import { gradient, type Palette } from '../theme';
import type { BillFilter, Screen } from '../types';

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

export function BillsScreen({ go, t, c, userId, householdId, initialFilter = 'All' }: { go: (s: Screen) => void; t: Copy; c: Palette; userId: string; householdId: string; initialFilter?: BillFilter }) {
  const [filter, setFilter] = useState<string>(initialFilter);
  const [query, setQuery] = useState('');
  const { bills, loading, error, selectBill } = useBills();
  const userBills = bills.map(formatBillDisplay);

  const labels: Record<string, string> = { All: t.bills.all, 'Due soon': t.bills.dueSoon, Upcoming: t.bills.upcoming, Paid: t.bills.paid, Overdue: t.bills.overdue };
  const displayBills = userBills;
  const filtered = displayBills.filter((b) => (filter === 'All' || b.status === filter) && `${b.provider} ${b.category} ${b.account}`.toLowerCase().includes(query.toLowerCase()));

  const unpaidTotal = userBills.filter((b) => !['Paid', 'paid'].includes(b.status)).reduce((sum, b) => sum + b.rawAmount, 0);
  const unpaidCount = userBills.filter((b) => !['Paid', 'paid'].includes(b.status)).length;
  const dueSoonCount = userBills.filter((b) => b.status === 'Due soon').length;
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
          <Text style={{ color: c.text, fontSize: 30, fontWeight: '600', letterSpacing: -0.8, marginTop: 4 }}>
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
        {loading ? <DataState c={c} loading title="Loading your bills" /> : error ? null : filtered.length ? filtered.map((b, i) => (
          <PressRow key={b.id || i} onPress={() => { selectBill(b.id); go('bill-detail'); }} style={[styles.billCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
              <ProviderMark tone={b.tone} letter={b.provider[0]} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.text, fontWeight: '600', fontSize: 15 }}>{b.provider}</Text>
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
                <Text style={{ color: c.text, fontWeight: '600' }}>{b.due}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text style={{ color: c.text, fontSize: 16, fontWeight: '600' }}>{b.amount}</Text>
                <StatusPill status={b.status} c={c} />
              </View>
            </View>
          </PressRow>
        )) : (
          <View style={{ alignItems: 'center', padding: 40 }}>
            <Text style={{ color: c.text, fontSize: 20, fontWeight: '600' }}>{query || filter !== 'All' ? 'No matching bills' : 'Your first bill starts here'}</Text>
            <Text style={{ color: c.textMuted, marginVertical: 8, fontSize: 14, lineHeight: 20, textAlign: 'center' }}>{query || filter !== 'All' ? 'Try another search or filter.' : 'Keep due dates, reminders, and payment records together.'}</Text>
            <PrimaryButton title={t.empty.add} onPress={() => go('add-bill')} c={c} icon={<Plus size={16} color="#fff" />} />
          </View>
        )}
      </ScreenScroll>
      <BottomNav screen="bills" go={go} c={c} t={t} />
    </View>
  );
}

export function BillDetail({ go, t, c, setPayOpen, userId, householdId }: { go: (s: Screen) => void; t: Copy; c: Palette; setPayOpen: (v: boolean) => void; userId: string; householdId: string }) {
  const { selected, loading, refresh } = useBills();
  const [archiving, setArchiving] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);
  const bill = selected ? formatBillDisplay(selected) : null;
  const archive = async () => {
    if (!supabase || !selected || archiving) return;
    setArchiving(true); setError('');
    const { error } = await supabase.from('bills').update({ status: 'archived' }).eq('id', selected.id).eq('household_id', householdId).select('id').single();
    setArchiving(false);
    if (error) { setError(error.message); return; }
    await refresh(); go('bills');
  };
  const toggleReminder = async (value: boolean) => {
    if (!supabase || !selected) return;
    const { error } = await supabase.from('bills').update({ reminder_days: value ? 5 : 0 }).eq('id', selected.id).eq('household_id', householdId).select('id').single();
    if (error) setError(error.message); else await refresh();
  };
  if (!bill || !selected) return <View style={{ flex: 1, backgroundColor: c.bg }}><AppHeader title={t.bills.details} onBack={() => go('bills')} c={c} /><DataState c={c} loading={loading} title="Choose a household bill" body="Open a bill from your list to see its details." action={() => go('bills')} actionLabel="View bills" /></View>;
  const display = bill;
  return <View style={{ flex: 1, backgroundColor: c.bg }}>
    <AppHeader title={t.bills.details} onBack={() => go('bills')} c={c} trailing={<Pressable accessibilityRole="button" accessibilityLabel="Edit bill options" onPress={() => go('edit-bill')} style={styles.iconBtn}><MoreHorizontal size={23} color={c.text} /></Pressable>} />
    <ScreenScroll>
      {error ? <InfoBanner c={c} tone="danger">{error}</InfoBanner> : null}
      <Card c={c} style={{ gap: 22, marginBottom: 18, padding: 18 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 15 }}>
          <View style={{ alignItems: 'center', width: 60 }}><ProviderMark tone={display.tone} letter={display.provider[0]} size={52} /><Text numberOfLines={1} style={{ color: c.text, fontSize: 8, marginTop: 3 }}>{display.provider.toUpperCase()}</Text></View>
          <View style={{ flex: 1 }}><Text style={{ color: c.text, fontSize: 17, fontWeight: '600' }}>{display.provider.toUpperCase()}</Text><Text style={{ color: c.text, fontSize: 14, marginTop: 6 }}>{display.category}</Text></View>
          <Pressable accessibilityRole="button" onPress={() => go('edit-bill')} style={{ backgroundColor: c.primarySoft, borderRadius: 12, paddingHorizontal: 12, paddingVertical: 9 }}><Text style={{ color: c.primary, fontSize: 12 }}>Change</Text></Pressable>
        </View>
        <View style={{ gap: 8 }}><Text style={{ color: c.textMuted, fontSize: 12 }}>{t.bills.account}</Text><View style={[styles.fake, { borderColor: c.border }]}><Text selectable style={{ flex: 1, color: c.text, fontSize: 15 }}>{selected.account_number || 'No account number'}</Text><Pressable accessibilityRole="button" accessibilityLabel="Copy account number" onPress={() => void Clipboard.setStringAsync(selected.account_number || '').then(() => setCopied(true)).catch(() => setError('Could not copy account details.'))} style={{ padding: 6 }}>{copied ? <Check size={16} color={c.success} /> : <CopyIcon size={16} color={c.textSoft} />}</Pressable></View></View>
        <View style={{ gap: 8 }}><Text style={{ color: c.textMuted, fontSize: 12 }}>Alias (optional)</Text><View style={[styles.fake, { borderColor: c.border }]}><Text style={{ color: c.text, fontSize: 15 }}>{selected.alias || '—'}</Text></View></View>
      </Card>
      <Card c={c} style={{ marginBottom: 19, paddingHorizontal: 17, paddingVertical: 9 }}>
        <Row c={c} label={t.bills.amount} value={display.amount} large />
        <Row c={c} label={t.bills.due} value={display.due} />
        <View style={{ alignItems: 'flex-end', marginBottom: 6 }}><StatusPill status={display.status} c={c} /></View>
        <Row c={c} label={t.bills.period} value={display.billingPeriod || '—'} />
        <Row c={c} label="Repeat" value={selected.recurrence.charAt(0).toUpperCase() + selected.recurrence.slice(1)} />
        <View style={[styles.rowBetween, { paddingVertical: 13, gap: 10 }]}><Text style={{ color: c.textMuted, fontSize: 12 }}>Reminder</Text><Pressable accessibilityRole="switch" accessibilityState={{ checked: selected.reminder_days > 0 }} accessibilityLabel="Toggle bill reminder" onPress={() => void toggleReminder(selected.reminder_days === 0)}><Text style={{ color: c.text, fontSize: 14 }}>{selected.reminder_days > 0 ? selected.reminder_days + ' days before' : 'Off'}</Text></Pressable></View>
      </Card>
      {display.paidBy || display.paymentMethod ? <Card c={c} style={{ marginBottom: 16 }}>{display.paidBy && <Row c={c} label="Paid by" value={display.paidBy} />}{display.paymentMethod && <Row c={c} label={t.bills.method} value={display.paymentMethod} />}{display.referenceNumber && <Row c={c} label={t.bills.reference} value={display.referenceNumber} />}</Card> : null}
      {selected.receipt_path ? <SecondaryButton title="View receipt" c={c} onPress={() => void receiptUrl(selected.receipt_path!).then(url => Linking.openURL(url)).catch(e => setError(e.message))} /> : null}
      <Card c={c} onPress={() => { if (!['paid', 'archived'].includes(selected.status)) setPayOpen(true); }} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, padding: 15, marginBottom: 16 }}>
        <LinearGradient colors={[...gradient.button]} style={{ width: 29, height: 32, borderRadius: 7, alignItems: 'center', justifyContent: 'center' }}><ReceiptText size={22} color="#FFFFFF" /></LinearGradient>
        <View style={{ flex: 1 }}><Text style={{ color: c.primary, fontSize: 14, fontWeight: '500' }}>{t.bills.payOutside}</Text><Text style={{ color: c.textMuted, fontSize: 10, marginTop: 5 }}>Bayarin does not process payments.</Text></View><ChevronRight size={20} color={c.text} />
      </Card>
      <PrimaryButton disabled={['paid', 'archived'].includes(selected.status)} title={selected.status === 'paid' ? 'Recorded as paid' : selected.status === 'archived' ? 'Archived' : t.bills.markPaid} onPress={() => go('mark-paid')} c={c} />
      <View style={{ flexDirection: 'row', gap: 12, marginTop: 18 }}><View style={{ flex: 1 }}><SecondaryButton title={t.bills.edit} onPress={() => go('edit-bill')} c={c} icon={<Pencil size={17} color={c.textMuted} />} /></View><View style={{ flex: 1 }}><SecondaryButton title={archiving ? t.bills.archiving : t.bills.archive} onPress={() => void archive()} c={c} icon={<Archive size={17} color={c.textMuted} />} /></View></View>
    </ScreenScroll>
  </View>;
}

export function BillForm({ go, t, c, userId, householdId, service, provider, edit = false }: { go: (s: Screen) => void; t: Copy; c: Palette; userId: string; householdId: string; service: BillService; provider: ServiceProvider; edit?: boolean }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const { selected, refresh } = useBills();
  const initialService = edit && selected ? Object.values(billServices).find(item => item.name === selected.category) || { ...billServices.other, name: selected.category } : service;
  const initialProvider = edit && selected ? initialService.providers.find(item => item.name.toLowerCase() === selected.provider.toLowerCase()) || { id: 'existing', name: selected.provider, mark: selected.provider.charAt(0), tone: formatBillDisplay(selected).tone, detail: selected.category } : provider;
  const [chosenService, setChosenService] = useState(initialService);
  const [chosenProvider, setChosenProvider] = useState(initialProvider);
  const [providerPicker, setProviderPicker] = useState(!edit);
  const [customProvider, setCustomProvider] = useState('');
  const custom = chosenProvider.name.startsWith('Other');
  const [recurrence, setRecurrence] = useState(edit ? selected?.recurrence || 'monthly' : 'monthly');
  const [reminderDays, setReminderDays] = useState(edit ? selected?.reminder_days ?? 5 : 5);
  const [account, setAccount] = useState(edit ? selected?.account_number || '' : '');
  const [alias, setAlias] = useState(edit ? String(selected?.alias ?? '') : '');
  const [amount, setAmount] = useState(edit ? String(selected?.amount ?? '') : '');
  const [due, setDue] = useState(edit ? String(selected?.due_date ?? '') : '');
  const [period, setPeriod] = useState(edit ? String(selected?.billing_period ?? '') : '');
  const save = async () => {
    if (saving) return;
    setError('');
    if (!supabase) { setError(supabaseSetupMessage); return; }
    if (!householdId || (edit && !selected)) { setError('Select a household bill first.'); return; }
    if (!account.trim() || !validAmount(amount) || !validDate(due)) { setError('Enter an account number, a positive amount with up to two decimals, and a real date (YYYY-MM-DD).'); return; }
    if (custom && !customProvider.trim()) { setError('Enter your provider’s name.'); return; }
    setSaving(true);
    try {
      const payload = { provider: custom ? customProvider.trim() : chosenProvider.name, category: chosenService.name, account_number: account.trim(), alias: alias.trim() || null, amount: Number(amount), due_date: due, billing_period: period.trim() || null, recurrence, reminder_days: reminderDays };
      const result = edit
        ? await supabase.from('bills').update(payload).eq('id', selected!.id).eq('household_id', householdId).select('id').single()
        : await supabase.from('bills').insert({ ...payload, user_id: userId, household_id: householdId, status: 'upcoming' }).select('id').single();
      if (result.error) throw new Error(result.error.message);
      await refresh(); go('bills');
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not save this bill.'); }
    finally { setSaving(false); }
  };
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <AppHeader title={edit ? t.bills.edit : t.bills.add} onBack={() => go(edit ? 'bill-detail' : 'bills')} c={c} />
      <ScreenScroll>
        <CinematicHero pose="services" height={150} c={c} title={edit ? t.bills.update : t.bills.track} subtitle={t.bills.remindBefore} />
        <Card c={c} style={{ gap: 12 }}>
          {error ? <Text style={{ color: c.danger }}>{error}</Text> : null}
          <Text style={{ color: c.textMuted, fontSize: 12, fontWeight: '700' }}>{t.bills.provider}</Text>
          <Pressable accessibilityRole="button" accessibilityLabel="Change bill provider" onPress={() => setProviderPicker(value => !value)} style={[styles.fake, { borderColor: c.border, backgroundColor: c.bg }]}>
            <ProviderMark tone={chosenProvider.tone} letter={chosenProvider.mark} size={28} />
            <View style={{ flex: 1 }}><Text style={{ color: c.text, fontWeight: '600' }}>{chosenProvider.name}</Text><Text style={{ color: c.textMuted, fontSize: 11 }}>{chosenService.name}</Text></View>
            <ChevronRight size={14} color={c.textMuted} />
          </Pressable>
          {providerPicker && <><Text style={{ color: c.textMuted }}>Category</Text><View style={styles.filters}>{Object.values(billServices).map(item => <Pressable accessibilityRole="button" key={item.id} onPress={() => { setChosenService(item); setChosenProvider(item.providers[0]); }} style={[styles.chip, { backgroundColor: chosenService.id === item.id ? c.primarySoft : c.bg, borderColor: c.border }]}><Text style={{ color: c.text }}>{item.name}</Text></Pressable>)}</View><View style={styles.filters}>{chosenService.providers.map(item => <Pressable accessibilityRole="button" key={item.id} onPress={() => { setChosenProvider(item); setProviderPicker(false); }} style={[styles.chip, { backgroundColor: chosenProvider.id === item.id ? c.primarySoft : c.bg, borderColor: c.border }]}><Text style={{ color: c.text }}>{item.name}</Text></Pressable>)}</View></>}
          {custom && <Labeled c={c} label="Provider name" value={customProvider} onChange={setCustomProvider} />}
          <Labeled c={c} label={t.bills.account} value={account} onChange={setAccount} />
          <Labeled c={c} label={`${t.bills.alias} ${t.bills.optional}`} value={alias} onChange={setAlias} />
          <View style={{ flexDirection: 'row', gap: 10 }}>
            <View style={{ flex: 1 }}><Labeled c={c} label={t.bills.amount} value={amount} onChange={setAmount} keyboardType="decimal-pad" /></View>
            <View style={{ flex: 1 }}><Labeled c={c} label={t.bills.due} value={due} onChange={setDue} /></View>
          </View>
          <Labeled c={c} label={`${t.bills.period} ${t.bills.optional}`} value={period} onChange={setPeriod} />
          <Text style={{ color: c.textMuted }}>Repeats</Text><View style={styles.filters}>{['once', 'weekly', 'monthly', 'yearly'].map(value => <Pressable key={value} onPress={() => setRecurrence(value)} style={[styles.chip, { backgroundColor: recurrence === value ? c.primarySoft : c.bg, borderColor: c.border }]}><Text style={{ color: c.text }}>{value}</Text></Pressable>)}</View>
          <Text style={{ color: c.textMuted }}>Remind me before the due date</Text><View style={styles.filters}>{[0, 1, 3, 5, 7].map(value => <Pressable key={value} onPress={() => setReminderDays(value)} style={[styles.chip, { backgroundColor: reminderDays === value ? c.primarySoft : c.bg, borderColor: c.border }]}><Text style={{ color: c.text }}>{value ? value + (value === 1 ? ' day' : ' days') : 'Off'}</Text></Pressable>)}</View>
          <PrimaryButton disabled={edit && !selected} title={saving ? t.bills.saving : edit ? t.bills.saveChanges : t.bills.save} loading={saving} onPress={() => void save()} c={c} icon={<Check size={16} color="#fff" />} />
        </Card>
      </ScreenScroll>
    </View>
  );
}

export function MarkPaid({ go, t, c, userId, householdId }: { go: (s: Screen) => void; t: Copy; c: Palette; userId: string; householdId: string }) {
  const savingRef = useRef(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [method, setMethod] = useState('GCash');
  const [reference, setReference] = useState('');
  const [receipt, setReceipt] = useState<Receipt | null>(null);
  const [selectedMember, setSelectedMember] = useState('');
  const [members, setMembers] = useState<HouseholdUser[]>([]);
  const { selected, refresh } = useBills();
  const billId = selected?.id;
  const display = selected ? formatBillDisplay(selected) : null;

  useEffect(() => {
    if (!supabase || !householdId) return;
    void fetchHouseholdUsers(householdId).then(setMembers).catch(e => setError(e.message));

  }, [householdId]);

  const save = async () => {
    if (savingRef.current) return;
    setError('');
    if (!supabase) { setError(supabaseSetupMessage); return; }
    if (!billId || !householdId || !selected || ['paid', 'archived'].includes(selected.status)) { setError('Choose an unpaid bill to record a payment.'); return; }
    savingRef.current = true;
    setSaving(true);
    let uploaded: string | undefined;
    try {
      const paidBy = selectedMember || members.find(m => m.user_id === userId)?.profile?.full_name || 'Household member';
      if (receipt) uploaded = await uploadReceipt(receipt, householdId, billId);
      await markBillPaid(billId, householdId, method, reference, paidBy, uploaded);
      await refresh();
      setSaving(false);
      go('success');
    } catch (err) {
      if (uploaded) await supabase.storage.from('receipts').remove([uploaded]);
      setSaving(false);
      setError(err instanceof Error ? err.message : 'Failed to record payment');
    } finally {
      savingRef.current = false;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <AppHeader title={t.bills.markTitle} onBack={() => go('bill-detail')} c={c} />
      <ScreenScroll>
        <CinematicHero pose="bills" height={140} c={c} title={t.bills.markTitle} subtitle="Keep your shared household record up to date." />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 }}>
          <ProviderMark tone={display?.tone || 'indigo'} letter={display?.provider.charAt(0) || 'B'} />
          <View style={{ flex: 1 }}><Text style={{ color: c.text, fontWeight: '600' }}>{display?.provider || 'Select a bill'}</Text><Text style={{ color: c.textMuted, fontSize: 12 }}>{t.bills.amount}</Text></View>
          <Text style={{ color: c.text, fontSize: 18, fontWeight: '600' }}>{display?.amount || '—'}</Text>
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
          <Labeled c={c} label={t.bills.amount} value={display?.amount || '—'} editable={false} />
          <Labeled c={c} label={t.bills.datePaid} value={localDateKey()} editable={false} />
          <Text style={{ color: c.textMuted, fontSize: 12, fontWeight: '700' }}>{t.bills.method}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {['GCash', 'Maya', 'Bank', 'Cash'].map((m) => (
              <Pressable key={m} onPress={() => setMethod(m)} style={[styles.chip, { backgroundColor: method === m ? c.primary : c.bg, borderColor: method === m ? c.primary : c.border }]}>
                <Text style={{ color: method === m ? c.onPrimary : c.text, fontWeight: '700', fontSize: 12 }}>{m}</Text>
              </Pressable>
            ))}
          </View>
          <Labeled c={c} label={`${t.bills.reference} ${t.bills.optional}`} value={reference} onChange={setReference} />
          <SecondaryButton c={c} title={receipt ? `Receipt: ${receipt.name}` : 'Attach receipt (optional)'} icon={<Upload size={17} color={c.primary} />} onPress={() => void chooseReceipt().then(file => { if (file) setReceipt(file); }).catch(e => setError(e.message))} />
          {receipt ? <Pressable accessibilityRole="button" onPress={() => setReceipt(null)}><Text style={{ color: c.danger }}>Remove attachment</Text></Pressable> : <Text style={{ color: c.textMuted, fontSize: 12 }}>JPG, PNG, or PDF · up to 10 MB · shared only with your household</Text>}
          <PrimaryButton disabled={!selected || selected.status === 'paid'} title={saving ? t.bills.recording : t.bills.confirmPaid} loading={saving} onPress={() => void save()} c={c} icon={<Check size={16} color="#fff" />} />
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
  const { selected } = useBills();
  const display = selected ? formatBillDisplay(selected) : null;
  const paidDate = selected?.paid_at ? new Date(selected.paid_at) : null;
  const details = [['Amount', display?.amount || '—'], ['Provider', display?.provider.toUpperCase() || '—'], ['Date paid', paidDate ? new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(paidDate) : '—'], ['Payment method', selected?.payment_method || '—'], ['Reference No.', selected?.reference_number || '—']];
  return <View style={{ flex: 1, backgroundColor: c.bg }}><ScreenScroll>
    <View style={{ alignItems: 'center', paddingTop: 20 }}><SuccessArt size={165} /><Text style={{ color: c.text, fontSize: 24, fontWeight: '600', marginTop: 8 }}>{t.bills.recorded}</Text><Text style={{ color: c.textMuted, textAlign: 'center', maxWidth: 265, fontSize: 13, lineHeight: 20, marginTop: 8 }}>{t.bills.recordedBody}</Text></View>
    <Card c={c} style={{ marginTop: 22, gap: 13 }}>{details.map(([label, value], i) => <View key={label}><Text style={{ color: c.textMuted, fontSize: 11, marginBottom: 5 }}>{label}</Text><Text selectable style={{ color: c.text, fontSize: i === 0 ? 24 : 14, fontWeight: i === 0 ? '600' : '500' }}>{value}</Text></View>)}</Card>
    <View style={{ gap: 10, marginTop: 15 }}><SecondaryButton title={t.bills.viewBill} onPress={() => go('bill-detail')} c={c} /><PrimaryButton title={t.bills.backHome} onPress={() => go('home')} c={c} /></View>
  </ScreenScroll></View>;
}

export function PaySheets({
  payOpen, setPayOpen, returnOpen, setReturnOpen, go, t, c,
}: {
  payOpen: boolean; setPayOpen: (v: boolean) => void; returnOpen: boolean; setReturnOpen: (v: boolean) => void;
  go: (s: Screen) => void; t: Copy; c: Palette;
}) {
  const [copied, setCopied] = useState(false);
  const { selected } = useBills();
  const display = selected ? formatBillDisplay(selected) : null;
  const [error, setError] = useState('');
  const choose = async (method: string) => {
    if (!selected) return;
    setError('');
    try { await openPaymentDestination(method, selected.provider); setPayOpen(false); setReturnOpen(true); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not open this payment destination.'); }
  };
  const copy = async () => {
    if (!selected || !display) return;
    await Clipboard.setStringAsync(`${selected.provider} · Account ${selected.account_number || '—'} · ${display.amount} · Due ${display.due}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1600);
  };
  return (
    <>
      <Sheet visible={payOpen} onClose={() => setPayOpen(false)} c={c} title={t.pay.title} body={t.pay.body}>
        <Card c={c} style={{ marginBottom: 15, padding: 15 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}><ProviderMark tone={display?.tone || 'indigo'} letter={display?.provider.charAt(0) || 'B'} size={38} /><View><Text style={{ color: c.text, fontWeight: '600', fontSize: 14 }}>{display?.provider || 'Select a bill'}</Text><Text style={{ color: c.textMuted, fontSize: 12, marginTop: 3 }}>{display?.category || 'Household bill'}</Text></View></View>
          <View style={{ gap: 13 }}><View style={styles.rowBetween}><Text style={{ color: c.textMuted, fontSize: 12 }}>Account</Text><Text style={{ color: c.text, fontSize: 12 }}>•••• {display?.account || '—'}</Text></View><View style={styles.rowBetween}><Text style={{ color: c.textMuted, fontSize: 12 }}>Amount</Text><Text style={{ color: c.text, fontSize: 15, fontWeight: '600' }}>{display?.amount || '—'}</Text></View><View style={styles.rowBetween}><Text style={{ color: c.textMuted, fontSize: 12 }}>Due Date</Text><Text style={{ color: c.text, fontSize: 12 }}>{display?.due || '—'}</Text></View></View>
        </Card>
        {[
          { label: t.pay.gcash, color: '#1776E8', mark: 'G', action: () => void choose('GCash') },
          { label: t.pay.maya, color: '#101513', mark: 'M', action: () => void choose('Maya') },
          { label: t.pay.web, color: '#5C5852', mark: 'W', action: () => void choose('Provider') },
          { label: copied ? t.pay.copied : t.pay.copy, color: '#264BD6', mark: 'C', action: () => void copy().catch(() => setError('Could not copy payment details.')) },
        ].map((row) => (
          <Pressable key={row.label} accessibilityRole="button" accessibilityLabel={row.label} onPress={row.action} style={[styles.extRow, { backgroundColor: c.surface, borderColor: c.border }]}>
            <View style={[styles.extIcon, { backgroundColor: ['W', 'C'].includes(row.mark) ? 'transparent' : row.color }]}>{row.mark === 'W' ? <Globe size={25} color={c.textMuted} /> : row.mark === 'C' ? <CopyIcon size={24} color={c.textMuted} /> : <Text style={{ color: row.mark === 'M' ? '#53EE8B' : '#FFFFFF', fontSize: 22, fontWeight: '700' }}>{row.mark === 'M' ? 'm' : 'G'}</Text>}</View>
            <Text style={{ flex: 1, color: c.text, fontWeight: '600' }}>{row.label}</Text>
            <ChevronRight size={18} color={c.textMuted} />
          </Pressable>
        ))}
        {error ? <InfoBanner c={c} tone="danger">{error}</InfoBanner> : null}<View style={{ marginTop: 16 }}><InfoBanner c={c} icon={<Info size={18} color={c.primary} />}>{t.pay.footer}</InfoBanner></View>
      </Sheet>
      <Sheet companion visible={returnOpen} onClose={() => setReturnOpen(false)} c={c} title={t.pay.finished} body={t.pay.finishedBody}>
        <Card c={c} style={{ marginBottom: 15, padding: 15 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 12 }}><ProviderMark tone={display?.tone || 'indigo'} letter={display?.provider.charAt(0) || 'B'} size={38} /><View><Text style={{ color: c.text, fontWeight: '600', fontSize: 14 }}>{display?.provider || 'Select a bill'}</Text><Text style={{ color: c.textMuted, fontSize: 12, marginTop: 3 }}>{display?.category || 'Household bill'}</Text></View></View>
          <View style={{ gap: 13 }}><View style={styles.rowBetween}><Text style={{ color: c.textMuted, fontSize: 12 }}>Account</Text><Text style={{ color: c.text, fontSize: 12 }}>•••• {display?.account || '—'}</Text></View><View style={styles.rowBetween}><Text style={{ color: c.textMuted, fontSize: 12 }}>Amount</Text><Text style={{ color: c.text, fontSize: 15, fontWeight: '600' }}>{display?.amount || '—'}</Text></View><View style={styles.rowBetween}><Text style={{ color: c.textMuted, fontSize: 12 }}>Due Date</Text><Text style={{ color: c.text, fontSize: 12 }}>{display?.due || '—'}</Text></View></View>
        </Card>
        <PrimaryButton title={t.pay.yes} onPress={() => { setReturnOpen(false); go('mark-paid'); }} c={c} icon={<Check size={16} color="#fff" />} />
        <View style={{ height: 8 }} />
        <SecondaryButton title={t.pay.notYet} onPress={() => setReturnOpen(false)} c={c} />
      </Sheet>
    </>
  );
}

function Sheet({ visible, onClose, c, title, body, children, companion = false }: { visible: boolean; onClose: () => void; c: Palette; title: string; body: string; children: ReactNode; companion?: boolean }) {
  const insets = useSafeAreaInsets();
  return <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: insets.top, paddingBottom: insets.bottom, backgroundColor: c.overlay }}>
      <Pressable accessibilityLabel="Dismiss payment sheet" style={StyleSheet.absoluteFill} onPress={onClose} />
      <View style={{ width: '100%', maxWidth: 420, maxHeight: '96%', borderRadius: 28, backgroundColor: c.bg, overflow: 'hidden' }}>
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 20, paddingTop: 30, paddingBottom: 28 }}>
          <Pressable accessibilityRole="button" accessibilityLabel="Close payment options" onPress={onClose} style={{ position: 'absolute', right: 12, top: 14, width: 36, height: 36, alignItems: 'center', justifyContent: 'center', zIndex: 2 }}><X size={21} color={c.text} /></Pressable>
          {companion && <Image source={images.avatar} resizeMode="contain" style={{ height: 180, width: 200, alignSelf: 'center', marginBottom: 12 }} />}
          <Text style={{ color: c.text, fontSize: companion ? 22 : 18, fontWeight: '600', letterSpacing: -.4, textAlign: companion ? 'center' : 'left', paddingRight: companion ? 0 : 24 }}>{title}</Text>
          <Text style={{ color: c.textMuted, fontSize: 12, lineHeight: 18, marginTop: 10, marginBottom: 20, textAlign: companion ? 'center' : 'left' }}>{body}</Text>
          {children}
        </ScrollView>
      </View>
    </View>
  </Modal>;
}

function Row({ c, label, value, large, last }: { c: Palette; label: string; value: string; large?: boolean; last?: boolean }) {
  return (
    <View style={[styles.rowBetween, { paddingVertical: 14, gap: 16 }]}>
      <Text style={{ color: c.textMuted, fontSize: 12 }}>{label}</Text>
      <Text style={{ color: c.text, fontWeight: large ? '600' : '400', textAlign: 'right', flexShrink: 1, fontSize: large ? 19 : 14 }}>{value}</Text>
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
  sheet: { position: 'absolute', alignSelf: 'center', width: '100%', maxWidth: 560, maxHeight: '90%', bottom: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 32 },
  handle: { width: 42, height: 4, borderRadius: 5, alignSelf: 'center', marginBottom: 16 },
  sheetClose: { position: 'absolute', right: 18, top: 18 },
  sheetBill: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 15, marginBottom: 8 },
  extRow: { minHeight: 52, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 1, paddingHorizontal: 12, borderRadius: 14, marginBottom: 5 },
  extIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  paidByChip: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999 },
});
