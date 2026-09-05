import { ServiceArt } from '../components/Artwork';
import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft, Check, ChevronRight, Moon, Sun,
} from 'lucide-react-native';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PrefSwitch, PrimaryButton } from '../components/ui';
import { serviceIds } from '../data';
import { languageOptions, type Copy } from '../i18n';
import { ScreenTransition } from '../motion';
import { gradient, type Palette } from '../theme';
import type { Lang, OnboardingDraft, Screen } from '../types';

const ALL_STEPS = ['language', 'services', 'notifications', 'theme', 'ready'] as const;
type Step = (typeof ALL_STEPS)[number];

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

  const cta = step === 'ready' ? t.onboarding.readyCta : t.onboarding.continue;

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
                      <Text style={{ color: selected ? '#fff' : c.primary, fontWeight: '700', fontSize: 12 }}>{opt.code}</Text>
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
                    <ServiceArt kind={id} size={30} /><Text style={[styles.serviceLabel, { color: selected ? c.primary : c.text }]}>{t.services[id]}</Text>
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
                <View style={[styles.themePreview, { backgroundColor: '#EEF1F7' }]}>
                  <LinearGradient colors={[...gradient.hero]} style={styles.themeBar} />
                  <View style={styles.themeLine} />
                  <View style={[styles.themeLine, { width: '65%' }]} />
                </View>
                <View style={styles.themeLabel}><Sun size={14} color={c.text} /><Text style={{ color: c.text, fontWeight: '600' }}>{t.onboarding.themeLight}</Text></View>
              </Pressable>
              <Pressable onPress={() => setDark(true)} style={[styles.themeCard, { borderColor: dark ? c.primary : c.border, backgroundColor: c.surface }]}>
                <View style={[styles.themePreview, { backgroundColor: '#12182A' }]}>
                  <LinearGradient colors={[...gradient.hero]} style={styles.themeBar} />
                  <View style={[styles.themeLine, { backgroundColor: '#263352' }]} />
                  <View style={[styles.themeLine, { width: '65%', backgroundColor: '#263352' }]} />
                </View>
                <View style={styles.themeLabel}><Moon size={14} color={c.text} /><Text style={{ color: c.text, fontWeight: '600' }}>{t.onboarding.themeDark}</Text></View>
              </Pressable>
            </View>
          </View>
        )}

        {step === 'ready' && (
          <View style={[styles.pad, { alignItems: 'center', paddingTop: 24 }]}>
            <LinearGradient colors={[...gradient.hero]} style={styles.readyHero}>
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
            {t.onboarding.already} <Text style={{ color: c.primary, fontWeight: '600' }}>{t.brand.login}</Text>
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
  skip: { fontSize: 13, fontWeight: '600' },
  stepLabel: { fontSize: 12, fontWeight: '700' },
  progressTrack: { flexDirection: 'row', gap: 4, paddingHorizontal: 20, marginTop: 6 },
  progressSeg: { flex: 1, height: 4, borderRadius: 4 },
  body: { flex: 1 },
  pad: { paddingHorizontal: 24, paddingTop: 22 },
  eyebrow: { fontSize: 11, letterSpacing: 1.4, fontWeight: '600' },
  h1: { fontSize: 28, lineHeight: 34, letterSpacing: -0.8, fontWeight: '600', marginTop: 10 },
  bodyText: { fontSize: 15, lineHeight: 22, marginTop: 10 },
  langCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 18, borderWidth: 1.5 },
  langCode: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  langName: { fontSize: 16, fontWeight: '600' },
  radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center' },
  serviceGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 20 },
  serviceTile: { width: '47%', minHeight: 56, borderRadius: 16, borderWidth: 1.5, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  serviceLabel: { fontSize: 14, fontWeight: '600' },
  sheet: { marginTop: 18, borderRadius: 18, paddingHorizontal: 14, borderWidth: 1 },
  themeRow: { flexDirection: 'row', gap: 12, marginTop: 20 },
  themeCard: { flex: 1, borderWidth: 2, borderRadius: 18, padding: 8 },
  themePreview: { height: 110, borderRadius: 12, padding: 14, gap: 8 },
  themeBar: { height: 30, borderRadius: 8 },
  themeLine: { height: 12, borderRadius: 5, backgroundColor: '#fff' },
  themeLabel: { flexDirection: 'row', alignItems: 'center', gap: 6, padding: 8 },
  readyHero: { width: 200, height: 160, borderRadius: 36, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  readyCheck: { position: 'absolute', right: 12, bottom: 12, width: 52, height: 52, borderRadius: 26, backgroundColor: '#1BA968', alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: 'rgba(255,255,255,0.85)' },
  footer: { paddingHorizontal: 24, paddingTop: 8, width: '100%' },
});
