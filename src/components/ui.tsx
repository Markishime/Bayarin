import { LinearGradient } from 'expo-linear-gradient';
import {
  ArrowLeft, Bell, Check, ChevronRight, Home, Landmark, Plus, ReceiptText, UserRound,
} from 'lucide-react-native';
import type { ReactNode } from 'react';
import {
  ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, TextInput, View,
  type TextInputProps, type ViewStyle,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useLayout } from '../layout';
import { Float3D, PressScale, Pulse3D } from '../motion';
import { gradient, toneColor, type Palette } from '../theme';
import type { Copy } from '../i18n';
import type { Screen } from '../types';

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

export function BrandLogo({ inverted, compact }: { inverted?: boolean; compact?: boolean }) {
  return (
    <View style={styles.logoRow}>
      <BrandMark size={compact ? 32 : 40} fontSize={compact ? 18 : 24} />
      <View>
        <Text style={[styles.logoName, inverted && { color: '#fff' }]}>Bayarin</Text>
        {!compact && (
          <Text style={[styles.logoTag, inverted && { color: '#DCE3FF' }]}>Bayad. Organisado. Panatag.</Text>
        )}
      </View>
    </View>
  );
}

export function ProviderMark({ tone, letter, size = 32 }: { tone: string; letter: string; size?: number }) {
  return (
    <View style={[styles.provider, { width: size, height: size, borderRadius: size * 0.34, backgroundColor: toneColor[tone] ?? toneColor.indigo }]}>
      <Text style={[styles.providerLetter, { fontSize: size * 0.42 }]}>{letter}</Text>
    </View>
  );
}

export function StatusPill({ status, c }: { status: string; c: Palette }) {
  const key = status.toLowerCase();
  const bg = key.includes('overdue') ? c.dangerSoft : key.includes('due') ? c.warningSoft : key.includes('paid') ? c.primarySoft : c.surface2;
  const color = key.includes('overdue') ? c.danger : key.includes('due') ? c.warning : key.includes('paid') ? c.primary : c.textMuted;
  return (
    <View style={[styles.pill, { backgroundColor: bg }]}>
      <Text style={[styles.pillText, { color }]}>{status}</Text>
    </View>
  );
}

export function PrimaryButton({
  title, onPress, light, disabled, loading, icon, c,
}: {
  title: string; onPress: () => void; light?: boolean; disabled?: boolean; loading?: boolean; icon?: ReactNode; c: Palette;
}) {
  if (light) {
    return (
      <PressScale onPress={onPress} disabled={disabled}>
        <View style={[styles.btn, { backgroundColor: '#fff' }]}>
          <Text style={[styles.btnText, { color: '#253CC0' }]}>{title}</Text>
          {icon}
        </View>
      </PressScale>
    );
  }
  return (
    <PressScale onPress={onPress} disabled={disabled || loading} style={{ opacity: disabled ? 0.55 : 1 }}>
      <LinearGradient colors={[...gradient.button]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.btn}>
        {loading ? <ActivityIndicator color="#fff" /> : (
          <>
            <Text style={styles.btnText}>{title}</Text>
            {icon}
          </>
        )}
      </LinearGradient>
    </PressScale>
  );
}

export function SecondaryButton({ title, onPress, c, icon }: { title: string; onPress: () => void; c: Palette; icon?: ReactNode }) {
  return (
    <Pressable onPress={onPress} style={[styles.btn, styles.secondaryBtn, { borderColor: c.border, backgroundColor: c.surface }]}>
      {icon}
      <Text style={[styles.btnText, { color: c.text, fontSize: 15 }]}>{title}</Text>
    </Pressable>
  );
}

export function AppHeader({
  title, onBack, trailing, c,
}: { title: string; onBack?: () => void; trailing?: ReactNode; c: Palette }) {
  const insets = useSafeAreaInsets();
  return (
    <View style={[styles.header, { paddingTop: Math.max(insets.top, 8), backgroundColor: c.bg }]}>
      {onBack ? (
        <Pressable onPress={onBack} style={[styles.headerBtn, { backgroundColor: c.surface, shadowColor: c.shadow }]} accessibilityLabel="Go back">
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

export function HeaderIcon({ onPress, c, children, notify }: { onPress: () => void; c: Palette; children: ReactNode; notify?: boolean }) {
  return (
    <Pressable onPress={onPress} style={[styles.headerBtn, { backgroundColor: c.surface, shadowColor: c.shadow }]}>
      {children}
      {notify && <View style={[styles.dot, { backgroundColor: c.danger, borderColor: c.surface }]} />}
    </Pressable>
  );
}

export function ScreenScroll({ children, withNav, padded = true }: { children: ReactNode; withNav?: boolean; padded?: boolean }) {
  const layout = useLayout();
  return (
    <ScrollView
      style={{ flex: 1 }}
      contentContainerStyle={{ paddingHorizontal: padded ? layout.pad : 0, paddingBottom: withNav ? 118 : 36, width: '100%' }}
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
    <View style={[styles.nav, { paddingBottom: Math.max(insets.bottom, 10), backgroundColor: c.nav, borderTopColor: c.border }]}>
      {items.map(({ key, label, Icon, add }) => {
        const active = screen === key || (key === 'home' && screen === 'story');
        if (add) {
          return (
            <Pressable key={key} onPress={() => go(key)} style={styles.navItem}>
              <Pulse3D>
                <LinearGradient colors={[...gradient.button]} style={styles.addBtn}>
                  <Plus size={22} color="#fff" />
                </LinearGradient>
              </Pulse3D>
              <Text style={[styles.navLabel, { color: c.textMuted, marginTop: 6 }]}>{label}</Text>
            </Pressable>
          );
        }
        return (
          <Pressable key={key} onPress={() => go(key)} style={styles.navItem}>
            <Icon size={20} color={active ? c.primary : c.textMuted} />
            <Text style={[styles.navLabel, { color: active ? c.primary : c.textMuted }]}>{label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Field({
  label, c, icon, ...props
}: { label: string; c: Palette; icon?: ReactNode } & TextInputProps) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={[styles.fieldLabel, { color: c.text }]}>{label}</Text>
      <View style={[styles.field, { borderColor: c.border, backgroundColor: c.bg }]}>
        {icon}
        <TextInput
          placeholderTextColor={c.textSoft}
          style={[styles.input, { color: c.text }]}
          {...props}
        />
      </View>
    </View>
  );
}

export function Card({ children, c, style }: { children: ReactNode; c: Palette; style?: ViewStyle }) {
  return (
    <View style={[styles.card, { backgroundColor: c.surface, borderColor: c.border, shadowColor: c.shadow }, style]}>
      {children}
    </View>
  );
}

export function InfoBanner({ children, c, icon }: { children: string; c: Palette; icon?: ReactNode }) {
  return (
    <View style={[styles.banner, { backgroundColor: c.warningSoft }]}>
      {icon ?? <Bell size={15} color={c.warning} />}
      <Text style={[styles.bannerText, { color: c.warning }]}>{children}</Text>
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
  markText: { color: '#fff', fontWeight: '900', fontStyle: 'italic' },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  logoName: { fontSize: 18, fontWeight: '800', letterSpacing: -0.4, color: '#101528' },
  logoTag: { fontSize: 10, color: '#6B7190', marginTop: 2 },
  provider: { alignItems: 'center', justifyContent: 'center' },
  providerLetter: { color: '#fff', fontWeight: '900', fontStyle: 'italic' },
  pill: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  pillText: { fontSize: 10, fontWeight: '800' },
  btn: { height: 54, borderRadius: 16, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '800' },
  secondaryBtn: { borderWidth: 1 },
  header: { height: 'auto', paddingHorizontal: 16, paddingBottom: 10, flexDirection: 'row', alignItems: 'center' },
  headerBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center', shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  headerSpacer: { width: 44, height: 44 },
  headerTitleWrap: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  headerMark: { width: 21, height: 21, borderRadius: 6, backgroundColor: '#4969FF', alignItems: 'center', justifyContent: 'center' },
  headerMarkText: { color: '#fff', fontSize: 12, fontStyle: 'italic', fontWeight: '800' },
  headerTitle: { fontSize: 17, fontWeight: '800', letterSpacing: -0.3 },
  dot: { position: 'absolute', top: 9, right: 9, width: 8, height: 8, borderRadius: 4, borderWidth: 2 },
  nav: { position: 'absolute', left: 0, right: 0, bottom: 0, flexDirection: 'row', paddingTop: 8, paddingHorizontal: 8, borderTopWidth: StyleSheet.hairlineWidth },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 3 },
  navLabel: { fontSize: 10, fontWeight: '700' },
  addBtn: { width: 50, height: 50, borderRadius: 25, marginTop: -22, alignItems: 'center', justifyContent: 'center' },
  fieldLabel: { fontSize: 12, fontWeight: '800' },
  field: { height: 50, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: { flex: 1, fontSize: 15, height: 50 },
  card: { borderRadius: 20, padding: 16, borderWidth: 1, shadowOpacity: 0.08, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 2 },
  banner: { flexDirection: 'row', gap: 10, padding: 12, borderRadius: 14, marginBottom: 14, alignItems: 'flex-start' },
  bannerText: { flex: 1, fontSize: 12, lineHeight: 17, fontWeight: '600' },
  prefRow: { minHeight: 68, flexDirection: 'row', alignItems: 'center', gap: 12, borderBottomWidth: StyleSheet.hairlineWidth },
  prefTitle: { fontSize: 14, fontWeight: '800' },
  prefHint: { fontSize: 12, marginTop: 3 },
});
