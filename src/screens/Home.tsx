import {
  Bell, CalendarDays, ChevronRight, Clock3, Droplets, History, Landmark, MoreHorizontal,
  Router, ShieldCheck, Smartphone, Tv, Zap,
} from 'lucide-react-native';
import { useEffect, useState, useCallback } from 'react';
import { Image, Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { LinearGradient } from 'expo-linear-gradient';
import { BottomNav, HeaderIcon, ProviderMark, ScreenScroll, StatusPill } from '../components/ui';
import { billServices, images, providers, serviceIds, type BillService } from '../data';
import type { Copy } from '../i18n';
import { supabase } from '../lib/supabase';
import { useRealtimeBills, useRealtimeNotifications } from '../services/realtime';
import { fetchHouseholdBills, formatBillDisplay, type DbBill } from '../services/household';
import { useLayout } from '../layout';
import { Entrance, Stagger } from '../motion';
import { WidgetStrip } from '../widgets';
import type { Palette } from '../theme';
import type { Lang, Screen } from '../types';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);
type BillDisplay = ReturnType<typeof formatBillDisplay>;

function PressableTile({ onPress, style, children }: { onPress: () => void; style?: object; children: React.ReactNode }) {
  const s = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <AnimatedPressable
      onPressIn={() => { s.value = withSpring(0.94, { damping: 16, stiffness: 340 }); }}
      onPressOut={() => { s.value = withSpring(1, { damping: 12, stiffness: 260 }); }}
      onPress={onPress}
      style={[anim, style]}
    >
      {children}
    </AnimatedPressable>
  );
}

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
  go, t, c, lang, userName, userId = '', householdId = '', householdName = '', onSelectService,
}: { go: (s: Screen) => void; t: Copy; c: Palette; lang: Lang; userName: string; userId?: string; householdId?: string; householdName?: string; onSelectService: (service: BillService) => void }) {
  const insets = useSafeAreaInsets();
  const layout = useLayout();
  const hello = t.langs[lang].hello;
  const [homeBills, setHomeBills] = useState<BillDisplay[]>([]);
  const [hasNotification, setHasNotification] = useState(false);

  const loadBills = useCallback(async () => {
    if (!supabase || !householdId) return;
    const bills = await fetchHouseholdBills(householdId);
    setHomeBills(bills.slice(0, 4).map(formatBillDisplay));
  }, [householdId]);

  useEffect(() => { void loadBills(); }, [loadBills]);

  useEffect(() => {
    if (!supabase || !userId) return;
    void supabase.from('notifications').select('id').eq('user_id', userId).eq('read', false).limit(1).maybeSingle().then(({ data }) => {
      setHasNotification(!!data);
    });
  }, [userId]);

  useRealtimeBills(householdId, {
    onUpdate: () => void loadBills(),
    onInsert: () => void loadBills(),
  });

  useRealtimeNotifications(userId, {
    onInsert: (notification) => {
      if (!(notification as { read?: boolean }).read) setHasNotification(true);
    },
    onUpdate: () => {
      if (!supabase) return;
      const client = supabase;
      void client.from('notifications').select('id').eq('user_id', userId).eq('read', false).limit(1).maybeSingle().then(({ data }) => {
        setHasNotification(!!data);
      });
    },
  });

  const unpaidTotal = homeBills.filter((b) => !['Paid', 'paid'].includes(b.status)).reduce((sum, b) => sum + b.rawAmount, 0);
  const paidTotal = homeBills.filter((b) => ['Paid', 'paid'].includes(b.status)).reduce((sum, b) => sum + b.rawAmount, 0);
  const dueSoonCount = homeBills.filter((b) => b.status.toLowerCase().includes('due')).length;

  const firstUnpaid = homeBills.find((b) => !['Paid', 'paid'].includes(b.status));
  const alertText = firstUnpaid
    ? `${firstUnpaid.provider} due ${firstUnpaid.due.replace(', 2026', '')}`
    : t.langs[lang].sample;
  const alertAmount = firstUnpaid
    ? `${firstUnpaid.amount} due ${firstUnpaid.due.replace(', 2026', '')}`
    : t.home.next;

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={[styles.homeHeader, { paddingTop: insets.top + 8, paddingHorizontal: layout.pad }]}>
        <View style={{ flex: 1 }}>
          <Text style={{ color: c.textMuted, fontSize: 13 }}>{hello}</Text>
          <Text style={{ color: c.text, fontSize: 18, fontWeight: '800' }}>{userName}</Text>
          <Text numberOfLines={1} style={{ color: c.primary, fontSize: 12, fontWeight: '700', marginTop: 2 }}>{householdName || 'Your household'}</Text>
        </View>
        <HeaderIcon onPress={() => go('activity')} c={c} label="Activity"><History size={18} color={c.text} /></HeaderIcon>
        <HeaderIcon onPress={() => go('calendar')} c={c} label="Bill calendar"><CalendarDays size={18} color={c.text} /></HeaderIcon>
        <HeaderIcon onPress={() => go('notifications')} c={c} notify={hasNotification} label="Notifications"><Bell size={18} color={c.text} /></HeaderIcon>
      </View>
      <ScreenScroll withNav>
        <LinearGradient colors={['#183AC8', '#244FE3', '#662BD5']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.monthlyCard}>
          <Image source={images.homeHero} resizeMode="cover" style={styles.monthlyAvatar} accessibilityLabel="Bayarin companion" />
          <View style={styles.monthlyShade} />
          <View style={styles.monthlyCopy}>
            <Text style={styles.monthlyKicker}>THIS MONTH</Text>
            <Text style={styles.monthlyAmount}>{homeBills.length ? new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(unpaidTotal) : 'Ready to organize'}</Text>
            <Text style={styles.monthlyBody}>{homeBills.length ? `${homeBills.filter((bill) => bill.status.toLowerCase() !== 'paid').length} bill${homeBills.length === 1 ? '' : 's'} still unpaid` : 'Add your first household bill to begin.'}</Text>
            <Pressable onPress={() => go(homeBills.length ? 'bills' : 'add-bill')} style={styles.monthlyAction}>
              <Text style={styles.monthlyActionText}>{homeBills.length ? t.home.viewBills : 'Add a bill'}</Text><ChevronRight size={15} color="#1739BD" />
            </Pressable>
          </View>
        </LinearGradient>

        <WidgetStrip go={go} c={c} billCount={homeBills.length} dueSoonCount={dueSoonCount} />

        {firstUnpaid ? <Entrance index={0}>
          <PressableTile onPress={() => go('bills')}>
            <View style={[styles.alert, { backgroundColor: c.warningSoft }]}>
              <Clock3 size={18} color={c.warning} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.warning, fontWeight: '800', fontSize: 13 }}>{alertText}</Text>
                <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 2 }}>{alertAmount}</Text>
              </View>
              <ChevronRight size={16} color={c.warning} />
            </View>
          </PressableTile>
        </Entrance> : null}

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
                <PressableTile onPress={() => go('add-bill')} style={[styles.tile, { backgroundColor: c.surface, borderColor: c.border }]}>
                  <ProviderMark tone={p.tone} letter={p.mark} />
                  <Text style={{ color: c.text, fontSize: 12, fontWeight: '700' }}>{p.name}</Text>
                </PressableTile>
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
                  <PressableTile onPress={() => id === 'government' ? go('lingkod') : onSelectService(billServices[id])}
                    style={[styles.tile, { backgroundColor: c.surface, borderColor: c.border }]}>
                    <View style={[styles.serviceIcon, { backgroundColor: c.primarySoft }]}><Icon size={16} color={c.primary} /></View>
                    <Text style={{ color: c.text, fontSize: 12, fontWeight: '700', textAlign: 'center' }}>{t.services[id]}</Text>
                  </PressableTile>
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
          {homeBills.length === 0 ? (
            <View style={[styles.noBills, { backgroundColor: c.surface, borderColor: c.border }]}>
              <Text style={{ color: c.text, fontWeight: '800' }}>No bills yet</Text>
              <Text style={{ color: c.textMuted, fontSize: 13, lineHeight: 18, marginTop: 4 }}>Your household’s bills will appear here after you add them.</Text>
            </View>
          ) : homeBills.slice(0, 2).map((b, i) => {
            const display = formatBillDisplay(b as unknown as DbBill);
            return (
              <Stagger key={display.id || i} index={i}>
                <PressableTile onPress={() => go('bill-detail')} style={[styles.billRow, { backgroundColor: c.surface, borderColor: c.border }]}>
                  <ProviderMark tone={display.tone} letter={display.provider[0]} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: c.text, fontWeight: '800', fontSize: 14 }}>{display.provider}</Text>
                    <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 2 }}>•••• {display.account} · {display.dueDateShort}</Text>
                  </View>
                  <View style={{ alignItems: 'flex-end', gap: 4 }}>
                    <Text style={{ color: c.text, fontWeight: '800' }}>{display.amount}</Text>
                    <StatusPill status={display.status} c={c} />
                  </View>
                </PressableTile>
              </Stagger>
            );
          })}
        </View>

        <PressableTile onPress={() => go('calendar')} style={styles.calendarCta}>
          <LinearGradient colors={['#2446D2', '#6131CA']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={StyleSheet.absoluteFill} />
          <Image source={images.calendarHeroV2} resizeMode="cover" style={styles.calendarAvatar} accessibilityLabel="Bayarin calendar companion" />
          <View style={{ width: '58%', zIndex: 1 }}>
            <Text style={styles.calendarKicker}>STAY AHEAD</Text>
            <Text style={styles.calendarTitle}>Plan every due date with your household.</Text>
            <View style={styles.calendarAction}><Text style={styles.calendarActionText}>Open calendar</Text><ChevronRight size={14} color="#1F42C7" /></View>
          </View>
        </PressableTile>
      </ScreenScroll>
      <BottomNav screen="home" go={go} c={c} t={t} />
    </View>
  );
}

const styles = StyleSheet.create({
  homeHeader: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingBottom: 14 },
  alert: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 18, marginTop: 12, shadowColor: '#D99118', shadowOpacity: 0.14, shadowRadius: 14, shadowOffset: { width: 0, height: 7 }, elevation: 3 },
  monthlyCard: { minHeight: 182, borderRadius: 22, overflow: 'hidden', marginBottom: 2, shadowColor: '#253EC9', shadowOpacity: 0.26, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 7 },
  monthlyAvatar: { position: 'absolute', right: -28, top: 0, width: '71%', height: '100%' },
  monthlyShade: { position: 'absolute', top: 0, bottom: 0, left: 0, width: '70%', backgroundColor: 'rgba(10,23,133,0.30)' },
  monthlyCopy: { width: '61%', padding: 18, minHeight: 182, justifyContent: 'center', zIndex: 1 },
  monthlyKicker: { color: '#DDE5FF', fontSize: 10, fontWeight: '900', letterSpacing: 0.9 },
  monthlyAmount: { color: '#FFFFFF', fontSize: 24, lineHeight: 30, fontWeight: '900', letterSpacing: -0.8, marginTop: 7 },
  monthlyBody: { color: '#E4E9FF', fontSize: 12, lineHeight: 17, marginTop: 5, fontWeight: '600' },
  monthlyAction: { marginTop: 13, alignSelf: 'flex-start', height: 34, paddingHorizontal: 12, borderRadius: 17, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', gap: 4 },
  monthlyActionText: { color: '#1739BD', fontSize: 12, fontWeight: '900' },
  section: { marginTop: 26 },
  heading: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 },
  h2: { fontSize: 17, lineHeight: 22, fontWeight: '800', letterSpacing: -0.2 },
  grid4: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  tileWrap: { width: '23%', minWidth: 72, flexGrow: 1 },
  tile: { width: '100%', minHeight: 88, borderRadius: 18, borderWidth: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 6, paddingVertical: 10 },
  serviceIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  billRow: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 18, borderWidth: 1, marginBottom: 9 },
  noBills: { borderRadius: 20, borderWidth: 1, padding: 19, shadowColor: '#2864F0', shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 6 }, elevation: 2 },
  calendarCta: { height: 146, borderRadius: 22, overflow: 'hidden', marginTop: 25, marginBottom: 4, padding: 17, shadowColor: '#3A37CB', shadowOpacity: 0.22, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 5 },
  calendarAvatar: { position: 'absolute', width: '68%', height: '150%', right: -24, bottom: -28, opacity: 0.9 },
  calendarKicker: { color: '#D9E1FF', fontSize: 10, fontWeight: '900', letterSpacing: 0.8 },
  calendarTitle: { color: '#FFFFFF', fontSize: 17, lineHeight: 21, fontWeight: '900', letterSpacing: -0.3, marginTop: 5 },
  calendarAction: { alignSelf: 'flex-start', marginTop: 11, paddingHorizontal: 11, height: 31, borderRadius: 16, backgroundColor: '#FFFFFF', flexDirection: 'row', alignItems: 'center', gap: 3 },
  calendarActionText: { color: '#1F42C7', fontSize: 11, fontWeight: '900' },
});
