import {
  Bell, ChevronRight, Clock3, Droplets, History, Landmark, MoreHorizontal,
  Play, Router, ShieldCheck, Smartphone, Tv, Zap,
} from 'lucide-react-native';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomNav, HeaderIcon, ProviderMark, ScreenScroll, StatusPill } from '../components/ui';
import { bills, images, providers, serviceIds } from '../data';
import type { Copy } from '../i18n';
import { useLayout } from '../layout';
import { Stagger } from '../motion';
import { HeroWidget, WidgetStrip } from '../widgets';
import type { Palette } from '../theme';
import type { Lang, Screen } from '../types';

const serviceIcons = {
  electricity: Zap,
  water: Droplets,
  internet: Router,
  cable: Tv,
  load: Smartphone,
  government: Landmark,
  insurance: ShieldCheck,
  other: MoreHorizontal,
};

export function HomeScreen({
  go, t, c, lang, userName,
}: { go: (s: Screen) => void; t: Copy; c: Palette; lang: Lang; userName: string }) {
  const insets = useSafeAreaInsets();
  const layout = useLayout();
  const hello = t.langs[lang].hello;
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={[styles.homeHeader, { paddingTop: insets.top + 8, paddingHorizontal: layout.pad }]}>
        <Image source={images.auth} style={styles.avatar} />
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.textMuted, fontSize: 12 }}>{hello}</Text>
          <Text style={{ color: c.text, fontSize: 16, fontWeight: '800' }}>{userName}</Text>
        </View>
        <HeaderIcon onPress={() => go('activity')} c={c}><History size={18} color={c.text} /></HeaderIcon>
        <HeaderIcon onPress={() => go('notifications')} c={c} notify><Bell size={18} color={c.text} /></HeaderIcon>
      </View>
      <ScreenScroll withNav>
        <HeroWidget go={go} t={t} c={c} />
        <WidgetStrip go={go} t={t} c={c} />

        <View style={[styles.alert, { backgroundColor: c.warningSoft }]}>
          <Clock3 size={18} color={c.warning} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.warning, fontWeight: '800', fontSize: 13 }}>{t.langs[lang].sample}</Text>
            <Text style={{ color: c.textMuted, fontSize: 11 }}>{t.home.next}</Text>
          </View>
          <ChevronRight size={16} color={c.warning} />
        </View>

        <Pressable onPress={() => go('story')} style={[styles.storyPromo, { backgroundColor: c.surface, borderColor: c.border }]}>
          <View style={styles.storyArt}>
            <Image source={images.story} style={{ width: '100%', height: '100%' }} />
            <View style={styles.play}><Play size={11} color="#3348D7" fill="#3348D7" /></View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.primary, fontSize: 10, fontWeight: '800', letterSpacing: 1 }}>{t.home.storyKicker}</Text>
            <Text style={{ color: c.text, fontSize: 13, fontWeight: '700', marginTop: 3 }}>{t.home.storyTitle}</Text>
          </View>
          <ChevronRight size={16} color={c.textMuted} />
        </Pressable>

        <View style={styles.section}>
          <View style={styles.heading}>
            <Text style={[styles.h2, { color: c.text }]}>{t.home.frequent}</Text>
            <Pressable onPress={() => go('bills')} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: c.primary, fontSize: 12, fontWeight: '700' }}>{t.home.viewAll}</Text>
              <ChevronRight size={13} color={c.primary} />
            </Pressable>
          </View>
          <View style={styles.grid4}>
            {providers.map((p, i) => (
              <Stagger key={p.name} index={i} style={styles.tileWrap}>
                <Pressable onPress={() => go('add-bill')} style={[styles.tile, { backgroundColor: c.surface, borderColor: c.border }]}>
                  <ProviderMark tone={p.tone} letter={p.mark} />
                  <Text style={{ color: c.text, fontSize: 11, fontWeight: '700' }}>{p.name}</Text>
                </Pressable>
              </Stagger>
            ))}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.heading}><Text style={[styles.h2, { color: c.text }]}>{t.home.services}</Text></View>
          <View style={styles.grid4}>
            {serviceIds.map((id, i) => {
              const Icon = serviceIcons[id];
              return (
                <Stagger key={id} index={i} style={styles.tileWrap}>
                  <Pressable onPress={() => go(id === 'load' ? 'load' : id === 'government' ? 'lingkod' : 'add-bill')}
                    style={[styles.tile, { backgroundColor: c.surface, borderColor: c.border }]}>
                    <View style={[styles.serviceIcon, { backgroundColor: c.primarySoft }]}><Icon size={16} color={c.primary} /></View>
                    <Text style={{ color: c.text, fontSize: 10, fontWeight: '700' }}>{t.services[id]}</Text>
                  </Pressable>
                </Stagger>
              );
            })}
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.heading}>
            <Text style={[styles.h2, { color: c.text }]}>{t.home.upcoming}</Text>
            <Pressable onPress={() => go('bills')} style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={{ color: c.primary, fontSize: 12, fontWeight: '700' }}>{t.home.viewAll}</Text>
              <ChevronRight size={13} color={c.primary} />
            </Pressable>
          </View>
          {bills.slice(0, 2).map((b, i) => (
            <Stagger key={b.provider} index={i}>
            <Pressable onPress={() => go('bill-detail')} style={[styles.billRow, { backgroundColor: c.surface, borderColor: c.border }]}>
              <ProviderMark tone={b.tone} letter={b.provider[0]} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.text, fontWeight: '800', fontSize: 13 }}>{b.provider}</Text>
                <Text style={{ color: c.textMuted, fontSize: 11 }}>•••• {b.account} · {b.due.replace(', 2026', '')}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text style={{ color: c.text, fontWeight: '800' }}>{b.amount}</Text>
                <StatusPill status={b.status} c={c} />
              </View>
            </Pressable>
            </Stagger>
          ))}
        </View>
      </ScreenScroll>
      <BottomNav screen="home" go={go} c={c} t={t} />
    </View>
  );
}

const styles = StyleSheet.create({
  homeHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#E0E7FF' },
  alert: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 14, marginTop: 12 },
  storyPromo: { marginTop: 12, borderRadius: 17, padding: 8, borderWidth: 1, flexDirection: 'row', alignItems: 'center', gap: 10 },
  storyArt: { width: 78, height: 52, borderRadius: 12, overflow: 'hidden' },
  play: { position: 'absolute', inset: 0, margin: 'auto', width: 25, height: 25, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.9)', alignItems: 'center', justifyContent: 'center', top: 13, left: 26 },
  section: { marginTop: 22 },
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  h2: { fontSize: 16, fontWeight: '800' },
  grid4: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tileWrap: { width: '23%', minWidth: 72, flexGrow: 1 },
  tile: { width: '100%', height: 78, borderRadius: 16, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 7 },
  serviceIcon: { width: 31, height: 31, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  billRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 12, borderRadius: 16, borderWidth: 1, marginBottom: 8 },
});
