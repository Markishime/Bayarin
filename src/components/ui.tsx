import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft, Bell, Home, Landmark, Plus, ReceiptText, UserRound,
} from 'lucide-react-native';
import type { ReactNode } from 'react';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View,
  type TextInputProps, type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, {
  Easing, interpolate, useAnimatedStyle, useSharedValue, withSpring, withTiming,
} from 'react-native-reanimated';
import { useLayout } from '../layout';
import { Float3D, PressScale, Pulse3D } from '../motion';
import { images } from '../data';
import { fade, gradient, toneColor, type Palette } from '../theme';
import type { Copy } from '../i18n';
import type { Screen } from '../types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

export function BrandMark({ size = 78, fontSize = 48 }: { size?: number; fontSize?: number }) {
  return (
    <Float3D intensity={1.2}>
      <LinearGradient colors={[...gradient.mark]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
        style={[styles.mark, { width: size, height: size, borderRadius: size * 0.28 }]}>
        <Text style={[styles.markText, { fontSize }]}>B</Text>
      </LinearGradient>
    </Float3D>
  );
}

export function BrandLogo({ inverted, compact, c }: { inverted?: boolean; compact?: boolean; c?: Palette }) {
  return (
    <View style={styles.logoRow}>
      <BrandMark size={compact ? 32 : 40} fontSize={compact ? 18 : 24} />
      <View>
        <Text style={[styles.logoName, { color: inverted ? '#F5F8FF' : c?.text ?? '#1B2540' }]}>Bayarin</Text>
        {!compact && (
          <Text style={[styles.logoTag, { color: inverted ? '#D5DCF0' : c?.textMuted ?? '#4A5874' }]}>Bayad. Organisado. Panatag.</Text>
        )}
      </View>
    </View>
  );
}

export function ProviderMark({ tone, letter, size = 32 }: { tone: string; letter: string; size?: number }) {
  const base = toneColor[tone] ?? toneColor.indigo;
  return (
    <LinearGradient colors={[base, '#4D6AE8']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={[styles.provider, { width: size, height: size, borderRadius: size * 0.34, shadowColor: base }]}>
      <View style={styles.providerHighlight} /><Text style={[styles.providerLetter, { fontSize: size * 0.42 }]}>{letter}</Text>
    </LinearGradient>
  );
}

export function CinematicHero({
  pose = 'home',
  height = 168,
  title,
  subtitle,
  c,
  children,
}: {
  pose?: 'home' | 'bills' | 'services' | 'calendar' | 'government' | 'profile';
  height?: number;
  title?: string;
  subtitle?: string;
  c: Palette;
  children?: ReactNode;
}) {
  const source =
    pose === 'bills' ? images.billsHero
      : pose === 'services' ? images.servicesHero
        : pose === 'calendar' ? images.calendarHeroV2
          : pose === 'government' ? images.lingkodHero
            : pose === 'profile' ? images.profileHero
              : images.homeHero;

  return (
    <View
      style={[styles.cinematicHero, { height, backgroundColor: c.surface, borderColor: c.border, shadowColor: c.shadow }]}
      accessibilityLabel="Bayarin companion illustration"
    >
      <Image source={source} resizeMode="cover" style={StyleSheet.absoluteFill} />
      <View style={[StyleSheet.absoluteFill, { backgroundColor: fade(c.bg, 0.22), pointerEvents: 'none' }]} />
      <LinearGradient
        colors={[c.surface, c.surface, fade(c.surface, 0.94), fade(c.surface, 0)]}
        locations={[0, 0.36, 0.56, 0.84]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.heroCopy}>
        {title ? <Text style={[styles.heroTitle, { color: c.text }]}>{title}</Text> : null}
        {subtitle ? <Text style={[styles.heroSub, { color: c.textMuted }]}>{subtitle}</Text> : null}
        {children}
      </View>
    </View>
  );
}

export function StatusPill({ status, c }: { status: string; c: Palette }) {
  const key = status.toLowerCase();
  const bg = key.includes('overdue') ? c.dangerSoft : key.includes('due') ? c.warningSoft : key.includes('paid') ? c.successSoft : c.surface2;
  const color = key.includes('overdue') ? c.danger : key.includes('due') ? c.warning : key.includes('paid') ? c.success : c.textMuted;
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.pillText, { color }]}>{status}</Text>
    </View>
  );
}

function ShimmerBar({ style }: { style?: ViewStyle }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.sin) }, () => { t.value = 0; });
  }, [t]);
  const anim = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(t.value, [0, 1], [-120, 260]) }],
  }));
  return (
    <Animated.View style={[{ position: 'absolute', top: 0, bottom: 0, width: 80, backgroundColor: 'rgba(255,255,255,0.18)', borderRadius: 12 }, anim, style]} />
  );
}

export function PrimaryButton({
  title, onPress, light, disabled, loading, icon, c,
}: {
  title: string; onPress: () => void; light?: boolean; disabled?: boolean; loading?: boolean; icon?: ReactNode; c: Palette;
}) {
  const scale = useSharedValue(1);
  const bg = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  const handleIn = () => { scale.value = withSpring(0.97, { damping: 14, stiffness: 350 }); };
  const handleOut = () => { scale.value = withSpring(1, { damping: 10, stiffness: 280 }); };

  if (light) {
    return (
      <PressScale onPress={onPress} disabled={disabled}>
        <Animated.View style={[styles.btn, { backgroundColor: '#F5F8FF' }, bg]}>
          {loading && <ShimmerBar />}
          <Text style={[styles.btnText, { color: '#244CC0' }]}>{title}</Text>
          {icon}
        </Animated.View>
      </PressScale>
    );
  }
  return (
    <AnimatedPressable
      onPressIn={handleIn}
      onPressOut={handleOut}
      onPress={onPress}
      disabled={disabled || loading}
      style={[bg, { opacity: disabled ? 0.55 : 1 }]}
    >
      <LinearGradient colors={[...gradient.button]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.btn}>
        {loading ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <ActivityIndicator color={c.onPrimary} size="small" />
            <ShimmerBar />
          </View>
        ) : (
          <>
            <Text style={[styles.btnText, { color: c.onPrimary }]}>{title}</Text>
            {icon}
          </>
        )}
      </LinearGradient>
    </AnimatedPressable>
  );
}

export function SecondaryButton({ title, onPress, c, icon }: { title: string; onPress: () => void; c: Palette; icon?: ReactNode }) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      onPressIn={() => { scale.value = withSpring(0.97, { damping: 14, stiffness: 350 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 10, stiffness: 280 }); }}
      onPress={onPress}
      style={[styles.btn, styles.secondaryBtn, { borderColor: c.border, backgroundColor: c.surface }, anim]}
    >
      {icon}
      <Text style={[styles.btnText, { color: c.text, fontSize: 15 }]}>{title}</Text>
    </AnimatedPressable>
  );
}

export function AppHeader({
  title, onBack, trailing, c,
}: { title: string; onBack?: () => void; trailing?: ReactNode; c: Palette }) {
  const insets = useSafeAreaInsets();
  const layout = useLayout();
  return (
    <View style={[styles.header, { paddingTop: Math.max(insets.top, 8), paddingHorizontal: layout.pad, backgroundColor: c.bg, borderBottomColor: c.border }]}>
      {onBack ? (
        <Pressable onPress={onBack} style={[styles.headerBtn, { backgroundColor: c.surface, borderColor: c.border, shadowColor: c.shadow }]} accessibilityLabel="Go back">
          <ArrowLeft size={18} color={c.text} />
        </Pressable>
      ) : <View style={styles.headerSpacer} />}
      <View style={styles.headerTitleWrap}>
        <View style={styles.headerMark}><Text style={styles.headerMarkText}>B</Text></View>
        <Text style={[styles.headerTitle, { color: c.text }]} numberOfLines={1}>{title}</Text>
      </View>
      {trailing ?? <View style={styles.headerSpacer} />}
    </View>
  );
}

export function HeaderIcon({ onPress, c, children, notify, label }: { onPress: () => void; c: Palette; children: ReactNode; notify?: boolean; label?: string }) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  return (
    <AnimatedPressable
      onPressIn={() => { scale.value = withSpring(0.88, { damping: 14, stiffness: 350 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 10, stiffness: 280 }); }}
      onPress={onPress}
      accessibilityLabel={label}
      style={[styles.headerBtn, { backgroundColor: c.surface, borderColor: c.border, shadowColor: c.shadow }, anim]}
    >
      {children}
      {notify && <View style={[styles.dot, { backgroundColor: c.danger, borderColor: c.surface }]} />}
    </AnimatedPressable>
  );
}

export function ScreenScroll({ children, withNav, padded = true }: { children: ReactNode; withNav?: boolean; padded?: boolean }) {
  const layout = useLayout();
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: padded ? layout.pad : 0, paddingTop: padded ? 10 : 0, paddingBottom: withNav ? 124 : 40, width: '100%' }}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
    >
      {children}
    </ScrollView>
  );
}

export function BottomNav({ screen, go, c, t }: { screen: Screen; go: (s: Screen) => void; c: Palette; t: Copy }) {
  const insets = useSafeAreaInsets();
  const items: { key: Screen; label: string; Icon: typeof Home; add?: boolean }[] = [
    { key: 'home', label: t.nav.home, Icon: Home },
    { key: 'bills', label: t.nav.bills, Icon: ReceiptText },
    { key: 'add-bill', label: t.nav.add, Icon: Plus, add: true },
    { key: 'lingkod', label: t.nav.lingkod, Icon: Landmark },
    { key: 'settings', label: t.nav.profile, Icon: UserRound },
  ];
  return (
    <View style={[styles.nav, { paddingBottom: Math.max(insets.bottom, 10), backgroundColor: c.nav, borderColor: c.border, shadowColor: c.shadow }]}>
      {items.map(({ key, label, Icon, add }) => {
        const active = screen === key;
        if (add) {
          return (
            <Pressable key={key} onPress={() => go(key)} style={styles.navItem} accessibilityLabel={label}>
              <Pulse3D>
                <LinearGradient colors={[...gradient.button]} style={styles.addBtn}>
                  <Plus size={22} color={c.onPrimary} />
                </LinearGradient>
              </Pulse3D>
              <Text style={[styles.navLabel, { color: c.textMuted, marginTop: 6 }]}>{label}</Text>
            </Pressable>
          );
        }
        return (
          <NavItem key={key} active={active} onPress={() => go(key)} c={c} label={label}>
            <Icon size={20} color={active ? c.primary : c.textMuted} strokeWidth={active ? 2.4 : 2} />
            <Text style={[styles.navLabel, { color: active ? c.primary : c.textMuted, fontWeight: active ? '800' : '700' }]}>{label}</Text>
            {active ? <View style={[styles.navDot, { backgroundColor: c.primary }]} /> : <View style={styles.navDotSpacer} />}
          </NavItem>
        );
      })}
    </View>
  );
}

function NavItem({ active, onPress, c, children, label }: { active: boolean; onPress: () => void; c: Palette; children: ReactNode; label: string }) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return (
    <AnimatedPressable
      onPressIn={() => { scale.value = withSpring(0.88, { damping: 14, stiffness: 350 }); }}
      onPressOut={() => { scale.value = withSpring(1, { damping: 10, stiffness: 280 }); }}
      onPress={onPress}
      accessibilityLabel={label}
      accessibilityState={{ selected: active }}
      style={[styles.navItem, anim]}
    >
      {children}
    </AnimatedPressable>
  );
}

export function Field({
  label, c, icon, onFocus, onBlur, editable = true, ...props
}: { label: string; c: Palette; icon?: ReactNode; value?: string } & TextInputProps) {
  const [focused, setFocused] = useState(false);
  const focusProgress = useSharedValue(0);

  useEffect(() => {
    focusProgress.value = withTiming(focused ? 1 : 0, {
      duration: 220,
      easing: Easing.out(Easing.quad),
    });
  }, [focused, focusProgress]);

  const borderAnim = useAnimatedStyle(() => ({
    borderColor: focused ? c.primary : c.border,
    shadowRadius: interpolate(focusProgress.value, [0, 1], [0, 10]),
    shadowOpacity: interpolate(focusProgress.value, [0, 1], [0, 0.12]),
  }));

  return (
    <View style={{ gap: 6 }}>
      <Text style={[styles.fieldLabel, { color: focused ? c.primary : c.textMuted }]}>{label}</Text>
      <Animated.View style={[styles.field, { backgroundColor: c.bgElevated, shadowColor: c.primary, borderColor: c.border }, borderAnim]}>
        {icon}
        <TextInput
          placeholderTextColor={c.textSoft}
          editable={editable}
          accessibilityLabel={label}
          style={[styles.input, { color: editable ? c.text : c.textMuted }]}
          onFocus={(event) => { setFocused(true); onFocus?.(event); }}
          onBlur={(event) => { setFocused(false); onBlur?.(event); }}
          {...props}
        />
      </Animated.View>
    </View>
  );
}

export function Card({ children, c, style, onPress }: { children: ReactNode; c: Palette; style?: ViewStyle; onPress?: () => void }) {
  const scale = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

  if (onPress) {
    return (
      <AnimatedPressable
        onPressIn={() => { scale.value = withSpring(0.98, { damping: 14, stiffness: 350 }); }}
        onPressOut={() => { scale.value = withSpring(1, { damping: 10, stiffness: 280 }); }}
        onPress={onPress}
        style={[styles.card, { backgroundColor: c.surface, borderColor: c.border, shadowColor: c.shadow }, anim, style]}
      >
        {children}
      </AnimatedPressable>
    );
  }

  return (
    <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border, shadowColor: c.shadow }, style]}>
      {children}
    </View>
  );
}

export function InfoBanner({ children, c, icon, tone = 'info' }: { children: string; c: Palette; icon?: ReactNode; tone?: 'info' | 'warning' | 'danger' }) {
  const bg = tone === 'warning' ? c.warningSoft : tone === 'danger' ? c.dangerSoft : c.primarySoft;
  const color = tone === 'warning' ? c.warning : tone === 'danger' ? c.danger : c.text;
  const iconColor = tone === 'warning' ? c.warning : tone === 'danger' ? c.danger : c.primary;
  return (
    <View style={[styles.banner, { backgroundColor: bg }]}>
      {icon ?? <Bell size={15} color={iconColor} />}
      <Text style={[styles.bannerText, { color }]}>{children}</Text>
    </View>
  );
}

export function PrefSwitch({
  title, hint, value, onValueChange, c,
}: { title: string; hint: string; value: boolean; onValueChange: (v: boolean) => void; c: Palette }) {
  return (
    <View style={[styles.prefRow, { borderBottomColor: c.border }]}>
      <View style={{ flex: 1 }}>
        <Text style={[styles.prefTitle, { color: c.text }]}>{title}</Text>
        <Text style={[styles.prefHint, { color: c.textMuted }]}>{hint}</Text>
      </View>
      <Switch value={value} onValueChange={onValueChange} trackColor={{ true: c.primary, false: c.border }} />
    </View>
  );
}

const styles = StyleSheet.create({
  mark: { alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(255,255,255,0.28)' },
  markText: { color: '#F5F8FF', fontWeight: '900', fontStyle: 'italic' },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoName: { fontSize: 18, fontWeight: '800', letterSpacing: -0.4 },
  logoTag: { fontSize: 10, marginTop: 2 },
  provider: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden', shadowOpacity: 0.2, shadowRadius: 6, shadowOffset: { width: 0, height: 4 }, elevation: 3 },
  providerHighlight: { position: 'absolute', width: '78%', height: '35%', top: -5, borderRadius: 99, backgroundColor: 'rgba(255,255,255,0.28)' },
  providerLetter: { color: '#F5F8FF', fontWeight: '900', fontStyle: 'italic' },
  cinematicHero: { marginBottom: 14, borderRadius: 22, overflow: 'hidden', borderWidth: 1, shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
  heroCopy: { width: '56%', paddingHorizontal: 16, paddingVertical: 14, justifyContent: 'center', zIndex: 1, minHeight: '100%', gap: 4 },
  heroTitle: { fontSize: 18, lineHeight: 24, fontWeight: '800', letterSpacing: -0.3 },
  heroSub: { fontSize: 13, lineHeight: 18 },
  pill: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  pillText: { fontSize: 11, fontWeight: '800' },
  btn: { minWidth: 132, height: 54, borderRadius: 16, paddingHorizontal: 19, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8, overflow: 'hidden', shadowColor: '#2E5FE0', shadowOpacity: 0.18, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 4 },
  btnText: { fontSize: 15, lineHeight: 20, fontWeight: '800', letterSpacing: -0.15 },
  secondaryBtn: { borderWidth: 1.25, shadowOpacity: 0 },
  header: { height: 'auto', paddingBottom: 12, flexDirection: 'row', alignItems: 'center', borderBottomWidth: StyleSheet.hairlineWidth },
  headerBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  headerSpacer: { width: 44, height: 44 },
  headerTitleWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  headerMark: { width: 21, height: 21, borderRadius: 6, backgroundColor: '#2E5FE0', alignItems: 'center', justifyContent: 'center' },
  headerMarkText: { color: '#F5F8FF', fontSize: 12, fontStyle: 'italic', fontWeight: '800' },
  headerTitle: { fontSize: 18, lineHeight: 23, fontWeight: '800', letterSpacing: -0.4 },
  dot: { position: 'absolute', top: 9, right: 9, width: 8, height: 8, borderRadius: 4, borderWidth: 2 },
  nav: { position: 'absolute', left: 10, right: 10, bottom: 10, flexDirection: 'row', paddingTop: 10, paddingHorizontal: 8, borderWidth: 1, borderRadius: 22, shadowOpacity: 0.1, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 8 },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3, minHeight: 48 },
  navLabel: { fontSize: 11, fontWeight: '700' },
  navDot: { width: 4, height: 4, borderRadius: 2, marginTop: 1 },
  navDotSpacer: { width: 4, height: 4, marginTop: 1 },
  addBtn: { width: 54, height: 54, borderRadius: 18, marginTop: -22, alignItems: 'center', justifyContent: 'center', shadowColor: '#2E5FE0', shadowOpacity: 0.28, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 6 },
  fieldLabel: { fontSize: 12, lineHeight: 16, letterSpacing: 0.2, fontWeight: '800' },
  field: { minHeight: 56, borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', gap: 10, shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.04, shadowRadius: 6, elevation: 1 },
  input: { flex: 1, fontSize: 16, lineHeight: 22, minHeight: 52, paddingVertical: 0, outlineWidth: 0, outlineStyle: 'solid', outlineColor: 'transparent' },
  card: { borderRadius: 20, padding: 16, borderWidth: 1, overflow: 'hidden', shadowOpacity: 0.07, shadowRadius: 14, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  banner: { flexDirection: 'row', gap: 10, padding: 14, borderRadius: 16, marginBottom: 16, alignItems: 'flex-start' },
  bannerText: { flex: 1, fontSize: 13, lineHeight: 19, fontWeight: '600' },
  prefRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  prefTitle: { fontSize: 15, fontWeight: '800' },
  prefHint: { fontSize: 13, lineHeight: 18, marginTop: 3 },
});
