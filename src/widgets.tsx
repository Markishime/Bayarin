import { LinearGradient } from 'expo-linear-gradient';
import { Bell, Landmark, Smartphone, Zap } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ProviderMark } from './components/ui';
import type { Copy } from './i18n';
import { Float3D, Pulse3D, TiltCard } from './motion';
import { gradient, type Palette } from './theme';
import type { Screen } from './types';

function Ring({ progress, color, track }: { progress: number; color: string; track: string }) {
  return (
    <View style={[styles.ring, { borderColor: track }]}>
      <View style={[styles.ringFill, { backgroundColor: color, height: `${Math.round(progress * 100)}%` }]} />
      <Text style={[styles.ringText, { color }]}>{Math.round(progress * 100)}</Text>
    </View>
  );
}

export function WidgetStrip({ go, t, c }: { go: (s: Screen) => void; t: Copy; c: Palette }) {
  return (
    <View style={styles.wrap}>
      <TiltCard style={styles.grow}>
        <Pressable onPress={() => go('bills')} style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Pulse3D>
            <Ring progress={0.39} color={c.primary} track={c.surface2} />
          </Pulse3D>
          <View style={{ flex: 1 }}>
            <Text style={[styles.kicker, { color: c.primary }]}>{t.home.thisMonth}</Text>
            <Text style={[styles.value, { color: c.text }]}>₱7,591</Text>
            <Text style={[styles.hint, { color: c.textMuted }]}>{t.home.unpaid}</Text>
          </View>
        </Pressable>
      </TiltCard>

      <Float3D intensity={0.7} style={styles.grow}>
        <Pressable onPress={() => go('bill-detail')} style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <View style={[styles.icon, { backgroundColor: c.warningSoft }]}><Zap size={18} color={c.warning} /></View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.kicker, { color: c.warning }]}>{t.home.dueSoon}</Text>
            <Text style={[styles.valueSm, { color: c.text }]}>Meralco</Text>
            <Text style={[styles.hint, { color: c.textMuted }]}>Sep 8 · ₱2,450</Text>
          </View>
          <ProviderMark tone="orange" letter="M" />
        </Pressable>
      </Float3D>

      <Float3D intensity={0.85} delay={180} style={styles.grow}>
        <Pressable onPress={() => go('load')} style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <View style={[styles.icon, { backgroundColor: c.primarySoft }]}><Smartphone size={18} color={c.primary} /></View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.kicker, { color: c.primary }]}>{t.load.title}</Text>
            <Text style={[styles.valueSm, { color: c.text }]}>SMART</Text>
            <Text style={[styles.hint, { color: c.textMuted }]}>Sep 7 · ₱299</Text>
          </View>
          <Bell size={16} color={c.primary} />
        </Pressable>
      </Float3D>

      <Float3D intensity={0.75} delay={320} style={styles.grow}>
        <Pressable onPress={() => go('lingkod')} style={[styles.card, { backgroundColor: c.surface, borderColor: c.border }]}>
          <View style={[styles.icon, { backgroundColor: c.primarySoft }]}><Landmark size={18} color={c.primary} /></View>
          <View style={{ flex: 1 }}>
            <Text style={[styles.kicker, { color: c.primary }]}>{t.lingkod.title}</Text>
            <Text style={[styles.valueSm, { color: c.text }]}>SSS</Text>
            <Text style={[styles.hint, { color: c.textMuted }]}>Sep 10 · ₱1,400</Text>
          </View>
        </Pressable>
      </Float3D>
    </View>
  );
}

export function HeroWidget({ go, t, c }: { go: (s: Screen) => void; t: Copy; c: Palette }) {
  return (
    <TiltCard>
      <LinearGradient colors={[...gradient.hero]} style={styles.hero}>
        <View style={styles.heroGlow} />
        <Text style={styles.heroKicker}>{t.home.thisMonth}</Text>
        <Text style={styles.heroAmount}>₱7,591.00</Text>
        <Text style={styles.heroUnpaid}>{t.home.unpaid}</Text>
        <View style={styles.heroRow}>
          <View>
            <Text style={styles.heroMeta}>{t.home.paid}</Text>
            <Text style={styles.heroMetaVal}>₱4,850</Text>
          </View>
          <View>
            <Text style={styles.heroMeta}>{t.home.dueSoon}</Text>
            <Text style={styles.heroMetaVal}>2</Text>
          </View>
          <Pressable onPress={() => go('bills')} style={styles.viewBills}>
            <Text style={styles.viewText}>{t.home.viewBills}</Text>
          </Pressable>
        </View>
      </LinearGradient>
    </TiltCard>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 12 },
  grow: { width: '47%', flexGrow: 1, minWidth: 148 },
  card: { minHeight: 92, borderRadius: 20, borderWidth: 1, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 10 },
  kicker: { fontSize: 10, fontWeight: '800', letterSpacing: 0.8, textTransform: 'uppercase' },
  value: { fontSize: 22, fontWeight: '800', letterSpacing: -0.6, marginTop: 2 },
  valueSm: { fontSize: 16, fontWeight: '800', marginTop: 2 },
  hint: { fontSize: 11, marginTop: 2 },
  icon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  hero: { minHeight: 200, borderRadius: 24, padding: 20, overflow: 'hidden' },
  heroGlow: { position: 'absolute', width: 220, height: 220, borderRadius: 110, backgroundColor: 'rgba(255,255,255,0.12)', right: -70, top: -80 },
  heroKicker: { color: '#fff', fontSize: 11, letterSpacing: 1.4, fontWeight: '800' },
  heroAmount: { color: '#fff', fontSize: 36, fontWeight: '800', letterSpacing: -1, marginTop: 12 },
  heroUnpaid: { color: '#D4E8DC', fontSize: 13, marginTop: 6 },
  heroRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 14, marginTop: 18, paddingTop: 14, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: 'rgba(255,255,255,0.2)' },
  heroMeta: { color: '#CDE2D5', fontSize: 10 },
  heroMetaVal: { color: '#fff', fontSize: 14, fontWeight: '800' },
  viewBills: { marginLeft: 'auto', backgroundColor: '#fff', borderRadius: 12, height: 36, paddingHorizontal: 12, justifyContent: 'center' },
  viewText: { color: '#243FC6', fontWeight: '800', fontSize: 12 },
  ring: { width: 52, height: 52, borderRadius: 16, borderWidth: 2, overflow: 'hidden', alignItems: 'center', justifyContent: 'flex-end' },
  ringFill: { position: 'absolute', left: 0, right: 0, bottom: 0, opacity: 0.25 },
  ringText: { fontSize: 13, fontWeight: '800', marginBottom: 8 },
});
