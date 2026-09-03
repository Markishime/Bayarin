import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft, Bell, CalendarDays, Check, ChevronRight, Landmark, Moon, ShieldCheck,
  Smartphone, Sun, Users, Zap,
} from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrefSwitch, PrimaryButton } from '../components/ui';
import { images, serviceIds } from '../data';
import { languageOptions, type Copy } from '../i18n';
import { useLayout } from '../layout';
import { Float3D, OrbitOrb, SceneArt, ScreenTransition } from '../motion';
import { gradient, type Palette } from '../theme';
import type { Lang, OnboardingDraft, Screen } from '../types';

const FEATURE_STEPS = ['intro', 'bills', 'reminders', 'load', 'lingkod', 'household', 'privacy'] as const;
const ALL_STEPS = ['language', ...FEATURE_STEPS, 'services', 'notifications', 'theme', 'home', 'ready'] as const;
type Step = (typeof ALL_STEPS)[number];

const featureMeta: Record<(typeof FEATURE_STEPS)[number], { Icon: typeof CalendarDays; imageShift?: object }> = {
  intro: { Icon: CalendarDays },
  bills: { Icon: CalendarDays },
  reminders: { Icon: Bell },
  load: { Icon: Smartphone },
  lingkod: { Icon: Landmark },
  household: { Icon: Users },
  privacy: { Icon: ShieldCheck },
};

export function OnboardingScreen({
  go, finish, t, c, lang, setLang, dark, setDark, draft, setDraft,
}: {
  go: (s: Screen) => void;
  finish?: () => void;
  t: Copy;
  c: Palette;
  lang: Lang;
  setLang: (l: Lang) => void;
  dark: boolean;
  setDark: (v: boolean) => void;
  draft: OnboardingDraft;
  setDraft: (next: OnboardingDraft) => void;
}) {
  const insets = useSafeAreaInsets();
  const layout = useLayout();
  const [step, setStep] = useState<Step>('language');
  const index = ALL_STEPS.indexOf(step);
  const last = ALL_STEPS.length - 1;
  const complete = () => (finish ? finish() : go('signup'));
  const next = () => {
    if (index >= last) complete();
    else setStep(ALL_STEPS[index + 1]);
  };
  const back = () => {
    if (index === 0) go('welcome');
    else setStep(ALL_STEPS[index - 1]);
  };

  const featureCopy = useMemo(() => ({
    intro: { eyebrow: t.onboarding.introEyebrow, title: t.onboarding.introTitle, body: t.onboarding.introBody, chip: t.welcome.featureOrg },
    bills: { eyebrow: t.onboarding.billsEyebrow, title: t.onboarding.billsTitle, body: t.onboarding.billsBody, chip: t.onboarding.billsChip },
    reminders: { eyebrow: t.onboarding.remindersEyebrow, title: t.onboarding.remindersTitle, body: t.onboarding.remindersBody, chip: t.onboarding.remindersChip },
    load: { eyebrow: t.onboarding.loadEyebrow, title: t.onboarding.loadTitle, body: t.onboarding.loadBody, chip: t.onboarding.loadChip },
    lingkod: { eyebrow: t.onboarding.lingkodEyebrow, title: t.onboarding.lingkodTitle, body: t.onboarding.lingkodBody, chip: t.onboarding.lingkodChip },
    household: { eyebrow: t.onboarding.householdEyebrow, title: t.onboarding.householdTitle, body: t.onboarding.householdBody, chip: t.onboarding.householdChip },
    privacy: { eyebrow: t.onboarding.privacyEyebrow, title: t.onboarding.privacyTitle, body: t.onboarding.privacyBody, chip: t.onboarding.privacyChip },
  }), [t]);

  const cta = step === 'ready' ? t.onboarding.readyCta : step === 'language' ? t.onboarding.continue : t.onboarding.continue;

  return (
    <View style={[styles.root, { backgroundColor: c.bg, paddingTop: insets.top + 6 }]}>
      <View style={styles.topBar}>
        <Pressable onPress={back} style={styles.iconBtn} accessibilityLabel={t.onboarding.back}>
          <ArrowLeft size={18} color={c.textMuted} />
        </Pressable>
        <Text style={[styles.stepLabel, { color: c.textMuted }]}>
          {t.onboarding.stepLabel} {index + 1} {t.onboarding.of} {ALL_STEPS.length}
        </Text>
        <Pressable onPress={complete}>
          <Text style={[styles.skip, { color: c.textMuted }]}>{t.onboarding.skip}</Text>
        </Pressable>
      </View>
      <View style={styles.progressTrack}>
        {ALL_STEPS.map((id, i) => (
          <View key={id} style={[styles.progressSeg, { backgroundColor: i <= index ? c.primary : c.border }]} />
        ))}
      </View>

      <View style={[styles.body, { maxWidth: 720, width: '100%', alignSelf: 'center' }]}>
        <ScreenTransition key={step} id={step}>
        {step === 'language' && (
          <View style={styles.pad}>
            <Text style={[styles.eyebrow, { color: c.primary }]}>{t.onboarding.languageEyebrow}</Text>
            <Text style={[styles.h1, { color: c.text }]}>{t.onboarding.languageTitle}</Text>
            <Text style={[styles.bodyText, { color: c.textMuted }]}>{t.onboarding.languageBody}</Text>
            <View style={{ gap: 10, marginTop: 22 }}>
              {languageOptions.map((opt) => {
                const meta = t.langs[opt.id];
                const selected = lang === opt.id;
                return (
                  <Pressable key={opt.id} onPress={() => setLang(opt.id)}
                    style={[styles.langCard, { backgroundColor: c.surface, borderColor: selected ? c.primary : c.border }]}>
                    <View style={[styles.langCode, { backgroundColor: selected ? c.primary : c.primarySoft }]}>
                      <Text style={{ color: selected ? '#fff' : c.primary, fontWeight: '900', fontSize: 12 }}>{opt.code}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.langName, { color: c.text }]}>{meta.native}</Text>
                      <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 2 }}>{meta.hello} {meta.sample}</Text>
                    </View>
                    <View style={[styles.radio, { borderColor: selected ? c.primary : c.border, backgroundColor: selected ? c.primary : 'transparent' }]}>
                      {selected && <Check size={12} color="#fff" />}
                    </View>
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {(FEATURE_STEPS as readonly string[]).includes(step) && (
          <View style={{ flex: 1 }}>
            <View style={[styles.visualWrap, { height: layout.heroH, marginHorizontal: layout.pad }]}>
              <OrbitOrb size={90} color="rgba(111,140,255,0.45)" radiusX={70} radiusY={40} duration={8000} />
              <SceneArt source={images.onboarding} height={layout.heroH} />
              <View style={styles.focus}>
                {(() => {
                  const Icon = featureMeta[step as (typeof FEATURE_STEPS)[number]].Icon;
                  return <Icon size={22} color="#3449D9" />;
                })()}
              </View>
              <Float3D intensity={0.9} style={styles.floatCard}>
                {step === 'bills' || step === 'intro' ? <Zap size={16} color="#293FBD" /> :
                  step === 'reminders' ? <Bell size={16} color="#293FBD" /> :
                  step === 'load' ? <Smartphone size={16} color="#293FBD" /> :
                  step === 'lingkod' ? <Landmark size={16} color="#293FBD" /> :
                  step === 'household' ? <Users size={16} color="#293FBD" /> :
                  <ShieldCheck size={16} color="#293FBD" />}
                <Text style={styles.floatText}>{featureCopy[step as (typeof FEATURE_STEPS)[number]].chip}</Text>
              </Float3D>
            </View>
            <View style={styles.pad}>
              <Text style={[styles.eyebrow, { color: c.primary }]}>{featureCopy[step as (typeof FEATURE_STEPS)[number]].eyebrow}</Text>
              <Text style={[styles.h1, { color: c.text }]}>{featureCopy[step as (typeof FEATURE_STEPS)[number]].title}</Text>
              <Text style={[styles.bodyText, { color: c.textMuted }]}>{featureCopy[step as (typeof FEATURE_STEPS)[number]].body}</Text>
              {step === 'privacy' && (
                <View style={[styles.note, { backgroundColor: c.primarySoft }]}>
                  <ShieldCheck size={20} color={c.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: c.primary, fontWeight: '800', fontSize: 13 }}>{t.onboarding.privacyNoteTitle}</Text>
                    <Text style={{ color: c.primary, fontSize: 11, marginTop: 2 }}>{t.onboarding.privacyNoteBody}</Text>
                  </View>
                </View>
              )}
            </View>
          </View>
        )}

        {step === 'services' && (
          <View style={styles.pad}>
            <Text style={[styles.eyebrow, { color: c.primary }]}>{t.onboarding.servicesEyebrow}</Text>
            <Text style={[styles.h1, { color: c.text }]}>{t.onboarding.servicesTitle}</Text>
            <Text style={[styles.bodyText, { color: c.textMuted }]}>{t.onboarding.servicesBody}</Text>
            <View style={styles.serviceGrid}>
              {serviceIds.map((id) => {
                const selected = draft.services.includes(id);
                return (
                  <Pressable key={id} onPress={() => {
                    const nextServices = selected ? draft.services.filter((s) => s !== id) : [...draft.services, id];
                    setDraft({ ...draft, services: nextServices.length ? nextServices : [id] });
                  }} style={[styles.serviceTile, { backgroundColor: selected ? c.primarySoft : c.surface, borderColor: selected ? c.primary : c.border }]}>
                    <Text style={[styles.serviceLabel, { color: selected ? c.primary : c.text }]}>{t.services[id]}</Text>
                    {selected && <Check size={14} color={c.primary} />}
                  </Pressable>
                );
              })}
            </View>
          </View>
        )}

        {step === 'notifications' && (
          <View style={styles.pad}>
            <Text style={[styles.eyebrow, { color: c.primary }]}>{t.onboarding.notifEyebrow}</Text>
            <Text style={[styles.h1, { color: c.text }]}>{t.onboarding.notifTitle}</Text>
            <Text style={[styles.bodyText, { color: c.textMuted }]}>{t.onboarding.notifBody}</Text>
            <View style={[styles.sheet, { backgroundColor: c.surface, borderColor: c.border }]}>
              <PrefSwitch title={t.onboarding.dueSoon} hint={t.onboarding.dueSoonHint} value={draft.dueSoon} onValueChange={(v) => setDraft({ ...draft, dueSoon: v })} c={c} />
              <PrefSwitch title={t.onboarding.weekly} hint={t.onboarding.weeklyHint} value={draft.weeklySummary} onValueChange={(v) => setDraft({ ...draft, weeklySummary: v })} c={c} />
              <PrefSwitch title={t.onboarding.loadPref} hint={t.onboarding.loadPrefHint} value={draft.loadReminders} onValueChange={(v) => setDraft({ ...draft, loadReminders: v })} c={c} />
              <PrefSwitch title={t.onboarding.lingkodPref} hint={t.onboarding.lingkodPrefHint} value={draft.lingkodDeadlines} onValueChange={(v) => setDraft({ ...draft, lingkodDeadlines: v })} c={c} />
            </View>
          </View>
        )}

        {step === 'theme' && (
          <View style={styles.pad}>
            <Text style={[styles.eyebrow, { color: c.primary }]}>{t.onboarding.themeEyebrow}</Text>
            <Text style={[styles.h1, { color: c.text }]}>{t.onboarding.themeTitle}</Text>
            <Text style={[styles.bodyText, { color: c.textMuted }]}>{t.onboarding.themeBody}</Text>
            <View style={styles.themeRow}>
              <Pressable onPress={() => setDark(false)} style={[styles.themeCard, { borderColor: !dark ? c.primary : c.border, backgroundColor: c.surface }]}>
                <View style={[styles.themePreview, { backgroundColor: '#F7F4EF' }]}>
                  <LinearGradient colors={[...gradient.hero]} style={styles.themeBar} />
                  <View style={styles.themeLine} />
                  <View style={[styles.themeLine, { width: '65%' }]} />
                </View>
                <View style={styles.themeLabel}><Sun size={14} color={c.text} /><Text style={{ color: c.text, fontWeight: '800' }}>{t.onboarding.themeLight}</Text></View>
              </Pressable>
              <Pressable onPress={() => setDark(true)} style={[styles.themeCard, { borderColor: dark ? c.primary : c.border, backgroundColor: c.surface }]}>
                <View style={[styles.themePreview, { backgroundColor: '#151412' }]}>
                  <LinearGradient colors={[...gradient.hero]} style={styles.themeBar} />
                  <View style={[styles.themeLine, { backgroundColor: '#272522' }]} />
                  <View style={[styles.themeLine, { width: '65%', backgroundColor: '#272522' }]} />
                </View>
                <View style={styles.themeLabel}><Moon size={14} color={c.text} /><Text style={{ color: c.text, fontWeight: '800' }}>{t.onboarding.themeDark}</Text></View>
              </Pressable>
            </View>
          </View>
        )}

        {step === 'home' && (
          <View style={styles.pad}>
            <Text style={[styles.eyebrow, { color: c.primary }]}>{t.onboarding.homeEyebrow}</Text>
            <Text style={[styles.h1, { color: c.text }]}>{t.onboarding.homeTitle}</Text>
            <Text style={[styles.bodyText, { color: c.textMuted }]}>{t.onboarding.homeBody}</Text>
            <View style={[styles.inputWrap, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Users size={18} color={c.primary} />
              <TextInput
                value={draft.householdName}
                onChangeText={(householdName) => setDraft({ ...draft, householdName })}
                placeholder={t.onboarding.homePlaceholder}
                placeholderTextColor={c.textSoft}
                style={[styles.input, { color: c.text }]}
              />
            </View>
          </View>
        )}

        {step === 'ready' && (
          <View style={[styles.pad, { alignItems: 'center', paddingTop: 24 }]}>
            <LinearGradient colors={[...gradient.hero]} style={styles.readyHero}>
              <Image source={images.onboarding} style={styles.readyImg} />
              <View style={styles.readyCheck}><Check size={26} color="#fff" /></View>
            </LinearGradient>
            <Text style={[styles.eyebrow, { color: c.primary, marginTop: 22 }]}>{t.onboarding.readyEyebrow}</Text>
            <Text style={[styles.h1, { color: c.text, textAlign: 'center' }]}>{t.onboarding.readyTitle}</Text>
            <Text style={[styles.bodyText, { color: c.textMuted, textAlign: 'center' }]}>{t.onboarding.readyBody}</Text>
          </View>
        )}
        </ScreenTransition>
      </View>

      <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
        <PrimaryButton
          title={cta}
          onPress={next}
          c={c}
          icon={<ChevronRight size={18} color="#fff" />}
        />
        <Pressable onPress={() => go('login')} style={{ marginTop: 14, alignItems: 'center' }}>
          <Text style={{ color: c.textMuted, fontSize: 13 }}>
            {t.onboarding.already} <Text style={{ color: c.primary, fontWeight: '800' }}>{t.brand.login}</Text>
          </Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, minHeight: 0, overflow: 'hidden' },
  topBar: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 18, height: 44 },
  iconBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  skip: { fontSize: 13, fontWeight: '800' },
  stepLabel: { fontSize: 12, fontWeight: '700' },
  progressTrack: { flexDirection: 'row', gap: 4, paddingHorizontal: 20, marginTop: 6 },
  progressSeg: { flex: 1, height: 4, borderRadius: 4 },
  body: { flex: 1 },
  pad: { paddingHorizontal: 24, paddingTop: 22 },
  eyebrow: { fontSize: 11, letterSpacing: 1.4, fontWeight: '800' },
  h1: { fontSize: 28, lineHeight: 34, letterSpacing: -0.8, fontWeight: '800', marginTop: 10 },
  bodyText: { fontSize: 15, lineHeight: 22, marginTop: 10 },
  visualWrap: { marginTop: 14, borderRadius: 28, overflow: 'hidden', backgroundColor: '#0C1E7D' },
  focus: { position: 'absolute', right: 18, top: 18, width: 45, height: 45, borderRadius: 15, backgroundColor: 'rgba(255,255,255,0.92)', alignItems: 'center', justifyContent: 'center' },
  floatCard: { position: 'absolute', left: 16, bottom: 16, flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: 'rgba(255,255,255,0.9)', paddingHorizontal: 14, paddingVertical: 12, borderRadius: 13 },
  floatText: { color: '#293FBD', fontWeight: '800', fontSize: 12 },
  note: { flexDirection: 'row', alignItems: 'center', gap: 11, padding: 12, borderRadius: 14, marginTop: 18 },
  langCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, borderWidth: 1.5 },
  langCode: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  langName: { fontSize: 16, fontWeight: '800' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  serviceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 20 },
  serviceTile: { width: '47%', minHeight: 56, borderRadius: 16, borderWidth: 1.5, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  serviceLabel: { fontSize: 14, fontWeight: '800' },
  sheet: { marginTop: 18, borderRadius: 18, paddingHorizontal: 14, borderWidth: 1 },
  themeRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  themeCard: { flex: 1, borderWidth: 2, borderRadius: 18, padding: 8 },
  themePreview: { height: 110, borderRadius: 12, padding: 14, gap: 8 },
  themeBar: { height: 30, borderRadius: 8 },
  themeLine: { height: 12, borderRadius: 5, backgroundColor: '#fff' },
  themeLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8 },
  inputWrap: { marginTop: 20, height: 54, borderRadius: 16, borderWidth: 1, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  input: { flex: 1, fontSize: 16, fontWeight: '600' },
  readyHero: { width: 200, height: 160, borderRadius: 36, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  readyImg: { width: '100%', height: '100%' },
  readyCheck: { position: 'absolute', right: 12, bottom: 12, width: 52, height: 52, borderRadius: 26, backgroundColor: '#1BA968', alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: 'rgba(255,255,255,0.85)' },
  footer: { paddingHorizontal: 24, paddingTop: 8, width: '100%' },
});
