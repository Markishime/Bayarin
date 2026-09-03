import * as Sharing from 'expo-sharing';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Bell, Check, CheckCircle2, ChevronRight, CreditCard, Download, Film, History, Info,
  Languages, LogOut, Moon, Pencil, Play, Plus, ShieldCheck, Sun, Users, X,
} from 'lucide-react-native';
import { useEffect, useState, type ReactNode } from 'react';
import { Image, Pressable, StyleSheet, Switch, Text, TextInput, View } from 'react-native';
import { AppHeader, BottomNav, BrandLogo, Card, InfoBanner, PrefSwitch, PrimaryButton, ScreenScroll } from '../components/ui';
import { DEMO_EMAIL, defaultOnboarding, demoMembers, images } from '../data';
import { languageOptions, type Copy } from '../i18n';
import { supabase } from '../lib/supabase';
import { gradient, type Palette } from '../theme';
import type { HouseholdMember, Lang, OnboardingDraft, Screen } from '../types';

export function SettingsScreen({
  go, t, c, dark, lang, userName, email, onLogout,
}: { go: (s: Screen) => void; t: Copy; c: Palette; dark: boolean; lang: Lang; userName: string; email: string; onLogout: () => void }) {
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <AppHeader title={t.settings.title} c={c} />
      <ScreenScroll withNav>
        <View style={[styles.profile, { backgroundColor: c.surface }]}>
          <Image source={images.auth} style={styles.avatar} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.text, fontWeight: '800', fontSize: 16 }}>{userName}</Text>
            <Text style={{ color: c.textMuted, fontSize: 12 }}>{email}</Text>
          </View>
          <Pressable onPress={() => go('edit-profile')} style={[styles.edit, { backgroundColor: c.primarySoft }]} accessibilityLabel={t.profile.edit}>
            <Pencil size={15} color={c.primary} />
          </Pressable>
        </View>
        <Group title={t.settings.household} c={c}>
          <Row icon={<Users size={15} color={c.primary} />} label={t.settings.members} onPress={() => go('household')} c={c} />
          <Row icon={<CreditCard size={15} color={c.primary} />} label={t.settings.methods} value="GCash, Maya, BPI" onPress={() => go('payment-methods')} c={c} />
        </Group>
        <Group title={t.settings.preferences} c={c}>
          <Row icon={<Bell size={15} color={c.primary} />} label={t.settings.notifications} value={t.settings.on} onPress={() => go('notification-settings')} c={c} />
          <Row icon={<Languages size={15} color={c.primary} />} label={t.settings.language} value={t.langs[lang].native} onPress={() => go('language')} c={c} />
          <Row icon={dark ? <Moon size={15} color={c.primary} /> : <Sun size={15} color={c.primary} />} label={t.settings.appearance} value={dark ? t.settings.dark : t.settings.light} onPress={() => go('appearance')} c={c} />
        </Group>
        <Group title={t.settings.yourData} c={c}>
          <Row icon={<ShieldCheck size={15} color={c.primary} />} label={t.settings.privacy} value="Supabase RLS" onPress={() => go('privacy')} c={c} />
          <Row icon={<Download size={15} color={c.primary} />} label={t.settings.export} onPress={() => go('export-data')} c={c} />
          <Row icon={<History size={15} color={c.primary} />} label={t.settings.activity} onPress={() => go('activity')} c={c} />
        </Group>
        <Group title={t.settings.aboutGroup} c={c}>
          <Row icon={<Film size={15} color={c.primary} />} label={t.settings.story} onPress={() => go('story')} c={c} />
          <Row icon={<Info size={15} color={c.primary} />} label={t.settings.about} value="Version 2.0" onPress={() => go('about')} c={c} />
        </Group>
        <Pressable onPress={onLogout} style={[styles.logout, { borderColor: c.border, backgroundColor: c.surface }]}>
          <LogOut size={16} color={c.danger} />
          <Text style={{ color: c.danger, fontWeight: '800' }}>{t.settings.logout}</Text>
        </Pressable>
        <View style={{ alignItems: 'center', marginTop: 22 }}>
          <BrandLogo />
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
        <Text style={{ color: c.text, fontSize: 22, fontWeight: '800' }}>{t.language.choose}</Text>
        <Text style={{ color: c.textMuted, marginBottom: 16 }}>{t.language.body}</Text>
        <Card c={c} style={{ paddingHorizontal: 14, paddingVertical: 0 }}>
          {languageOptions.map((opt) => {
            const selected = lang === opt.id;
            const meta = t.langs[opt.id];
            return (
              <Pressable key={opt.id} onPress={() => setLang(opt.id)} style={[styles.choice, { borderBottomColor: c.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={{ color: c.text, fontWeight: '800' }}>{meta.native}</Text>
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
        <Text style={{ color: c.text, fontSize: 22, fontWeight: '800' }}>{t.appearance.make}</Text>
        <Text style={{ color: c.textMuted, marginBottom: 16 }}>{t.appearance.body}</Text>
        <View style={{ flexDirection: 'row', gap: 11, marginBottom: 15 }}>
          <Pressable onPress={() => setDark(false)} style={[styles.themeCard, { borderColor: !dark ? c.primary : 'transparent', backgroundColor: c.surface }]}>
            <View style={[styles.preview, { backgroundColor: '#F7F4EF' }]}>
              <LinearGradient colors={[...gradient.hero]} style={{ height: 30, borderRadius: 8 }} />
              <View style={styles.line} /><View style={[styles.line, { width: '65%' }]} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8 }}>
              <Sun size={13} color={c.text} /><Text style={{ color: c.text, fontWeight: '800' }}>{t.settings.light}</Text>
            </View>
            {!dark && <CheckCircle2 size={16} color={c.primary} style={{ position: 'absolute', right: 12, bottom: 11 }} />}
          </Pressable>
          <Pressable onPress={() => setDark(true)} style={[styles.themeCard, { borderColor: dark ? c.primary : 'transparent', backgroundColor: c.surface }]}>
            <View style={[styles.preview, { backgroundColor: '#151412' }]}>
              <LinearGradient colors={[...gradient.hero]} style={{ height: 30, borderRadius: 8 }} />
              <View style={[styles.line, { backgroundColor: '#272522' }]} /><View style={[styles.line, { width: '65%', backgroundColor: '#272522' }]} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8 }}>
              <Moon size={13} color={c.text} /><Text style={{ color: c.text, fontWeight: '800' }}>{t.settings.dark}</Text>
            </View>
            {dark && <CheckCircle2 size={16} color={c.primary} style={{ position: 'absolute', right: 12, bottom: 11 }} />}
          </Pressable>
        </View>
        <Card c={c} style={styles.between}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={[styles.iconSoft, { backgroundColor: c.primarySoft }]}><Moon size={17} color={c.primary} /></View>
            <View>
              <Text style={{ color: c.text, fontWeight: '800' }}>{t.appearance.useDark}</Text>
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
        <View style={[styles.privacyHero, { backgroundColor: c.primarySoft }]}>
          <ShieldCheck size={44} color={c.primary} />
          <Text style={{ color: c.text, fontSize: 20, fontWeight: '800', marginTop: 10, textAlign: 'center' }}>{t.privacy.hero}</Text>
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
              <Text style={{ color: c.text, fontWeight: '800' }}>{title as string}</Text>
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
  go, t, c, userId, demo, userName, setUserName, householdName, setHouseholdName,
}: {
  go: (s: Screen) => void; t: Copy; c: Palette; userId: string; demo: boolean;
  userName: string; setUserName: (n: string) => void;
  householdName: string; setHouseholdName: (n: string) => void;
}) {
  const [name, setName] = useState(userName);
  const [household, setHousehold] = useState(householdName);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const save = async () => {
    setSaving(true);
    setMessage('');
    if (!demo && supabase) {
      const { error } = await supabase.from('profiles').update({ full_name: name.trim(), household_name: household.trim() }).eq('id', userId);
      if (error) { setMessage(error.message); setSaving(false); return; }
    }
    setUserName(name.trim() || 'Home organizer');
    setHouseholdName(household.trim() || defaultOnboarding.householdName);
    setSaving(false);
    setMessage(t.profile.saved);
    setTimeout(() => go('settings'), 500);
  };
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <AppHeader title={t.profile.edit} onBack={() => go('settings')} c={c} />
      <ScreenScroll>
        <LinearGradient colors={[...gradient.hero]} style={styles.editHero}>
          <Image source={images.auth} style={styles.avatarLg} />
          <BrandLogo inverted />
        </LinearGradient>
        <Card c={c} style={{ gap: 12 }}>
          <Labeled c={c} label={t.profile.display} value={name} onChange={setName} />
          <Labeled c={c} label={t.profile.household} value={household} onChange={setHousehold} />
          <Labeled c={c} label={t.profile.email} value={demo ? DEMO_EMAIL : 'Connected Supabase account'} editable={false} />
          {message ? <Text style={{ color: c.success }}>{message}</Text> : null}
          <PrimaryButton title={t.profile.save} loading={saving} onPress={() => void save()} c={c} icon={<Check size={16} color="#fff" />} />
        </Card>
      </ScreenScroll>
    </View>
  );
}

export function HouseholdScreen({ go, t, c, userId, demo }: { go: (s: Screen) => void; t: Copy; c: Palette; userId: string; demo: boolean }) {
  const [members, setMembers] = useState<HouseholdMember[]>(demoMembers);
  const [adding, setAdding] = useState(false);
  const [name, setName] = useState('');
  useEffect(() => {
    if (demo || !supabase || !userId) return;
    void supabase.from('household_members').select('id,name,role,contact').eq('user_id', userId).order('created_at').then(({ data }) => {
      if (data?.length) setMembers(data as HouseholdMember[]);
    });
  }, [demo, userId]);
  const add = async () => {
    const member = { id: `local-${Date.now()}`, name: name.trim(), role: t.household.member, contact: '' };
    if (!member.name) return;
    if (!demo && supabase) {
      const { data, error } = await supabase.from('household_members').insert({ user_id: userId, name: member.name, role: member.role }).select('id,name,role,contact').single();
      if (!error && data) setMembers((current) => [...current, data as HouseholdMember]);
    } else setMembers((current) => [...current, member]);
    setName('');
    setAdding(false);
  };
  const remove = async (member: HouseholdMember) => {
    if (!demo && supabase && !member.id.startsWith('demo')) await supabase.from('household_members').delete().eq('id', member.id).eq('user_id', userId);
    setMembers((current) => current.filter((item) => item.id !== member.id));
  };
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <AppHeader title={t.household.title} onBack={() => go('settings')} c={c} trailing={
        <Pressable onPress={() => setAdding(!adding)} style={[styles.accent, { backgroundColor: c.primary }]}><Plus size={18} color="#fff" /></Pressable>
      } />
      <ScreenScroll>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', marginBottom: 12 }}>
          <View style={[styles.iconSoft, { width: 44, height: 44, borderRadius: 14, backgroundColor: c.primarySoft }]}><Users size={20} color={c.primary} /></View>
          <View>
            <Text style={{ color: c.text, fontSize: 16, fontWeight: '800' }}>Dela Cruz Household</Text>
            <Text style={{ color: c.textMuted, fontSize: 12 }}>{t.household.share}</Text>
          </View>
        </View>
        <InfoBanner c={c} icon={<ShieldCheck size={15} color={c.warning} />}>{t.household.banner}</InfoBanner>
        {adding && (
          <View style={[styles.inline, { backgroundColor: c.surface }]}>
            <TextInput value={name} onChangeText={setName} placeholder={t.household.placeholder} placeholderTextColor={c.textSoft} style={[styles.inlineInput, { color: c.text, backgroundColor: c.bg }]} />
            <Pressable onPress={() => void add()} style={[styles.addBtn, { backgroundColor: c.primary }]}><Text style={{ color: '#fff', fontWeight: '800' }}>{t.household.add}</Text></Pressable>
          </View>
        )}
        <Card c={c} style={{ paddingHorizontal: 14, paddingVertical: 0 }}>
          {members.map((member, index) => (
            <View key={member.id} style={[styles.member, { borderBottomColor: c.border }]}>
              <View style={styles.memberAv}><Text style={{ color: '#2E43C6', fontWeight: '800' }}>{member.name.split(' ').map((p) => p[0]).join('').slice(0, 2)}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.text, fontWeight: '800' }}>{member.name}</Text>
                <Text style={{ color: c.textMuted, fontSize: 12 }}>{member.role}{member.contact ? ` · ${member.contact}` : ''}</Text>
              </View>
              {index > 0 && (
                <Pressable onPress={() => void remove(member)} style={[styles.remove, { backgroundColor: c.dangerSoft }]}>
                  <X size={14} color={c.danger} />
                </Pressable>
              )}
            </View>
          ))}
        </Card>
      </ScreenScroll>
    </View>
  );
}

export function PaymentMethodsScreen({ go, t, c }: { go: (s: Screen) => void; t: Copy; c: Palette }) {
  const methods = [['G', 'GCash'], ['M', 'Maya'], ['B', 'BPI / bank app']];
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <AppHeader title={t.payments.title} onBack={() => go('settings')} c={c} />
      <ScreenScroll>
        <View style={[styles.centerHero, { backgroundColor: c.primarySoft }]}>
          <CreditCard size={43} color={c.primary} />
          <Text style={{ color: c.text, fontSize: 22, fontWeight: '800', marginTop: 10 }}>{t.payments.hero}</Text>
          <Text style={{ color: c.textMuted, textAlign: 'center' }}>{t.payments.body}</Text>
        </View>
        <InfoBanner c={c}>{t.payments.banner}</InfoBanner>
        <Card c={c} style={{ paddingHorizontal: 14, paddingVertical: 0, marginBottom: 15 }}>
          {methods.map((method) => (
            <Pressable key={method[1]} onPress={() => go('bill-detail')} style={[styles.method, { borderBottomColor: c.border }]}>
              <View style={styles.methodMark}><Text style={{ color: '#fff', fontWeight: '900' }}>{method[0]}</Text></View>
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.text, fontWeight: '800' }}>{method[1]}</Text>
                <Text style={{ color: c.textMuted, fontSize: 12 }}>{t.payments.opens}</Text>
              </View>
              <ChevronRight size={14} color={c.primary} />
            </Pressable>
          ))}
        </Card>
        <PrimaryButton title={t.payments.tryFlow} onPress={() => go('bill-detail')} c={c} icon={<ChevronRight size={16} color="#fff" />} />
      </ScreenScroll>
    </View>
  );
}

export function NotificationSettingsScreen({
  go, t, c, userId, demo, draft,
}: { go: (s: Screen) => void; t: Copy; c: Palette; userId: string; demo: boolean; draft: OnboardingDraft }) {
  const [prefs, setPrefs] = useState({ due_soon: draft.dueSoon, weekly_summary: draft.weeklySummary, payment_updates: true, government_deadlines: draft.lingkodDeadlines });
  const [saved, setSaved] = useState(false);
  useEffect(() => {
    if (demo || !supabase || !userId) return;
    void supabase.from('notification_preferences').select('due_soon,weekly_summary,payment_updates,government_deadlines').eq('user_id', userId).maybeSingle().then(({ data }) => {
      if (data) setPrefs(data);
    });
  }, [demo, userId]);
  const save = async () => {
    if (!demo && supabase) await supabase.from('notification_preferences').upsert({ user_id: userId, ...prefs });
    setSaved(true);
    setTimeout(() => setSaved(false), 1800);
  };
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <AppHeader title={t.notifSettings.title} onBack={() => go('settings')} c={c} />
      <ScreenScroll>
        <Text style={{ color: c.text, fontSize: 22, fontWeight: '800' }}>{t.notifSettings.hero}</Text>
        <Text style={{ color: c.textMuted, marginBottom: 16 }}>{t.notifSettings.body}</Text>
        <Card c={c} style={{ paddingHorizontal: 14 }}>
          <PrefSwitch title={t.onboarding.dueSoon} hint={t.onboarding.dueSoonHint} value={prefs.due_soon} onValueChange={(v) => setPrefs({ ...prefs, due_soon: v })} c={c} />
          <PrefSwitch title={t.onboarding.weekly} hint={t.onboarding.weeklyHint} value={prefs.weekly_summary} onValueChange={(v) => setPrefs({ ...prefs, weekly_summary: v })} c={c} />
          <PrefSwitch title={t.onboarding.loadPref} hint={t.onboarding.loadPrefHint} value={prefs.payment_updates} onValueChange={(v) => setPrefs({ ...prefs, payment_updates: v })} c={c} />
          <PrefSwitch title={t.onboarding.lingkodPref} hint={t.onboarding.lingkodPrefHint} value={prefs.government_deadlines} onValueChange={(v) => setPrefs({ ...prefs, government_deadlines: v })} c={c} />
        </Card>
        <View style={{ marginTop: 18 }}>
          <PrimaryButton title={saved ? t.notifSettings.saved : t.notifSettings.save} onPress={() => void save()} c={c} icon={<Check size={16} color="#fff" />} />
        </View>
      </ScreenScroll>
    </View>
  );
}

export function ExportDataScreen({ go, t, c, userId, demo }: { go: (s: Screen) => void; t: Copy; c: Palette; userId: string; demo: boolean }) {
  const [exporting, setExporting] = useState(false);
  const [done, setDone] = useState(false);
  const download = async () => {
    setExporting(true);
    let payload: unknown = { profile: { name: 'Juan Dela Cruz' }, exported_at: new Date().toISOString(), mode: 'demo' };
    if (!demo && supabase) {
      const [profileResult, billResult, activityResult] = await Promise.all([
        supabase.from('profiles').select('*').eq('id', userId).maybeSingle(),
        supabase.from('bills').select('*').eq('user_id', userId),
        supabase.from('activity_events').select('*').eq('user_id', userId),
      ]);
      payload = { profile: profileResult.data, bills: billResult.data, activity: activityResult.data, exported_at: new Date().toISOString() };
    }
    const FileSystem = await import('expo-file-system/legacy').catch(async () => import('expo-file-system'));
    const dir = (FileSystem as { cacheDirectory?: string }).cacheDirectory ?? '';
    const path = `${dir}bayarin-household-export.json`;
    if ('writeAsStringAsync' in FileSystem) {
      await (FileSystem as { writeAsStringAsync: (p: string, d: string) => Promise<void> }).writeAsStringAsync(path, JSON.stringify(payload, null, 2));
      if (await Sharing.isAvailableAsync()) await Sharing.shareAsync(path);
    }
    setExporting(false);
    setDone(true);
  };
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <AppHeader title={t.export.title} onBack={() => go('settings')} c={c} />
      <ScreenScroll>
        <View style={[styles.centerHero, { backgroundColor: c.primarySoft }]}>
          <Download size={43} color={c.primary} />
          <Text style={{ color: c.text, fontSize: 22, fontWeight: '800', marginTop: 10 }}>{t.export.hero}</Text>
          <Text style={{ color: c.textMuted, textAlign: 'center' }}>{t.export.body}</Text>
        </View>
        <Card c={c} style={{ paddingHorizontal: 14, marginBottom: 15 }}>
          {[[t.export.profile, t.export.profileHint], [t.export.bills, t.export.billsHint], [t.export.activity, t.export.activityHint]].map(([title, hint]) => (
            <View key={title} style={[styles.exportRow, { borderBottomColor: c.border }]}>
              <Check size={17} color={c.success} />
              <View><Text style={{ color: c.text, fontWeight: '800' }}>{title}</Text><Text style={{ color: c.textMuted, fontSize: 12 }}>{hint}</Text></View>
            </View>
          ))}
        </Card>
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
          <Image source={images.story} style={StyleSheet.absoluteFillObject} />
          <LinearGradient colors={['rgba(4,10,55,0.1)', 'rgba(4,8,36,0.92)']} style={StyleSheet.absoluteFill} />
          <View style={{ position: 'absolute', left: 18, right: 18, bottom: 20 }}>
            <BrandLogo inverted />
            <Text style={{ color: '#fff', fontSize: 25, fontWeight: '800', marginTop: 14 }}>{t.about.hero}</Text>
            <Text style={{ color: '#DBE1FF', fontSize: 13, marginTop: 6 }}>{t.about.body}</Text>
          </View>
        </View>
        <Card c={c} style={{ paddingHorizontal: 14, marginBottom: 15 }}>
          {[[Calendarish, t.about.organize, t.about.organizeHint], [Bell, t.about.remind, t.about.remindHint], [ShieldCheck, t.about.protect, t.about.protectHint]].map(([Icon, title, hint]) => (
            <View key={String(title)} style={[styles.exportRow, { borderBottomColor: c.border }]}>
              <Icon size={19} color={c.primary} />
              <View><Text style={{ color: c.text, fontWeight: '800' }}>{title as string}</Text><Text style={{ color: c.textMuted, fontSize: 12 }}>{hint as string}</Text></View>
            </View>
          ))}
        </Card>
        <PrimaryButton title={t.brand.storyCta} onPress={() => go('story')} c={c} icon={<Play size={16} color="#fff" />} />
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
      <Text style={{ color: c.textMuted, fontSize: 12, marginLeft: 4, marginBottom: 7, fontWeight: '700' }}>{title}</Text>
      <View style={{ backgroundColor: c.surface, borderRadius: 17, paddingHorizontal: 13 }}>{children}</View>
    </View>
  );
}

function Row({ icon, label, value, onPress, c }: { icon: ReactNode; label: string; value?: string; onPress: () => void; c: Palette }) {
  return (
    <Pressable onPress={onPress} style={[styles.settingRow, { borderBottomColor: c.border }]}>
      <View style={[styles.iconSoft, { backgroundColor: c.surface2 }]}>{icon}</View>
      <Text style={{ color: c.text, fontWeight: '800', flex: 1 }}>{label}</Text>
      {value ? <Text style={{ color: c.textMuted, fontSize: 12 }}>{value}</Text> : null}
      <ChevronRight size={14} color={c.textMuted} />
    </Pressable>
  );
}

function Labeled({ c, label, value, onChange, editable = true }: { c: Palette; label: string; value: string; onChange?: (v: string) => void; editable?: boolean }) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={{ color: c.textMuted, fontSize: 12, fontWeight: '700' }}>{label}</Text>
      <TextInput editable={editable} value={value} onChangeText={onChange} style={[styles.field, { color: c.text, backgroundColor: c.bg, borderColor: c.border }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  profile: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 15, borderRadius: 17 },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  avatarLg: { width: 64, height: 64, borderRadius: 32, backgroundColor: '#E0E7FF' },
  edit: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
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
  field: { height: 46, borderWidth: 1, borderRadius: 12, paddingHorizontal: 12 },
  accent: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  inline: { flexDirection: 'row', gap: 7, marginBottom: 12, padding: 10, borderRadius: 15 },
  inlineInput: { flex: 1, height: 40, borderRadius: 10, paddingHorizontal: 10 },
  addBtn: { height: 40, paddingHorizontal: 14, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  member: { minHeight: 66, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  memberAv: { width: 36, height: 36, borderRadius: 12, backgroundColor: '#DFE6FF', alignItems: 'center', justifyContent: 'center' },
  remove: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  centerHero: { padding: 25, marginBottom: 13, borderRadius: 22, alignItems: 'center', gap: 6 },
  method: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  methodMark: { width: 34, height: 34, borderRadius: 11, backgroundColor: '#3155E4', alignItems: 'center', justifyContent: 'center' },
  exportRow: { minHeight: 62, flexDirection: 'row', alignItems: 'center', gap: 10, borderBottomWidth: StyleSheet.hairlineWidth },
  aboutHero: { height: 320, borderRadius: 25, overflow: 'hidden', marginBottom: 14, backgroundColor: '#081659' },
});
