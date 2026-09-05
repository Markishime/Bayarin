import { LinearGradient } from 'expo-linear-gradient';
import { Bell, ChevronRight, History } from 'lucide-react-native';
import { useEffect, useState } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BottomNav, HeaderIcon, ProviderMark, ScreenScroll } from '../components/ui';
import { CalendarArt, ServiceArt } from '../components/Artwork';
import { billServices, images, providers, serviceIds, type BillService, type ServiceProvider } from '../data';
import { useBills } from '../services/bill-context';
import { householdSummary } from '../services/bill-rules';
import { supabase } from '../lib/supabase';
import { useRealtimeNotifications } from '../services/realtime';
import { formatBillDisplay } from '../services/household';
import { useLayout } from '../layout';
import { gradient, type Palette } from '../theme';
import type { Copy } from '../i18n';
import type { BillFilter, Lang, Screen } from '../types';

export function HomeScreen({ go, t, c, lang, userName, userId = '', householdId = '', householdName = '', onSelectService, onSelectProvider, onViewBills, preferredServices = [] }: {
  go: (s: Screen) => void; t: Copy; c: Palette; lang: Lang; userName: string; userId?: string; householdId?: string; householdName?: string; preferredServices?: string[]; onSelectService: (service: BillService) => void;
  onSelectProvider?: (service: BillService, provider: ServiceProvider) => void;
  onViewBills?: (filter: BillFilter) => void;
}) {
  const insets = useSafeAreaInsets();
  const layout = useLayout();
  const { bills, loading } = useBills();
  const { unpaid, dueSoonCount, unpaidAmount, paidAmount } = householdSummary(bills);
  const viewBills = (filter: BillFilter) => onViewBills ? onViewBills(filter) : go('bills');
  const chooseFrequent = (name: string) => {
    const service = Object.values(billServices).find(s => s.providers.some(p => p.name.toLowerCase().includes(name.toLowerCase()))) || billServices.other;
    const provider = service.providers.find(p => p.name.toLowerCase().includes(name.toLowerCase())) || service.providers[0];
    if (onSelectProvider) onSelectProvider(service, provider); else onSelectService(service);
  };
  const money = (amount: number) => new Intl.NumberFormat('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount);
  const [hasNotification, setHasNotification] = useState(false);
  const checkNotifications = () => {
    if (!supabase || !userId) return;
    void supabase.from('notifications').select('id').eq('user_id', userId).eq('read', false).limit(1).maybeSingle().then(({ data }) => setHasNotification(!!data));
  };
  useEffect(checkNotifications, [userId]);
  useRealtimeNotifications(userId, { onInsert: checkNotifications, onUpdate: checkNotifications });
  const labels: Record<string, string> = { electricity: 'Kuryente', water: 'Tubig', internet: 'Internet', cable: 'Cable TV', load: 'Load', government: 'Lingkod', insurance: 'Insurance', other: 'Iba pa' };
  return <View style={{ flex: 1, backgroundColor: c.bg }}>
    <View style={[styles.header, { paddingTop: insets.top + 20, paddingHorizontal: layout.pad }]}>
      <Pressable accessibilityRole="button" accessibilityLabel="Your profile" onPress={() => go('settings')} style={[styles.avatar, { backgroundColor: c.primarySoft }]}><Image source={images.avatar} style={{ width: 65, height: 69, marginTop: 12 }} resizeMode="contain" /></Pressable>
      <View style={{ flex: 1 }}><Text style={{ color: c.textMuted, fontSize: 12, marginBottom: 5 }}>{t.langs[lang].hello}</Text><Text numberOfLines={1} style={{ color: c.text, fontSize: 18, fontWeight: '600', letterSpacing: -.4 }}>{userName}</Text></View>
      <HeaderIcon onPress={() => go('notifications')} c={c} notify={hasNotification} label="Notifications"><Bell size={25} color={c.text} strokeWidth={1.5} /></HeaderIcon>
    </View>
    <ScreenScroll withNav>
      <LinearGradient colors={[...gradient.hero]} start={{ x: 0, y: .2 }} end={{ x: 1, y: .6 }} style={styles.monthly}>
        <Image source={images.homeHero} resizeMode="contain" style={styles.monthlyArt} />
        <View style={styles.monthCopy}>
          <Text style={styles.kicker}>THIS MONTH</Text>
          <Text accessibilityLiveRegion="polite" style={styles.amount}>₱ {money(unpaidAmount).split('.')[0]}<Text style={{ fontSize: 16, fontWeight: '500' }}>.{money(unpaidAmount).split('.')[1]}</Text></Text>
          <Text style={styles.monthBody}>{loading ? 'Loading your bills…' : 'Still unpaid'}</Text>
          <Text style={styles.monthBody}>{unpaid.length} {unpaid.length === 1 ? 'bill' : 'bills'} remaining</Text>
          <Pressable accessibilityRole="button" onPress={() => go(bills.length ? 'bills' : 'add-bill')} style={styles.whiteButton}><Text style={styles.whiteButtonText}>{bills.length ? t.home.viewBills : 'Add a bill'}</Text><ChevronRight size={18} color="#1713CB" /></Pressable>
        </View>
      </LinearGradient>
      <View style={styles.stats}>
        <Pressable accessibilityRole="button" onPress={() => viewBills('Paid')} style={[styles.stat, { backgroundColor: c.surface, borderColor: c.border }]}><ServiceArt kind="check" size={30} /><View style={{ flex: 1 }}><Text style={[styles.statLabel, { color: c.textMuted }]}>Paid this month</Text><Text style={[styles.statValue, { color: c.text }]}>₱ {money(paidAmount)}</Text></View><ChevronRight size={15} color={c.text} /></Pressable>
        <Pressable accessibilityRole="button" onPress={() => viewBills('Due soon')} style={[styles.stat, { backgroundColor: c.surface, borderColor: c.border }]}><ServiceArt kind="bell" size={30} /><View style={{ flex: 1 }}><Text style={[styles.statLabel, { color: c.textMuted }]}>Due soon</Text><Text style={[styles.statValue, { color: c.text }]}>{dueSoonCount} bills</Text></View><ChevronRight size={15} color={c.text} /></Pressable>
      </View>
      <View style={styles.section}>
        <View style={styles.heading}><Text style={[styles.h2, { color: c.text }]}>Madalas bayaran</Text><Pressable accessibilityRole="button" onPress={() => go('bills')} style={styles.link}><Text style={{ color: c.primary, fontSize: 11 }}>Tingnan lahat</Text><ChevronRight size={12} color={c.primary} /></Pressable></View>
        <View style={styles.grid}>{providers.map(p => <Pressable key={p.name} accessibilityRole="button" accessibilityLabel={p.name} onPress={() => chooseFrequent(p.name)} style={[styles.tile, { backgroundColor: c.surface, borderColor: c.border }]}><ProviderMark tone={p.tone} letter={p.mark} size={39} /><Text style={[styles.tileLabel, { color: c.text }]}>{p.name}</Text></Pressable>)}</View>
      </View>
      <View style={styles.section}>
        <View style={styles.heading}><Text style={[styles.h2, { color: c.text }]}>Mga Serbisyo</Text></View>
        <View style={styles.grid}>{serviceIds.filter(id => !preferredServices.length || preferredServices.includes(id)).map(id => <Pressable key={id} accessibilityRole="button" accessibilityLabel={t.services[id]} onPress={() => id === 'government' ? go('lingkod') : id === 'load' ? go('load') : onSelectService(billServices[id])} style={[styles.tile, styles.serviceTile, { backgroundColor: c.surface, borderColor: c.border }]}><ServiceArt kind={id} size={37} /><Text style={[styles.tileLabel, { color: c.text }]}>{lang === 'ceb' ? t.services[id] : labels[id]}</Text></Pressable>)}</View>
      </View>
      <Pressable accessibilityRole="button" accessibilityLabel="View calendar" onPress={() => go('calendar')} style={{ marginTop: 18 }}><LinearGradient colors={[...gradient.hero]} start={{ x: 0, y: 0 }} end={{ x: 1, y: .7 }} style={styles.calendar}>
        <View style={{ position: 'absolute', right: 0, top: -7 }}><CalendarArt size={159} /></View>
        <View style={{ width: '57%' }}><Text style={styles.calendarTitle}>{dueSoonCount ? 'May malapit nang due' : 'Planuhin ang bayarin'}</Text><Text style={styles.calendarBody}>{dueSoonCount ? `${dueSoonCount} bills this week` : 'Keep every due date in view.'}</Text><View style={[styles.whiteButton, { marginTop: 14, minHeight: 33, paddingHorizontal: 17 }]}><Text style={styles.whiteButtonText}>Tingnan</Text></View></View>
      </LinearGradient></Pressable>
      <Pressable accessibilityRole="button" onPress={() => go('activity')} style={[styles.activityLink, { borderColor: c.border }]}><History size={16} color={c.primary} /><Text style={{ color: c.primary, fontSize: 12 }}>View household activity</Text><ChevronRight size={14} color={c.primary} /></Pressable>
    </ScreenScroll>
    <BottomNav screen="home" go={go} c={c} t={t} />
  </View>;
}
const styles = StyleSheet.create({
  header: { flexDirection: 'row', alignItems: 'center', gap: 11, paddingBottom: 12 },
  avatar: { width: 59, height: 59, borderRadius: 30, overflow: 'hidden', alignItems: 'center' },
  monthly: { minHeight: 211, borderRadius: 20, overflow: 'hidden', padding: 19 },
  monthlyArt: { position: 'absolute', right: 0, bottom: 1, width: '48%', height: '94%' },
  monthCopy: { width: '63%', zIndex: 1 },
  kicker: { color: '#FFFFFF', fontSize: 12, fontWeight: '600', marginTop: 6 },
  amount: { color: '#FFFFFF', fontSize: 33, fontWeight: '700', letterSpacing: -1.1, marginTop: 10, marginBottom: 10 },
  monthBody: { color: '#FFFFFF', fontSize: 12, lineHeight: 19, fontWeight: '500' },
  whiteButton: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: '#FFFFFF', borderRadius: 20, minHeight: 38, paddingHorizontal: 18, marginTop: 15, boxShadow: '0 4px 12px #06065A22' },
  whiteButtonText: { color: '#1415D9', fontSize: 12, fontWeight: '500' },
  stats: { flexDirection: 'row', gap: 11, marginTop: 17 },
  stat: { flex: 1, minWidth: 0, borderWidth: 1, borderRadius: 17, flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, gap: 5, minHeight: 66, boxShadow: '0 4px 14px #23267308' },
  statLabel: { fontSize: 9, marginBottom: 5 },
  statValue: { fontSize: 12, fontWeight: '600' },
  section: { marginTop: 22 },
  heading: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 11 },
  h2: { fontSize: 14, fontWeight: '600', letterSpacing: -.2 },
  link: { flexDirection: 'row', alignItems: 'center' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tile: { width: '22%', flexGrow: 1, minHeight: 86, borderRadius: 17, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 7, paddingVertical: 10, boxShadow: '0 4px 13px #28247505' },
  tileLabel: { fontSize: 11, textAlign: 'center' },
  serviceTile: { minHeight: 81, paddingVertical: 7 },
  calendar: { height: 132, padding: 18, overflow: 'hidden', borderRadius: 20, justifyContent: 'center' },
  calendarTitle: { color: '#FFFFFF', fontSize: 13, fontWeight: '600', lineHeight: 19 },
  calendarBody: { color: '#FFFFFF', fontSize: 12, lineHeight: 19 },
  activityLink: { minHeight: 44, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, marginTop: 12, borderWidth: 1, borderRadius: 13 },
});
