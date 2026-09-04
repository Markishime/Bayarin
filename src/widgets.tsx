import { CalendarDays, ReceiptText } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import type { Copy } from './i18n';
import { Float3D, TiltCard } from './motion';
import { type Palette } from './theme';
import type { Screen } from './types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function PressCard({ onPress, style, children }: { onPress: () => void; style?: object; children: React.ReactNode }) {
  const s = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: s.value }],
  }));
  return (
    <AnimatedPressable
      onPressIn={() => { s.value = withSpring(0.97, { damping: 16, stiffness: 320 }); }}
      onPressOut={() => { s.value = withSpring(1, { damping: 12, stiffness: 260 }); }}
      onPress={onPress}
      style={[anim, style]}
    >
      {children}
    </AnimatedPressable>
  );
}

export function WidgetStrip({
  go, c, billCount, dueSoonCount,
}: { go: (s: Screen) => void; c: Palette; billCount: number; dueSoonCount: number }) {
  return (
    <View style={styles.wrap}>
      <TiltCard style={styles.grow}>
        <PressCard onPress={() => go(billCount ? 'bills' : 'add-bill')} style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <View style={[styles.icon, { backgroundColor: c.primarySoft }]}><ReceiptText size={19} color={c.primary} /></View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.kicker, { color: c.primary }]}>BILLS</Text>
            <Text style={[styles.valueSm, { color: c.text }]}>{billCount ? `${billCount} tracked` : 'No bills yet'}</Text>
            <Text style={[styles.hint, { color: c.textMuted }]}>{billCount ? 'View your household list' : 'Add your first bill'}</Text>
          </View>
        </PressCard>
      </TiltCard>

      <Float3D intensity={0.7} style={styles.grow}>
        <PressCard onPress={() => go('calendar')} style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <View style={[styles.icon, { backgroundColor: c.primarySoft }]}><CalendarDays size={19} color={c.accent} /></View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.kicker, { color: c.accent }]}>CALENDAR</Text>
            <Text style={[styles.valueSm, { color: c.text }]}>{dueSoonCount ? `${dueSoonCount} due soon` : 'All clear'}</Text>
            <Text style={[styles.hint, { color: c.textMuted }]}>Plan due dates together</Text>
          </View>
        </PressCard>
      </Float3D>
    </View>
  );
}

export function HeroWidget({
  go, t, c, unpaidTotal, paidTotal, dueSoonCount,
}: { go: (s: Screen) => void; t: Copy; c: Palette; unpaidTotal: number; paidTotal: number; dueSoonCount: number }) {
  const money = (amount: number) => new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(amount);
  return (
    <View style={[styles.hero, { backgroundColor: c.surface, borderColor: c.border, shadowColor: c.shadow }]}>
      <Text style={[styles.heroKicker, { color: c.primary }]}>{t.home.thisMonth}</Text>
      <Text style={[styles.heroAmount, { color: c.text }]}>{money(unpaidTotal)}</Text>
      <Text style={[styles.heroUnpaid, { color: c.textMuted }]}>{t.home.unpaid}</Text>
      <View style={[styles.heroRow, { borderTopColor: c.border }]}>
        <View>
          <Text style={[styles.heroMeta, { color: c.textMuted }]}>{t.home.paid}</Text>
          <Text style={[styles.heroMetaVal, { color: c.text }]}>{money(paidTotal)}</Text>
        </View>
        <View>
          <Text style={[styles.heroMeta, { color: c.textMuted }]}>{t.home.dueSoon}</Text>
          <Text style={[styles.heroMetaVal, { color: c.text }]}>{dueSoonCount}</Text>
        </View>
        <Pressable onPress={() => go('bills')} style={[styles.viewBills, { backgroundColor: c.primary }]}>
          <Text style={[styles.viewText, { color: c.onPrimary }]}>{t.home.viewBills}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  grow: { width: '47%', flexGrow: 1, minWidth: 148 },
  card: { minHeight: 88, borderRadius: 18, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 9, shadowColor: '#255BEC', shadowOpacity: 0.13, shadowRadius: 13, shadowOffset: { width: 0, height: 7 }, elevation: 3 },
  kicker: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  value: { fontSize: 22, fontWeight: '800', letterSpacing: -0.6, marginTop: 2 },
  valueSm: { fontSize: 16, fontWeight: '800', marginTop: 2 },
  hint: { fontSize: 12, marginTop: 2, lineHeight: 16 },
  icon: { width: 42, height: 42, borderRadius: 15, alignItems: 'center', justifyContent: 'center', shadowColor: '#3C67F2', shadowOpacity: 0.24, shadowRadius: 10, shadowOffset: { width: 0, height: 5 }, elevation: 3 },
  hero: { minHeight: 168, borderRadius: 22, padding: 18, overflow: 'hidden', borderWidth: 1, shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 3 },
  heroKicker: { fontSize: 11, letterSpacing: 1.3, fontWeight: '800' },
  heroAmount: { fontSize: 34, fontWeight: '800', letterSpacing: -1, marginTop: 8 },
  heroUnpaid: { fontSize: 14, marginTop: 4, lineHeight: 20 },
  heroRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 14, marginTop: 16, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth },
  heroMeta: { fontSize: 11 },
  heroMetaVal: { fontSize: 14, fontWeight: '800', marginTop: 2 },
  viewBills: { marginLeft: 'auto', borderRadius: 12, height: 36, paddingHorizontal: 12, justifyContent: 'center' },
  viewText: { fontWeight: '800', fontSize: 12 },
});
