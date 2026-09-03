import * as Clipboard from 'expo-clipboard';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowUpRight, Bell, Check, ChevronRight, Copy as CopyIcon, Home, Info, Pencil, Plus,
  ReceiptText, Search, Upload, X,
} from 'lucide-react-native';
import { useEffect, useState, type ReactNode } from 'react';
import { Image, Modal, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { AppHeader, BottomNav, Card, PrimaryButton, ProviderMark, ScreenScroll, SecondaryButton, StatusPill } from '../components/ui';
import { bills as seedBills, images } from '../data';
import type { Copy } from '../i18n';
import { supabase, supabaseSetupMessage } from '../lib/supabase';
import { gradient, type Palette } from '../theme';
import type { Screen } from '../types';

export function BillsScreen({ go, t, c, userId }: { go: (s: Screen) => void; t: Copy; c: Palette; userId: string }) {
  const [filter, setFilter] = useState('All');
  const [query, setQuery] = useState('');
  const [userBills, setUserBills] = useState(seedBills);
  useEffect(() => {
    if (!supabase || !userId || userId === 'demo-user') return;
    void supabase.from('bills').select('provider,category,account_number,due_date,amount,status').eq('user_id', userId).neq('status', 'archived').order('due_date').then(({ data }) => {
      if (!data?.length) return;
      setUserBills(data.map((row) => {
        const provider = String(row.provider).toUpperCase();
        const status = String(row.status).split('_').map((word) => word[0].toUpperCase() + word.slice(1)).join(' ');
        const tone = provider === 'MERALCO' ? 'orange' : provider === 'MAYNILAD' ? 'blue' : provider === 'PLDT' ? 'red' : 'indigo';
        return {
          provider, category: String(row.category), account: String(row.account_number || '').slice(-4),
          due: new Intl.DateTimeFormat('en-PH', { month: 'short', day: 'numeric', year: 'numeric' }).format(new Date(`${row.due_date}T00:00:00`)),
          amount: new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(Number(row.amount)),
          status, tone,
        };
      }));
    });
  }, [userId]);
  const labels: Record<string, string> = { All: t.bills.all, 'Due soon': t.bills.dueSoon, Upcoming: t.bills.upcoming, Paid: t.bills.paid, Overdue: t.bills.overdue };
  const filtered = userBills.filter((b) => (filter === 'All' || b.status === filter) && `${b.provider} ${b.category} ${b.account}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <AppHeader title={t.bills.title} c={c} trailing={
        <Pressable onPress={() => go('add-bill')} style={[styles.accentBtn, { backgroundColor: c.primary }]} accessibilityLabel={t.bills.add}>
          <Plus size={18} color="#fff" />
        </Pressable>
      } />
      <ScreenScroll withNav>
        <Card c={c}>
          <Text style={{ color: c.textMuted, fontSize: 13 }}>{t.bills.stillUnpaid}</Text>
          <Text style={{ color: c.text, fontSize: 34, fontWeight: '800', letterSpacing: -1 }}>₱7,591.00</Text>
          <Text style={{ color: c.textMuted, fontSize: 12 }}>{t.bills.across}</Text>
          <View style={{ flexDirection: 'row', gap: 16, marginTop: 14, paddingTop: 12, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: c.border }}>
            <Text style={{ color: c.text, fontSize: 12 }}>● {t.bills.dueSoonN}</Text>
            <Text style={{ color: c.danger, fontSize: 12 }}>● {t.bills.overdueN}</Text>
          </View>
        </Card>
        <View style={[styles.search, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Search size={15} color={c.textMuted} />
          <TextInput value={query} onChangeText={setQuery} placeholder={t.bills.search} placeholderTextColor={c.textSoft} style={{ flex: 1, color: c.text, height: 42 }} />
        </View>
        <View style={styles.filters}>
          {['All', 'Due soon', 'Upcoming', 'Paid', 'Overdue'].map((f) => (
            <Pressable key={f} onPress={() => setFilter(f)} style={[styles.chip, { backgroundColor: filter === f ? c.primary : c.surface, borderColor: filter === f ? c.primary : c.border }]}>
              <Text style={{ color: filter === f ? '#fff' : c.text, fontSize: 12, fontWeight: '700' }}>{labels[f]}</Text>
            </Pressable>
          ))}
        </View>
        {filtered.length ? filtered.map((b) => (
          <Pressable key={b.provider} onPress={() => go('bill-detail')} style={[styles.billCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 11 }}>
              <ProviderMark tone={b.tone} letter={b.provider[0]} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.text, fontWeight: '800' }}>{b.provider}</Text>
                <Text style={{ color: c.textMuted, fontSize: 12 }}>{b.category} · •••• {b.account}</Text>
              </View>
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
          </Pressable>
        )) : (
          <View style={{ alignItems: 'center', padding: 40 }}>
            <Text style={{ color: c.text, fontSize: 20, fontWeight: '800' }}>{t.empty.caught}</Text>
            <Text style={{ color: c.textMuted, marginVertical: 8 }}>{t.empty.noneDue}</Text>
            <PrimaryButton title={t.empty.add} onPress={() => go('add-bill')} c={c} icon={<Plus size={16} color="#fff" />} />
          </View>
        )}
      </ScreenScroll>
      <BottomNav screen="bills" go={go} c={c} t={t} />
    </View>
  );
}

export function BillDetail({ go, t, c, setPayOpen, userId, demo }: { go: (s: Screen) => void; t: Copy; c: Palette; setPayOpen: (v: boolean) => void; userId: string; demo: boolean }) {
  const [archiving, setArchiving] = useState(false);
  const archive = async () => {
    setArchiving(true);
    if (!demo && supabase) {
      const { data } = await supabase.from('bills').select('id').eq('user_id', userId).eq('provider', 'MERALCO').limit(1).maybeSingle();
      if (data) await supabase.from('bills').update({ status: 'archived' }).eq('id', data.id).eq('user_id', userId);
    }
    setArchiving(false);
    go('bills');
  };
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <AppHeader title={t.bills.details} onBack={() => go('bills')} c={c} trailing={
        <Pressable onPress={() => go('edit-bill')} style={[styles.iconBtn, { backgroundColor: c.surface }]}><Pencil size={16} color={c.text} /></Pressable>
      } />
      <ScreenScroll>
        <View style={[styles.hero, { backgroundColor: c.surface }]}>
          <ProviderMark tone="orange" letter="M" size={46} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.text, fontSize: 18, fontWeight: '800' }}>MERALCO</Text>
            <Text style={{ color: c.textMuted, fontSize: 12 }}>Electricity · Bahay</Text>
          </View>
          <StatusPill status="Due soon" c={c} />
        </View>
        <Card c={c} style={styles.rowBetween}>
          <View>
            <Text style={{ color: c.textMuted, fontSize: 11 }}>{t.bills.account}</Text>
            <Text style={{ color: c.text, fontWeight: '800' }}>1234 5678 9012</Text>
          </View>
          <Pressable onPress={() => void Clipboard.setStringAsync('1234 5678 9012')} style={[styles.copyBtn, { backgroundColor: c.primarySoft }]}>
            <CopyIcon size={13} color={c.primary} /><Text style={{ color: c.primary, fontWeight: '700', fontSize: 12 }}>{t.bills.copy}</Text>
          </Pressable>
        </Card>
        <Card c={c}>
          <Row c={c} label={t.bills.amount} value="₱2,450.36" large />
          <Row c={c} label={t.bills.due} value="Sep 8, 2026" />
          <Row c={c} label={t.bills.period} value="Aug 10 – Sep 10, 2026" />
          <View style={styles.rowBetween}><Text style={{ color: c.textMuted }}>{t.bills.status}</Text><StatusPill status="Due soon" c={c} /></View>
        </Card>
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

export function BillForm({ go, t, c, userId, edit = false }: { go: (s: Screen) => void; t: Copy; c: Palette; userId: string; edit?: boolean }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [account, setAccount] = useState('1234 5678 9012');
  const [alias, setAlias] = useState('Bahay');
  const [amount, setAmount] = useState('2450.36');
  const [due, setDue] = useState('2026-09-08');
  const [period, setPeriod] = useState('Aug 10 – Sep 10, 2026');
  const save = async () => {
    setError('');
    if (userId === 'demo-user') { go('bills'); return; }
    if (!supabase) { setError(supabaseSetupMessage); return; }
    setSaving(true);
    const payload = { user_id: userId, provider: 'MERALCO', category: 'Electricity', account_number: account, alias, amount: Number(amount || 0), due_date: due, billing_period: period, recurrence: 'monthly', reminder_days: 3, status: 'upcoming' };
    let authError;
    if (edit) {
      const { data: existing } = await supabase.from('bills').select('id').eq('user_id', userId).eq('provider', 'MERALCO').limit(1).maybeSingle();
      if (existing) ({ error: authError } = await supabase.from('bills').update(payload).eq('id', existing.id).eq('user_id', userId));
      else ({ error: authError } = await supabase.from('bills').insert(payload));
    } else ({ error: authError } = await supabase.from('bills').insert(payload));
    setSaving(false);
    if (authError) { setError(authError.message); return; }
    await supabase.from('activity_events').insert({ user_id: userId, event_type: edit ? 'bill_updated' : 'bill_added', title: edit ? 'Meralco bill updated' : 'Meralco bill added', amount: payload.amount });
    go('bills');
  };
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <AppHeader title={edit ? t.bills.edit : t.bills.add} onBack={() => go(edit ? 'bill-detail' : 'bills')} c={c} />
      <ScreenScroll>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 16 }}>
          <View style={[styles.softIcon, { backgroundColor: c.primarySoft, width: 44, height: 44, borderRadius: 14 }]}><ReceiptText size={20} color={c.primary} /></View>
          <View>
            <Text style={{ color: c.text, fontWeight: '800', fontSize: 16 }}>{edit ? t.bills.update : t.bills.track}</Text>
            <Text style={{ color: c.textMuted, fontSize: 12 }}>{t.bills.remindBefore}</Text>
          </View>
        </View>
        <Card c={c} style={{ gap: 12 }}>
          {error ? <Text style={{ color: c.danger }}>{error}</Text> : null}
          <Text style={{ color: c.textMuted, fontSize: 12, fontWeight: '700' }}>{t.bills.provider}</Text>
          <View style={[styles.fake, { borderColor: c.border, backgroundColor: c.bg }]}>
            <ProviderMark tone="orange" letter="M" size={28} />
            <Text style={{ flex: 1, color: c.text }}>MERALCO</Text>
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

export function MarkPaid({ go, t, c, userId }: { go: (s: Screen) => void; t: Copy; c: Palette; userId: string }) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [method, setMethod] = useState('GCash');
  const [reference, setReference] = useState('');
  const save = async () => {
    setError('');
    if (userId === 'demo-user') { go('success'); return; }
    if (!supabase) { setError(supabaseSetupMessage); return; }
    setSaving(true);
    const { data: bill, error: lookupError } = await supabase.from('bills').select('id').eq('user_id', userId).eq('provider', 'MERALCO').limit(1).maybeSingle();
    if (lookupError || !bill) { setSaving(false); setError(lookupError?.message || 'Add the Meralco bill before recording it as paid.'); return; }
    const { error: updateError } = await supabase.from('bills').update({ status: 'paid', paid_at: new Date().toISOString(), payment_method: method, reference_number: reference }).eq('id', bill.id).eq('user_id', userId);
    if (!updateError) await supabase.from('activity_events').insert({ user_id: userId, bill_id: bill.id, event_type: 'bill_marked_paid', title: 'Meralco marked paid', amount: 2450.36 });
    setSaving(false);
    if (updateError) { setError(updateError.message); return; }
    go('success');
  };
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <AppHeader title={t.bills.markTitle} onBack={() => go('bill-detail')} c={c} />
      <ScreenScroll>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 }}>
          <ProviderMark tone="orange" letter="M" />
          <View style={{ flex: 1 }}><Text style={{ color: c.text, fontWeight: '800' }}>MERALCO</Text><Text style={{ color: c.textMuted, fontSize: 12 }}>{t.bills.amount}</Text></View>
          <Text style={{ color: c.text, fontSize: 18, fontWeight: '800' }}>₱2,450.36</Text>
        </View>
        <Card c={c} style={{ gap: 12 }}>
          {error ? <Text style={{ color: c.danger }}>{error}</Text> : null}
          <Labeled c={c} label={t.bills.amount} value="₱ 2,450.36" editable={false} />
          <Labeled c={c} label={t.bills.datePaid} value="2026-09-02" editable={false} />
          <Text style={{ color: c.textMuted, fontSize: 12, fontWeight: '700' }}>{t.bills.method}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {['GCash', 'Maya', 'Bank', 'Cash'].map((m) => (
              <Pressable key={m} onPress={() => setMethod(m)} style={[styles.chip, { backgroundColor: method === m ? c.primary : c.bg, borderColor: method === m ? c.primary : c.border }]}>
                <Text style={{ color: method === m ? '#fff' : c.text, fontWeight: '700', fontSize: 12 }}>{m}</Text>
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
          <Row c={c} label={t.bills.datePaid} value="Sep 2, 2026" />
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
        <View style={styles.handle} />
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
    <View style={{ gap: 6 }}>
      <Text style={{ color: c.textMuted, fontSize: 12, fontWeight: '700' }}>{label}</Text>
      <TextInput editable={editable} value={value} onChangeText={onChange} keyboardType={keyboardType} style={[styles.input, { color: c.text, backgroundColor: c.bg, borderColor: c.border }]} />
    </View>
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
  input: { height: 46, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12, fontSize: 14 },
  upload: { height: 80, borderWidth: 1, borderStyle: 'dashed', borderRadius: 13, alignItems: 'center', justifyContent: 'center', gap: 2 },
  successVisual: { width: 190, height: 150, borderRadius: 38, overflow: 'hidden' },
  successCheck: { position: 'absolute', right: 12, bottom: 12, width: 54, height: 54, borderRadius: 27, backgroundColor: '#16804E', alignItems: 'center', justifyContent: 'center', borderWidth: 5, borderColor: 'rgba(255,255,255,0.82)' },
  overlay: { flex: 1, backgroundColor: 'rgba(10,14,40,0.48)' },
  sheet: { position: 'absolute', left: 0, right: 0, bottom: 0, borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 20, paddingBottom: 32 },
  handle: { width: 42, height: 4, borderRadius: 5, backgroundColor: '#DFE2EC', alignSelf: 'center', marginBottom: 16 },
  sheetClose: { position: 'absolute', right: 18, top: 18 },
  sheetBill: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 15, marginBottom: 8 },
  extRow: { height: 52, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  extIcon: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
});
