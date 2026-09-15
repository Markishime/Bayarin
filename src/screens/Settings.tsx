import * as Clipboard from 'expo-clipboard';
import { Benefits } from '../components/Benefits';
import { checkAndCreateDueDateReminders } from '../services/notifications';
import { useRealtimeHouseholdMembers } from '../services/realtime';
import { registerForPushNotifications, scheduleAllDueReminders } from '../services/push';
import { useBills } from '../services/bill-context';
import { openPaymentDestination } from '../services/external';
import * as Sharing from 'expo-sharing';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Bell, Check, CheckCircle2, ChevronRight, CreditCard, Download, Film, History, Info,
  Languages, LogOut, Moon, Pencil, Play, ShieldCheck, Sun, Users, X,
} from 'lucide-react-native';
import { useEffect, useState, type ReactNode } from 'react';
import { Image, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { AppHeader, BottomNav, BrandLogo, Card, CinematicHero, Field, InfoBanner, PrefSwitch, PrimaryButton, ScreenScroll } from '../components/ui';
import { images } from '../data';
import { languageOptions, type Copy } from '../i18n';
import { supabase } from '../lib/supabase';
import { createHousehold, fetchHouseholdUsers, joinHousehold, removeHouseholdUser, type Household, type HouseholdUser } from '../services/households';
import { gradient, type Palette } from '../theme';
import type { Lang, OnboardingDraft, Screen } from '../types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function SettingsScreen({
  go, t, c, dark, lang, userName, email, onLogout,
}: { go: (s: Screen) => void; t: Copy; c: Palette; dark: boolean; lang: Lang; userName: string; email: string; onLogout: () => void }) {
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <AppHeader title={t.settings.title} c={c} />
      <ScreenScroll withNav>
        <CinematicHero pose="profile" height={168} c={c} title={userName} subtitle={email}>
          <Pressable onPress={() => go('edit-profile')} style={[styles.edit, { backgroundColor: c.primarySoft, marginTop: 10 }]} accessibilityLabel={t.profile.edit}>
            <Pencil size={15} color={c.primary} />
          </Pressable>
        </CinematicHero>
        <Group title={t.settings.household} c={c}>
          <Row icon={<Users size={15} color={c.primary} />} label={t.settings.members} onPress={() => go('household')} c={c} />
          <Row icon={<CreditCard size={15} color={c.primary} />} label={t.settings.methods} value="GCash, Maya, BPI" onPress={() => go('payment-methods')} c={c} />
        </Group>
        <Group title={t.settings.preferences} c={c}>
          <Row icon={<Bell size={15} color={c.primary} />} label={t.settings.notifications} onPress={() => go('notification-settings')} c={c} />
          <Row icon={<Languages size={15} color={c.primary} />} label={t.settings.language} value={t.langs[lang].native} onPress={() => go('language')} c={c} />
          <Row icon={dark ? <Moon size={15} color={c.primary} /> : <Sun size={15} color={c.primary} />} label={t.settings.appearance} value={dark ? t.settings.dark : t.settings.light} onPress={() => go('appearance')} c={c} />
        </Group>
        <Group title={t.settings.yourData} c={c}>
          <Row icon={<ShieldCheck size={15} color={c.primary} />} label={t.settings.privacy} value="Household access" onPress={() => go('privacy')} c={c} />
          <Row icon={<Download size={15} color={c.primary} />} label={t.settings.export} onPress={() => go('export-data')} c={c} />
          <Row icon={<History size={15} color={c.primary} />} label={t.settings.activity} onPress={() => go('activity')} c={c} />
        </Group>
        <Group title={t.settings.aboutGroup} c={c}>
          <Row icon={<Info size={15} color={c.primary} />} label={t.settings.about} value="Version 1.0" onPress={() => go('about')} c={c} />
        </Group>
        <Pressable onPress={onLogout} style={[styles.logout, { borderColor: c.border, backgroundColor: c.surface }]}>
          <LogOut size={16} color={c.danger} />
          <Text style={{ color: c.danger, fontWeight: '600' }}>{t.settings.logout}</Text>
        </Pressable>
        <View style={{ alignItems: 'center', marginTop: 22 }}>
          <BrandLogo c={c} />
          <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 8 }}>{t.settings.madeFor}</Text>
        </View>
      </ScreenScroll>
      <BottomNav screen="settings" go={go} c={c} t={t} />
    </View>
  );
}

export function LanguageScreen({ go, t, c, lang, setLang }: { go: (s: Screen) => void; t: Copy; c: Palette; lang: Lang; setLang: (l: Lang) => void }) {
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <AppHeader title={t.language.title} onBack={() => go('settings')} c={c} />
      <ScreenScroll>
        <CinematicHero pose="profile" height={132} c={c} title={t.language.choose} subtitle={t.language.body} />
        <Text style={{ color: c.text, fontSize: 22, fontWeight: '600' }}>{t.language.choose}</Text>
        <Text style={{ color: c.textMuted, marginBottom: 16 }}>{t.language.body}</Text>
        <Card c={c} style={{ paddingHorizontal: 14, paddingVertical: 0 }}>
          {languageOptions.map((opt) => {
            const selected = lang === opt.id;
            const meta = t.langs[opt.id];
            return (
              <Pressable key={opt.id} onPress={() => setLang(opt.id)} style={[styles.choice, { borderBottomColor: c.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.text, fontWeight: '600' }}>{meta.native}</Text>
                  <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 3 }}>{meta.sample}</Text>
                </View>
                <View style={[styles.radio, { borderColor: selected ? c.primary : c.border, backgroundColor: selected ? c.primary : 'transparent' }]}>
                  {selected && <Check size={12} color="#fff" />}
                </View>
              </Pressable>
            );
          })}
        </Card>
        <View style={{ marginTop: 18 }}>
          <PrimaryButton title={t.language.save} onPress={() => go('settings')} c={c} />
        </View>
      </ScreenScroll>
    </View>
  );
}

export function AppearanceScreen({ go, t, c, dark, setDark }: { go: (s: Screen) => void; t: Copy; c: Palette; dark: boolean; setDark: (v: boolean) => void }) {
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <AppHeader title={t.appearance.title} onBack={() => go('settings')} c={c} />
      <ScreenScroll>
        <CinematicHero pose="profile" height={132} c={c} title={t.appearance.make} subtitle={t.appearance.body} />
        <Text style={{ color: c.text, fontSize: 22, fontWeight: '600' }}>{t.appearance.make}</Text>
        <Text style={{ color: c.textMuted, marginBottom: 16 }}>{t.appearance.body}</Text>
        <View style={{ flexDirection: 'row', gap: 11, marginBottom: 15 }}>
          <Pressable onPress={() => setDark(false)} style={[styles.themeCard, { borderColor: !dark ? c.primary : 'transparent', backgroundColor: c.surface }]}>
            <View style={[styles.preview, { backgroundColor: '#EEF1F7' }]}>
              <LinearGradient colors={[...gradient.hero]} style={{ height: 30, borderRadius: 8 }} />
              <View style={styles.line} /><View style={[styles.line, { width: '65%' }]} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8 }}>
              <Sun size={13} color={c.text} /><Text style={{ color: c.text, fontWeight: '600' }}>{t.settings.light}</Text>
            </View>
            {!dark && <CheckCircle2 size={16} color={c.primary} style={{ position: 'absolute', right: 12, bottom: 11 }} />}
          </Pressable>
          <Pressable onPress={() => setDark(true)} style={[styles.themeCard, { borderColor: dark ? c.primary : 'transparent', backgroundColor: c.surface }]}>
            <View style={[styles.preview, { backgroundColor: '#12182A' }]}>
              <LinearGradient colors={[...gradient.hero]} style={{ height: 30, borderRadius: 8 }} />
              <View style={[styles.line, { backgroundColor: '#263352' }]} /><View style={[styles.line, { width: '65%', backgroundColor: '#263352' }]} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8 }}>
              <Moon size={13} color={c.text} /><Text style={{ color: c.text, fontWeight: '600' }}>{t.settings.dark}</Text>
            </View>
            {dark && <CheckCircle2 size={16} color={c.primary} style={{ position: 'absolute', right: 12, bottom: 11 }} />}
          </Pressable>
        </View>
        <Card c={c} style={styles.between}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={[styles.iconSoft, { backgroundColor: c.primarySoft }]}><Moon size={17} color={c.primary} /></View>
            <View>
              <Text style={{ color: c.text, fontWeight: '600' }}>{t.appearance.useDark}</Text>
              <Text style={{ color: c.textMuted, fontSize: 12 }}>{t.appearance.useDarkHint}</Text>
            </View>
          </View>
          <Switch value={dark} onValueChange={setDark} trackColor={{ true: c.primary }} />
        </Card>
      </ScreenScroll>
    </View>
  );
}

export function PrivacyScreen({ go, t, c }: { go: (s: Screen) => void; t: Copy; c: Palette }) {
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <AppHeader title={t.privacy.title} onBack={() => go('settings')} c={c} />
      <ScreenScroll>
        <CinematicHero pose="profile" height={132} c={c} title={t.privacy.hero} subtitle={t.privacy.heroBody} />
        <View style={[styles.privacyHero, { backgroundColor: c.primarySoft }]}>
          <ShieldCheck size={44} color={c.primary} />
          <Text style={{ color: c.text, fontSize: 20, fontWeight: '600', marginTop: 10, textAlign: 'center' }}>{t.privacy.hero}</Text>
          <Text style={{ color: c.textMuted, textAlign: 'center', marginTop: 6 }}>{t.privacy.heroBody}</Text>
        </View>
        {[
          [Check, t.privacy.private, t.privacy.privateBody],
          [X, t.privacy.never, t.privacy.neverBody],
          [ShieldCheck, t.privacy.external, t.privacy.externalBody],
        ].map(([Icon, title, body]) => (
          <View key={String(title)} style={[styles.privacyRow, { borderBottomColor: c.border }]}>
            <Icon size={19} color={c.primary} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.text, fontWeight: '600' }}>{title as string}</Text>
              <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 2 }}>{body as string}</Text>
            </View>
          </View>
        ))}
        <View style={[styles.legal, { backgroundColor: c.surface2 }]}>
          <Text style={{ color: c.textMuted, fontSize: 12, lineHeight: 18 }}>{t.privacy.legal}</Text>
        </View>
      </ScreenScroll>
    </View>
  );
}

export function EditProfileScreen({
  go, t, c, userId, userName, setUserName, email,
}: {
  go: (s: Screen) => void; t: Copy; c: Palette; userId: string;
  userName: string; setUserName: (n: string) => void; email: string;
}) {
  const [name, setName] = useState(userName);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const save = async () => {
    setSaving(true);
    setMessage('');
    if (supabase) {
      const { error } = await supabase.from('profiles').update({ full_name: name.trim() }).eq('id', userId);
      if (error) { setMessage(error.message); setSaving(false); return; }
    }
    setUserName(name.trim() || 'Home organizer');
    setSaving(false);
    setMessage(t.profile.saved);
    setTimeout(() => go('settings'), 500);
  };
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <AppHeader title={t.profile.edit} onBack={() => go('settings')} c={c} />
      <ScreenScroll>
        <CinematicHero pose="profile" height={150} c={c} title={t.profile.edit} subtitle={t.profile.display} />
        <Card c={c} style={{ gap: 12 }}>
          <Labeled c={c} label={t.profile.display} value={name} onChange={setName} />
          <Labeled c={c} label={t.profile.email} value={email} editable={false} />
          {message ? <Text style={{ color: c.success }}>{message}</Text> : null}
          <PrimaryButton title={t.profile.save} loading={saving} onPress={() => void save()} c={c} icon={<Check size={16} color="#fff" />} />
        </Card>
      </ScreenScroll>
    </View>
  );
}

export function HouseholdSetupScreen({
  go, t, c, onJoined,
}: { go: (s: Screen) => void; t: Copy; c: Palette; onJoined: (household: Household) => void }) {
  const [newName, setNewName] = useState('');
  const [lookup, setLookup] = useState('');
  const [busy, setBusy] = useState<'create' | 'join' | null>(null);
  const [error, setError] = useState('');
  const run = async (action: 'create' | 'join') => {
    const value = action === 'create' ? newName : lookup;
    if (!value.trim()) { setError(action === 'create' ? 'Enter a household name.' : 'Enter a Household ID or exact household name.'); return; }
    setError('');
    setBusy(action);
    try {
      const next = action === 'create' ? await createHousehold(value) : await joinHousehold(value);
      onJoined(next);
    } catch (reason) {
      const detail = typeof reason === 'object' && reason && 'message' in reason ? String(reason.message) : '';
      setError(detail || 'Something went wrong. Please try again.');
    } finally { setBusy(null); }
  };
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <AppHeader title="Set up your household" onBack={() => go('settings')} c={c} />
      <ScreenScroll>
        <CinematicHero pose="home" height={142} c={c} title="One shared home" subtitle="Create your household or join the people you live with." />
        <View style={[styles.centerHero, { backgroundColor: c.primarySoft }]}>
          <Users size={42} color={c.primary} />
          <Text style={{ color: c.text, fontSize: 23, fontWeight: '600', marginTop: 10 }}>One shared home, one clear view.</Text>
          <Text style={{ color: c.textMuted, textAlign: 'center', lineHeight: 19 }}>Create a household as its admin, or join one your organizer already created.</Text>
        </View>
        {error ? <InfoBanner c={c} icon={<ShieldCheck size={15} color={c.danger} />}>{error}</InfoBanner> : null}
        <Card c={c} style={{ gap: 13, marginBottom: 13 }}>
          <Text style={{ color: c.text, fontSize: 17, fontWeight: '600' }}>Create a household</Text>
          <Text style={{ color: c.textMuted, fontSize: 12, lineHeight: 18 }}>You’ll be the admin and can share the Household ID with family members.</Text>
          <Field c={c} label="Household name" value={newName} onChangeText={setNewName} placeholder="e.g. Dela Cruz Household" autoCapitalize="words" icon={<Users size={17} color={c.primary} />} />
          <PrimaryButton title={busy === 'create' ? 'Creating household…' : 'Create household'} loading={busy === 'create'} onPress={() => void run('create')} c={c} />
        </Card>
        <Card c={c} style={{ gap: 13 }}>
          <Text style={{ color: c.text, fontSize: 17, fontWeight: '600' }}>Join an existing household</Text>
          <Text style={{ color: c.textMuted, fontSize: 12, lineHeight: 18 }}>Enter the 8-character Household ID from the admin, or the exact household name.</Text>
          <Field c={c} label="Household ID or name" value={lookup} onChangeText={setLookup} placeholder="e.g. A1B2C3D4" autoCapitalize="characters" autoCorrect={false} icon={<Users size={17} color={c.primary} />} />
          <PrimaryButton title={busy === 'join' ? 'Joining household…' : 'Join household'} loading={busy === 'join'} onPress={() => void run('join')} c={c} />
        </Card>
      </ScreenScroll>
    </View>
  );
}

export function HouseholdScreen({ go, t, c, userId, household }: { go: (s: Screen) => void; t: Copy; c: Palette; userId: string; household: Household | null }) {
  const [members, setMembers] = useState<HouseholdUser[]>([]);
  const [error, setError] = useState('');
  const load = async () => {
    if (!household) return;
    try { setMembers(await fetchHouseholdUsers(household.id)); } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not load household members.'); }
  };
  useEffect(() => { void load(); }, [household?.id]);
  useRealtimeHouseholdMembers(household?.id || '', { onInsert: () => void load(), onDelete: () => void load() });
  const remove = async (member: HouseholdUser) => {
    setError('');
    try { await removeHouseholdUser(member.user_id); await load(); }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not remove this member.'); }
  };
  if (!household) return <HouseholdSetupScreen go={go} t={t} c={c} onJoined={() => go('home')} />;
  const isAdmin = household.role === 'admin';
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <AppHeader title={t.household.title} onBack={() => go('settings')} c={c} />
      <ScreenScroll>
        <CinematicHero pose="home" height={142} c={c} title={household.name} subtitle={isAdmin ? 'You administer this household.' : 'You are a household member.'} />
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 12 }}>
          <View style={[styles.iconSoft, { width: 44, height: 44, borderRadius: 14, backgroundColor: c.primarySoft }]}><Users size={20} color={c.primary} /></View>
          <View>
            <Text style={{ color: c.text, fontSize: 16, fontWeight: '600' }}>{household.name}</Text>
            <Text style={{ color: c.textMuted, fontSize: 12 }}>{isAdmin ? 'You administer this household.' : 'You are a household member.'}</Text>
          </View>
        </View>
        <Card c={c} style={{ marginBottom: 12, backgroundColor: c.primarySoft }}>
          <Text style={{ color: c.primary, fontSize: 11, fontWeight: '600', letterSpacing: 1 }}>HOUSEHOLD ID</Text>
          <Pressable accessibilityLabel="Copy household join code" onPress={() => void Clipboard.setStringAsync(household.join_id).catch(() => setError('Could not copy the join code.'))}><Text style={{ color: c.primary, marginTop: 10 }}>Copy join code</Text></Pressable>
          <Text selectable style={{ color: c.text, fontSize: 24, fontWeight: '700', letterSpacing: 2, marginTop: 4 }}>{household.join_id}</Text>
          <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 6 }}>Share this ID so family members can join this exact household.</Text>
        </Card>
        {error ? <InfoBanner c={c} icon={<ShieldCheck size={15} color={c.danger} />}>{error}</InfoBanner> : null}
        <InfoBanner c={c} icon={<ShieldCheck size={15} color={c.warning} />}>{t.household.banner}</InfoBanner>
        <Card c={c} style={{ paddingHorizontal: 14, paddingVertical: 0 }}>
          {members.map((member) => {
            const name = member.profile?.full_name || 'Household member';
            const isYou = member.user_id === userId;
            return <View key={member.user_id} style={[styles.member, { borderBottomColor: c.border }]}>
              <View style={[styles.memberAv, { backgroundColor: c.primarySoft }]}><Text style={{ color: c.primary, fontWeight: '600' }}>{name.split(' ').map((p) => p[0]).join('').slice(0, 2)}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.text, fontWeight: '600' }}>{name}</Text>
                <Text style={{ color: c.textMuted, fontSize: 12 }}>{member.role === 'admin' ? 'Admin' : t.household.member}</Text>
                {isYou && <Text style={{ color: c.primary, fontSize: 11, fontWeight: '700', marginTop: 2 }}>{t.household.you}</Text>}
              </View>
              {isAdmin && !isYou && (
                <Pressable onPress={() => void remove(member)} style={[styles.remove, { backgroundColor: c.dangerSoft }]}>
                  <X size={14} color={c.danger} />
                </Pressable>
              )}
            </View>;
          })}
        </Card>
        <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 12, paddingHorizontal: 2 }}>Everyone here sees the same household bills and activity. Only admins can remove members.</Text>
      </ScreenScroll>
    </View>
  );
}

export function PaymentMethodsScreen({ go, t, c }: { go: (s: Screen) => void; t: Copy; c: Palette }) {
  const [error, setError] = useState('');
  const methods = [['G', 'GCash'], ['M', 'Maya'], ['B', 'BPI / bank app']];
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <AppHeader title={t.payments.title} onBack={() => go('settings')} c={c} />
      <ScreenScroll>
        <CinematicHero pose="bills" height={136} c={c} title={t.payments.hero} subtitle={t.payments.body} />
        <View style={[styles.centerHero, { backgroundColor: c.primarySoft }]}>
          <CreditCard size={43} color={c.primary} />
          <Text style={{ color: c.text, fontSize: 22, fontWeight: '600', marginTop: 10 }}>{t.payments.hero}</Text>
          <Text style={{ color: c.textMuted, textAlign: 'center' }}>{t.payments.body}</Text>
        </View>
        <InfoBanner c={c}>{t.payments.banner}</InfoBanner>
        {error ? <InfoBanner c={c} tone="danger">{error}</InfoBanner> : null}
        <Card c={c} style={{ paddingHorizontal: 14, paddingVertical: 0, marginBottom: 15 }}>
          {methods.map((method) => (
            <Pressable accessibilityRole="button" key={method[1]} onPress={() => { setError(''); void openPaymentDestination(method[0] === 'B' ? 'BPI' : method[1]).catch(reason => setError(reason.message)); }} style={[styles.method, { borderBottomColor: c.border }]}>
              <View style={styles.methodMark}><Text style={{ color: '#fff', fontWeight: '700' }}>{method[0]}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.text, fontWeight: '600' }}>{method[1]}</Text>
                <Text style={{ color: c.textMuted, fontSize: 12 }}>{t.payments.opens}</Text>
              </View>
              <ChevronRight size={14} color={c.primary} />
            </Pressable>
          ))}
        </Card>
        <PrimaryButton title={t.payments.tryFlow} onPress={() => go('bills')} c={c} icon={<ChevronRight size={16} color="#fff" />} />
      </ScreenScroll>
    </View>
  );
}

export function NotificationSettingsScreen({
  go, t, c, userId, draft, householdId,
}: { go: (s: Screen) => void; t: Copy; c: Palette; userId: string; draft: OnboardingDraft; householdId: string }) {
  const [prefs, setPrefs] = useState({ due_soon: draft.dueSoon, weekly_summary: draft.weeklySummary, payment_updates: true, government_deadlines: draft.lingkodDeadlines, load_reminders: draft.loadReminders });
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [deviceMessage, setDeviceMessage] = useState('');
  useEffect(() => { setSaved(false); }, [prefs]);
  useEffect(() => {
    if (!supabase || !userId) return;
    void supabase.from('notification_preferences').select('due_soon,weekly_summary,payment_updates,government_deadlines,load_reminders').eq('user_id', userId).maybeSingle().then(({ data, error }) => { if (error) setError(error.message); else if (data) setPrefs(data); });
  }, [userId]);
  const save = async () => {
    if (!supabase || busy) return;
    setBusy(true); setError(''); setSaved(false);
    try {
      const { error } = await supabase.from('notification_preferences').upsert({ user_id: userId, ...prefs });
      if (error) throw new Error(error.message);
      if (householdId) await Promise.all([scheduleAllDueReminders(householdId, userId), checkAndCreateDueDateReminders(userId, householdId)]);
      setSaved(true);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not save preferences.'); }
    finally { setBusy(false); }
  };
  const enableDevice = async () => {
    try { await registerForPushNotifications(userId); if (householdId) await scheduleAllDueReminders(householdId, userId); setDeviceMessage('Device reminders enabled.'); }
    catch (reason) { setDeviceMessage(reason instanceof Error ? reason.message : 'Could not enable device reminders.'); }
  };
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <AppHeader title={t.notifSettings.title} onBack={() => go('settings')} c={c} />
      <ScreenScroll>
        {error ? <InfoBanner c={c} tone="danger">{error}</InfoBanner> : null}
        <CinematicHero pose="calendar" height={136} c={c} title={t.notifSettings.hero} subtitle={t.notifSettings.body} />
        <Text style={{ color: c.text, fontSize: 22, fontWeight: '600' }}>{t.notifSettings.hero}</Text>
        <Text style={{ color: c.textMuted, marginBottom: 16 }}>{t.notifSettings.body}</Text>
        <Card c={c} style={{ paddingHorizontal: 14 }}>
          <PrefSwitch title={t.onboarding.dueSoon} hint={t.onboarding.dueSoonHint} value={prefs.due_soon} onValueChange={(v) => setPrefs({ ...prefs, due_soon: v })} c={c} />

          <PrefSwitch title="Weekly overview" hint="A weekly in-app summary of bills due in the next seven days." value={prefs.weekly_summary} onValueChange={v => setPrefs({ ...prefs, weekly_summary: v })} c={c} />
          <PrefSwitch title={t.onboarding.loadPref} hint={t.onboarding.loadPrefHint} value={prefs.load_reminders} onValueChange={v => setPrefs({ ...prefs, load_reminders: v })} c={c} />
          <PrefSwitch title="Payment updates" hint="When someone in your household records a payment." value={prefs.payment_updates} onValueChange={(v) => setPrefs({ ...prefs, payment_updates: v })} c={c} />
          <PrefSwitch title={t.onboarding.lingkodPref} hint={t.onboarding.lingkodPrefHint} value={prefs.government_deadlines} onValueChange={(v) => setPrefs({ ...prefs, government_deadlines: v })} c={c} />
        </Card>
        <View style={{ marginTop: 18 }}>
          <PrimaryButton loading={busy} title={saved ? t.notifSettings.saved : t.notifSettings.save} onPress={() => void save()} c={c} icon={<Check size={16} color="#fff" />} />
          <View style={{ marginTop: 16 }}><PrimaryButton title="Enable device reminders" onPress={() => void enableDevice()} c={c} />{deviceMessage ? <Text style={{ color: c.textMuted, marginTop: 12 }}>{deviceMessage}</Text> : null}</View>
        </View>
      </ScreenScroll>
    </View>
  );
}

export function ExportDataScreen({ go, t, c, userId, householdId }: { go: (s: Screen) => void; t: Copy; c: Palette; userId: string; householdId: string }) {
  const [exporting, setExporting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');
  const download = async () => {
    if (!supabase || exporting) return;
    setExporting(true); setDone(false); setError('');
    try {
      const results = await Promise.all([
        supabase.from('profiles').select('id,full_name,household_name,preferred_language,appearance,created_at').eq('id', userId).single(),
        supabase.from('bills').select('*').eq('household_id', householdId),
        supabase.from('activity_events').select('*').eq('household_id', householdId),
        supabase.from('notification_preferences').select('*').eq('user_id', userId).maybeSingle(),
      ]);
      const failure = results.find(result => result.error)?.error;
      if (failure) throw new Error(failure.message);
      const json = JSON.stringify({ profile: results[0].data, bills: results[1].data, activity: results[2].data, preferences: results[3].data, exported_at: new Date().toISOString() }, null, 2);
      const FileSystem = await import('expo-file-system/legacy');
      if (!FileSystem.cacheDirectory) throw new Error('Local file storage is unavailable.');
      const path = FileSystem.cacheDirectory + 'bayarin-household-export.json';
      await FileSystem.writeAsStringAsync(path, json);
      if (!(await Sharing.isAvailableAsync())) throw new Error('Sharing is unavailable on this device.');
      await Sharing.shareAsync(path, { mimeType: 'application/json' });
      setDone(true);
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not export your records.'); }
    finally { setExporting(false); }
  };
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <AppHeader title={t.export.title} onBack={() => go('settings')} c={c} />
      <ScreenScroll>
        <CinematicHero pose="profile" height={136} c={c} title={t.export.hero} subtitle={t.export.body} />
        <View style={[styles.centerHero, { backgroundColor: c.primarySoft }]}>
          <Download size={43} color={c.primary} />
          <Text style={{ color: c.text, fontSize: 22, fontWeight: '600', marginTop: 10 }}>{t.export.hero}</Text>
          <Text style={{ color: c.textMuted, textAlign: 'center' }}>{t.export.body}</Text>
        </View>
        <Card c={c} style={{ paddingHorizontal: 14, marginBottom: 15 }}>
          {[[t.export.profile, t.export.profileHint], [t.export.bills, t.export.billsHint], [t.export.activity, t.export.activityHint]].map(([title, hint]) => (
            <View key={title} style={[styles.exportRow, { borderBottomColor: c.border }]}>
              <Check size={17} color={c.success} />
              <View><Text style={{ color: c.text, fontWeight: '600' }}>{title}</Text><Text style={{ color: c.textMuted, fontSize: 12 }}>{hint}</Text></View>
            </View>
          ))}
        </Card>
        {error ? <InfoBanner c={c} tone="danger">{error}</InfoBanner> : null}
        <PrimaryButton title={done ? t.export.again : t.export.download} loading={exporting} onPress={() => void download()} c={c} icon={<Download size={16} color="#fff" />} />
        <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 12 }}>{t.export.legal}</Text>
      </ScreenScroll>
    </View>
  );
}

export function AboutScreen({ go, t, c }: { go: (s: Screen) => void; t: Copy; c: Palette }) {
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <AppHeader title={t.about.title} onBack={() => go('settings')} c={c} />
      <ScreenScroll>
        <View style={styles.aboutHero}>
          <Image source={images.welcome} resizeMode="contain" style={{ position: 'absolute', top: -15, right: -35, width: 250, height: 260 }} />
          <LinearGradient colors={['rgba(4,10,55,0.1)', 'rgba(4,8,36,0.92)']} style={StyleSheet.absoluteFill} />
          <View style={{ position: 'absolute', left: 18, right: 18, bottom: 20 }}>
            <BrandLogo inverted c={c} />
            <Text style={{ color: '#fff', fontSize: 25, fontWeight: '600', marginTop: 14 }}>{t.about.hero}</Text>
            <Text style={{ color: '#DBE1FF', fontSize: 13, marginTop: 6 }}>{t.about.body}</Text>
          </View>
        </View>
        <Benefits c={c} />
        <Text style={{ textAlign: 'center', color: c.textMuted, fontSize: 12, marginTop: 14 }}>{t.about.version}</Text>
      </ScreenScroll>
    </View>
  );
}

function Calendarish({ size, color }: { size: number; color: string }) {
  return <History size={size} color={color} />;
}

function Group({ title, children, c }: { title: string; children: ReactNode; c: Palette }) {
  return (
    <View style={{ marginTop: 19 }}>
      <Text style={{ color: c.textMuted, fontSize: 12, marginLeft: 4, marginBottom: 7, fontWeight: '600', letterSpacing: 0.3 }}>{title}</Text>
      <View style={{ backgroundColor: c.surface, borderRadius: 17, paddingHorizontal: 13, borderWidth: 1, borderColor: c.border }}>{children}</View>
    </View>
  );
}

function Row({ icon, label, value, onPress, c }: { icon: ReactNode; label: string; value?: string; onPress: () => void; c: Palette }) {
  const s = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <AnimatedPressable
      onPressIn={() => { s.value = withSpring(0.985, { damping: 16, stiffness: 320 }); }}
      onPressOut={() => { s.value = withSpring(1, { damping: 12, stiffness: 260 }); }}
      onPress={onPress}
      style={[styles.settingRow, { borderBottomColor: c.border }, anim]}
    >
      <View style={[styles.iconSoft, { backgroundColor: c.surface2 }]}>{icon}</View>
      <Text style={{ color: c.text, fontWeight: '600', flex: 1 }}>{label}</Text>
      {value ? <Text style={{ color: c.textMuted, fontSize: 12 }}>{value}</Text> : null}
      <ChevronRight size={14} color={c.textMuted} />
    </AnimatedPressable>
  );
}

function Labeled({ c, label, value, onChange, editable = true }: { c: Palette; label: string; value: string; onChange?: (v: string) => void; editable?: boolean }) {
  return (
    <Field c={c} label={label} editable={editable} value={value} onChangeText={onChange} autoCapitalize="words" />
  );
}

const styles = StyleSheet.create({
  profile: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 15, borderRadius: 17 },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  avatarLg: { width: 64, height: 64, borderRadius: 32 },
  edit: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start' },
  settingRow: { height: 52, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  iconSoft: { width: 31, height: 31, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  logout: { height: 48, borderWidth: 1, borderRadius: 13, marginTop: 18, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  choice: { minHeight: 66, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  themeCard: { flex: 1, borderWidth: 2, borderRadius: 17, padding: 9 },
  preview: { height: 114, borderRadius: 12, padding: 15, gap: 8 },
  line: { height: 14, borderRadius: 5, backgroundColor: '#fff' },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  privacyHero: { alignItems: 'center', padding: 25, borderRadius: 20, marginBottom: 8 },
  privacyRow: { flexDirection: 'row', gap: 12, paddingVertical: 15, borderBottomWidth: StyleSheet.hairlineWidth },
  legal: { padding: 14, borderRadius: 13, marginTop: 12 },
  editHero: { minHeight: 130, marginBottom: 14, padding: 17, borderRadius: 21, flexDirection: 'row', alignItems: 'center', gap: 15 },
  accent: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  inline: { flexDirection: 'row', gap: 7, marginBottom: 12, padding: 10, borderRadius: 15 },
  inlineInput: { flex: 1, height: 44, borderWidth: 1.5, borderRadius: 12, paddingHorizontal: 12 },
  addBtn: { height: 40, paddingHorizontal: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  member: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  memberAv: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  remove: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  centerHero: { padding: 25, marginBottom: 13, borderRadius: 22, alignItems: 'center', gap: 6 },
  method: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  methodMark: { width: 34, height: 34, borderRadius: 11, backgroundColor: '#3155E4', alignItems: 'center', justifyContent: 'center' },
  exportRow: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  aboutHero: { height: 320, borderRadius: 25, overflow: 'hidden', marginBottom: 14, backgroundColor: '#081659' },
});
