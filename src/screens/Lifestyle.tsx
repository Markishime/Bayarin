import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import {
  Bell, Check, CheckCircle2, ChevronRight, Clock3, Landmark, Pause, Pencil, Play,
  Plus, ShieldCheck, Smartphone, Sparkles, WifiOff, AlertTriangle, RefreshCw,
} from 'lucide-react-native';
import { useRef, useState, type ReactNode } from 'react';
import { Image, Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { AppHeader, BottomNav, BrandLogo, Card, InfoBanner, PrimaryButton, ProviderMark, ScreenScroll, SecondaryButton, StatusPill } from '../components/ui';
import { governmentItems, images, loads, storyVideo } from '../data';
import type { Copy } from '../i18n';
import { gradient, type Palette } from '../theme';
import type { Screen } from '../types';

export function ActivityScreen({ go, t, c }: { go: (s: Screen) => void; t: Copy; c: Palette }) {
  const [filter, setFilter] = useState('All');
  const items = [
    ['M', 'orange', 'MERALCO', t.activity.markedPaid, 'Sep 2 · 9:41 AM', '₱2,450.36', 'Paid', 'Bills'],
    ['W', 'blue', 'MAYNILAD', t.activity.billAdded, 'Sep 1 · 8:15 AM', '₱598.00', 'Upcoming', 'Bills'],
    ['G', 'indigo', 'GLOBE', t.activity.reminderUpdated, 'Aug 30 · 7:22 PM', '₱599.00', 'Due soon', 'Load'],
  ];
  const visible = filter === 'All' ? items : items.filter((item) => item[7] === filter);
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <AppHeader title={t.activity.title} onBack={() => go('home')} c={c} />
      <ScreenScroll>
        <View style={{ flexDirection: 'row', gap: 7, marginBottom: 12 }}>
          {['All', 'Bills', 'Load', 'Lingkod'].map((item) => (
            <Pressable key={item} onPress={() => setFilter(item)} style={[styles.chip, { backgroundColor: filter === item ? c.primary : c.surface, borderColor: filter === item ? c.primary : c.border }]}>
              <Text style={{ color: filter === item ? '#fff' : c.text, fontWeight: '700', fontSize: 12 }}>{item}</Text>
            </Pressable>
          ))}
        </View>
        <Text style={{ color: c.textMuted, fontSize: 12, marginBottom: 8 }}>September 2026</Text>
        <Card c={c} style={{ paddingVertical: 0, paddingHorizontal: 14 }}>
          {visible.length ? visible.map((i) => (
            <View key={i[2]} style={[styles.actRow, { borderBottomColor: c.border }]}>
              <ProviderMark tone={i[1]} letter={i[0]} />
              <View style={{ flex: 1 }}>
                <Text style={{ color: c.text, fontWeight: '800' }}>{i[2]}</Text>
                <Text style={{ color: c.textMuted, fontSize: 12 }}>{i[3]}</Text>
                <Text style={{ color: c.textMuted, fontSize: 11 }}>{i[4]}</Text>
              </View>
              <View style={{ alignItems: 'flex-end', gap: 4 }}>
                <Text style={{ color: c.text, fontWeight: '800' }}>{i[5]}</Text>
                <StatusPill status={i[6]} c={c} />
              </View>
            </View>
          )) : (
            <View style={{ padding: 28, alignItems: 'center' }}>
              <CheckCircle2 size={28} color={c.primary} />
              <Text style={{ color: c.textMuted, marginTop: 8 }}>{t.activity.empty}</Text>
            </View>
          )}
        </Card>
      </ScreenScroll>
    </View>
  );
}

export function LoadScreen({ go, t, c }: { go: (s: Screen) => void; t: Copy; c: Palette }) {
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <AppHeader title={t.load.title} c={c} trailing={<Pressable style={[styles.accent, { backgroundColor: c.primary }]}><Plus size={18} color="#fff" /></Pressable>} />
      <ScreenScroll withNav>
        <Lead c={c} icon={<Smartphone size={20} color={c.primary} />} title={t.load.stay} body={t.load.stayBody} />
        <InfoBanner c={c}>{t.load.banner}</InfoBanner>
        {loads.map((l) => (
          <Pressable key={l.name} onPress={() => go('load-detail')} style={[styles.rowCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <ProviderMark tone={l.tone} letter={l.mark} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.text, fontWeight: '800' }}>{l.name}</Text>
              <Text style={{ color: c.textMuted, fontSize: 12 }}>{l.number}</Text>
            </View>
            <View><Text style={{ color: c.textMuted, fontSize: 10 }}>{t.load.next}</Text><Text style={{ color: c.text, fontWeight: '800' }}>{l.date}</Text></View>
            <View><Text style={{ color: c.textMuted, fontSize: 10 }}>{t.load.typical}</Text><Text style={{ color: c.text, fontWeight: '800' }}>{l.amount}</Text></View>
            <ChevronRight size={14} color={c.textMuted} />
          </Pressable>
        ))}
      </ScreenScroll>
      <BottomNav screen="load" go={go} c={c} t={t} />
    </View>
  );
}

export function LoadDetail({ go, t, c }: { go: (s: Screen) => void; t: Copy; c: Palette }) {
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <AppHeader title={t.load.details} onBack={() => go('load')} c={c} trailing={<Pressable style={[styles.iconBtn, { backgroundColor: c.surface }]}><Pencil size={16} color={c.text} /></Pressable>} />
      <ScreenScroll>
        <View style={[styles.hero, { backgroundColor: c.surface }]}>
          <ProviderMark tone="green" letter="S" size={46} />
          <View><Text style={{ color: c.text, fontSize: 18, fontWeight: '800' }}>SMART</Text><Text style={{ color: c.textMuted }}>0919 ••• 4821 · Nanay</Text></View>
        </View>
        <Card c={c}>
          <Line c={c} label={t.load.next} value="Sep 7, 2026" />
          <Line c={c} label={t.load.typical} value="₱299" />
          <Line c={c} label={t.load.repeats} value={t.load.every30} last />
        </Card>
        <Card c={c} style={styles.between}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={[styles.soft, { backgroundColor: c.primarySoft }]}><Bell size={17} color={c.primary} /></View>
            <View><Text style={{ color: c.text, fontWeight: '800' }}>{t.load.remindMe}</Text><Text style={{ color: c.textMuted, fontSize: 12 }}>Sep 7 at 9:00 AM</Text></View>
          </View>
          <Switch value trackColor={{ true: c.primary }} />
        </Card>
        <View style={{ gap: 9, marginTop: 16 }}>
          <PrimaryButton title={t.load.openProvider} onPress={() => {}} c={c} />
          <SecondaryButton title={t.load.markDone} onPress={() => go('load')} c={c} icon={<Check size={16} color={c.text} />} />
        </View>
        <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 12 }}>{t.load.legal}</Text>
      </ScreenScroll>
    </View>
  );
}

export function LingkodScreen({ go, t, c }: { go: (s: Screen) => void; t: Copy; c: Palette }) {
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <AppHeader title={t.lingkod.title} c={c} trailing={<Pressable style={[styles.accent, { backgroundColor: c.primary }]}><Plus size={18} color="#fff" /></Pressable>} />
      <ScreenScroll withNav>
        <Lead c={c} icon={<Landmark size={20} color="#42576B" />} title={t.lingkod.lead} body={t.lingkod.leadBody} gov />
        <InfoBanner c={c}>{t.lingkod.banner}</InfoBanner>
        {governmentItems.map((g) => (
          <Pressable key={g.name} onPress={() => go('government-detail')} style={[styles.rowCard, { backgroundColor: c.surface, borderColor: c.border }]}>
            <View style={styles.govMark}><Text style={{ color: '#fff', fontWeight: '800' }}>{g.mark}</Text></View>
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.text, fontWeight: '800' }}>{g.name}</Text>
              <Text style={{ color: c.textMuted, fontSize: 12 }}>{t.common.due} {g.due}</Text>
            </View>
            <View style={{ alignItems: 'flex-end', gap: 4 }}>
              <Text style={{ color: c.text, fontWeight: '800' }}>{g.amount}</Text>
              <StatusPill status={g.status} c={c} />
            </View>
            <ChevronRight size={14} color={c.textMuted} />
          </Pressable>
        ))}
      </ScreenScroll>
      <BottomNav screen="lingkod" go={go} c={c} t={t} />
    </View>
  );
}

export function GovernmentDetail({ go, t, c }: { go: (s: Screen) => void; t: Copy; c: Palette }) {
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <AppHeader title={t.lingkod.details} onBack={() => go('lingkod')} c={c} trailing={<Pressable style={[styles.iconBtn, { backgroundColor: c.surface }]}><Pencil size={16} color={c.text} /></Pressable>} />
      <ScreenScroll>
        <View style={[styles.hero, { backgroundColor: c.surface }]}>
          <View style={[styles.govMark, { width: 46, height: 46, borderRadius: 15 }]}><Text style={{ color: '#fff', fontWeight: '800', fontSize: 18 }}>S</Text></View>
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.text, fontSize: 18, fontWeight: '800' }}>SSS Contribution</Text>
            <Text style={{ color: c.textMuted }}>{t.lingkod.monthly}</Text>
          </View>
          <StatusPill status="Upcoming" c={c} />
        </View>
        <Card c={c}>
          <Line c={c} label={t.lingkod.prepare} value="₱1,400" large />
          <Line c={c} label={t.bills.due} value="Sep 10, 2026" />
          <Line c={c} label={t.lingkod.reference} value="SS Number •••• 2814" last />
        </Card>
        <Card c={c} style={styles.between}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
            <View style={[styles.soft, { backgroundColor: c.primarySoft }]}><Bell size={17} color={c.primary} /></View>
            <View><Text style={{ color: c.text, fontWeight: '800' }}>{t.lingkod.deadline}</Text><Text style={{ color: c.textMuted, fontSize: 12 }}>{t.lingkod.deadlineHint}</Text></View>
          </View>
          <Switch value trackColor={{ true: c.primary }} />
        </Card>
        <View style={{ gap: 9, marginTop: 16 }}>
          <PrimaryButton title={t.lingkod.openOfficial} onPress={() => {}} c={c} />
          <SecondaryButton title={t.lingkod.markDone} onPress={() => go('lingkod')} c={c} icon={<Check size={16} color={c.text} />} />
        </View>
        <View style={{ flexDirection: 'row', gap: 7, marginTop: 12 }}>
          <ShieldCheck size={13} color={c.primary} />
          <Text style={{ color: c.textMuted, fontSize: 12, flex: 1 }}>{t.lingkod.legal}</Text>
        </View>
      </ScreenScroll>
    </View>
  );
}

export function NotificationsScreen({ go, t, c }: { go: (s: Screen) => void; t: Copy; c: Palette }) {
  const [unread, setUnread] = useState(true);
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <AppHeader title={t.notifications.title} onBack={() => go('home')} c={c} trailing={
        <Pressable onPress={() => setUnread(false)}><Text style={{ color: c.primary, fontWeight: '700', fontSize: 12 }}>{unread ? t.notifications.markRead : t.notifications.allRead}</Text></Pressable>
      } />
      <ScreenScroll>
        <Text style={styles.group}>{t.notifications.today}</Text>
        <Note c={c} unread={unread} icon={<Clock3 size={16} color={c.warning} />} tone="amber" title={t.notifications.meralco} body="₱2,450.36 · Sep 8" time="9:00 AM" onPress={() => { setUnread(false); go('bill-detail'); }} />
        <Note c={c} unread={unread} icon={<Landmark size={16} color={c.primary} />} tone="green" title={t.notifications.sss} body={t.notifications.sssBody} time="8:30 AM" onPress={() => { setUnread(false); go('government-detail'); }} />
        <Text style={styles.group}>{t.notifications.yesterday}</Text>
        <Note c={c} icon={<Smartphone size={16} color={c.textMuted} />} tone="neutral" title={t.notifications.globe} body="₱99" time="Sep 1" onPress={() => go('load-detail')} />
      </ScreenScroll>
    </View>
  );
}

export function StoryScreen({ go, t, c }: { go: (s: Screen) => void; t: Copy; c: Palette }) {
  const videoRef = useRef<Video>(null);
  const [playing, setPlaying] = useState(true);
  const toggle = async () => {
    const video = videoRef.current;
    if (!video) return;
    const status = await video.getStatusAsync();
    if (status.isLoaded && status.isPlaying) { await video.pauseAsync(); setPlaying(false); }
    else { await video.playAsync(); setPlaying(true); }
  };
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <AppHeader title={t.story.title} onBack={() => go('home')} c={c} trailing={
        <Pressable onPress={() => void toggle()} style={[styles.accent, { backgroundColor: c.primary }]}>
          {playing ? <Pause size={16} color="#fff" /> : <Play size={16} color="#fff" />}
        </Pressable>
      } />
      <ScreenScroll withNav>
        <View style={styles.stage}>
          <Video ref={videoRef} source={storyVideo} style={StyleSheet.absoluteFill} resizeMode={ResizeMode.COVER} shouldPlay isLooping isMuted />
          <LinearGradient colors={['rgba(4,13,70,0.08)', 'rgba(4,8,37,0.94)']} style={StyleSheet.absoluteFill} />
          <View style={{ position: 'absolute', left: 18, top: 18 }}><BrandLogo inverted compact /></View>
          <View style={styles.storyCopy}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
              <Sparkles size={12} color="#D8DCFF" />
              <Text style={{ color: '#D8DCFF', fontSize: 11, fontWeight: '800', letterSpacing: 0.8 }}>{t.story.kicker}</Text>
            </View>
            <Text style={styles.storyH}>{t.story.headline}</Text>
            <Text style={{ color: '#DCE1FF', fontSize: 13, lineHeight: 19 }}>{t.story.body}</Text>
            <Pressable onPress={() => void toggle()} style={styles.filmBtn}>
              {playing ? <Pause size={12} color="#fff" /> : <Play size={12} color="#fff" />}
              <Text style={{ color: '#fff', fontWeight: '800', fontSize: 12 }}>{playing ? t.story.pause : t.story.play}</Text>
            </Pressable>
          </View>
        </View>
        <View style={styles.metrics}>
          {[['1', t.story.metric1], ['3d', t.story.metric2], ['0', t.story.metric3]].map(([n, l]) => (
            <View key={l} style={[styles.metric, { backgroundColor: c.surface }]}>
              <Text style={{ color: c.primary, fontSize: 20, fontWeight: '800' }}>{n}</Text>
              <Text style={{ color: c.textMuted, fontSize: 11, textAlign: 'center' }}>{l}</Text>
            </View>
          ))}
        </View>
        <Card c={c}>
          <Text style={{ color: c.primary, fontSize: 11, fontWeight: '800', letterSpacing: 1.2 }}>{t.story.board}</Text>
          <Text style={{ color: c.text, fontSize: 20, fontWeight: '800', marginVertical: 8 }}>{t.story.boardTitle}</Text>
          {[[t.story.s1, t.story.s1b], [t.story.s2, t.story.s2b], [t.story.s3, t.story.s3b]].map(([title, body], i) => (
            <View key={title} style={[styles.scene, { borderTopColor: c.border }]}>
              <View style={styles.sceneNum}><Text style={{ color: c.primary, fontWeight: '800', fontSize: 11 }}>0{i + 1}</Text></View>
              <View><Text style={{ color: c.text, fontWeight: '800' }}>{title}</Text><Text style={{ color: c.textMuted, fontSize: 12 }}>{body}</Text></View>
            </View>
          ))}
        </Card>
        <LinearGradient colors={[...gradient.hero]} style={styles.cta}>
          <Image source={images.onboarding} style={styles.ctaImg} />
          <Text style={{ color: '#CBD4FF', fontSize: 10, letterSpacing: 1.2 }}>{t.story.ready}</Text>
          <Text style={{ color: '#fff', fontSize: 18, fontWeight: '800', marginVertical: 8, width: '68%' }}>{t.story.cta}</Text>
          <Pressable onPress={() => go('onboarding')} style={styles.ctaBtn}>
            <Text style={{ color: '#2E42C9', fontWeight: '800' }}>{t.story.start}</Text>
            <ChevronRight size={14} color="#2E42C9" />
          </Pressable>
        </LinearGradient>
      </ScreenScroll>
      <BottomNav screen="story" go={go} c={c} t={t} />
    </View>
  );
}

export function StateScreen({ kind, go, t, c }: { kind: 'offline' | 'empty' | 'error'; go: (s: Screen) => void; t: Copy; c: Palette }) {
  const data = kind === 'offline'
    ? { icon: <WifiOff size={28} color={c.textMuted} />, title: t.states.offline, body: t.states.offlineBody, action: t.states.tryAgain }
    : kind === 'error'
      ? { icon: <AlertTriangle size={28} color={c.danger} />, title: t.states.error, body: t.states.errorBody, action: t.states.tryAgain }
      : { icon: <CheckCircle2 size={28} color={c.primary} />, title: t.empty.caught, body: t.empty.noneDue, action: t.empty.add };
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <AppHeader title={kind === 'offline' ? t.states.offline : t.bills.title} onBack={() => go('settings')} c={c} />
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 42, paddingBottom: 80 }}>
        <View style={[styles.stateIcon, { backgroundColor: kind === 'error' ? c.dangerSoft : kind === 'offline' ? c.surface2 : c.primarySoft }]}>{data.icon}</View>
        <Text style={{ color: c.text, fontSize: 22, fontWeight: '800', marginTop: 16 }}>{data.title}</Text>
        <Text style={{ color: c.textMuted, textAlign: 'center', marginVertical: 8 }}>{data.body}</Text>
        <View style={{ width: '100%' }}>
          <PrimaryButton title={data.action} onPress={() => go(kind === 'empty' ? 'add-bill' : kind === 'error' ? 'bill-detail' : 'home')} c={c} icon={kind === 'empty' ? <Plus size={16} color="#fff" /> : <RefreshCw size={16} color="#fff" />} />
        </View>
      </View>
    </View>
  );
}

function Lead({ c, icon, title, body, gov }: { c: Palette; icon: ReactNode; title: string; body: string; gov?: boolean }) {
  return (
    <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center', paddingBottom: 14 }}>
      <View style={[styles.soft, { width: 44, height: 44, borderRadius: 14, backgroundColor: gov ? '#EDF0F3' : c.primarySoft }]}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: c.text, fontSize: 16, fontWeight: '800' }}>{title}</Text>
        <Text style={{ color: c.textMuted, fontSize: 12 }}>{body}</Text>
      </View>
    </View>
  );
}

function Line({ c, label, value, large, last }: { c: Palette; label: string; value: string; large?: boolean; last?: boolean }) {
  return (
    <View style={[styles.between, { paddingVertical: 12, borderBottomWidth: last ? 0 : StyleSheet.hairlineWidth, borderBottomColor: c.border }]}>
      <Text style={{ color: c.textMuted }}>{label}</Text>
      <Text style={{ color: c.text, fontWeight: '800', fontSize: large ? 17 : 14 }}>{value}</Text>
    </View>
  );
}

function Note({ c, unread, icon, tone, title, body, time, onPress }: { c: Palette; unread?: boolean; icon: ReactNode; tone: string; title: string; body: string; time: string; onPress: () => void }) {
  const bg = tone === 'amber' ? c.warningSoft : tone === 'green' ? c.primarySoft : c.surface2;
  return (
    <Pressable onPress={onPress} style={[styles.note, { backgroundColor: unread ? c.primarySoft : c.surface, borderBottomColor: c.border }]}>
      <View style={[styles.noteIcon, { backgroundColor: bg }]}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={{ color: c.text, fontWeight: '800' }}>{title}</Text>
        <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 3 }}>{body}</Text>
        <Text style={{ color: c.textMuted, fontSize: 11, marginTop: 2 }}>{time}</Text>
      </View>
      {unread && <View style={[styles.unread, { backgroundColor: c.primary }]} />}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: { borderWidth: 1, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 8 },
  actRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth },
  accent: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  iconBtn: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  rowCard: { flexDirection: 'row', alignItems: 'center', gap: 10, padding: 14, borderRadius: 16, borderWidth: 1, marginBottom: 10 },
  hero: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 18, borderRadius: 20, marginBottom: 12 },
  between: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  soft: { width: 34, height: 34, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  govMark: { width: 35, height: 35, borderRadius: 11, backgroundColor: '#42576B', alignItems: 'center', justifyContent: 'center' },
  group: { fontSize: 13, fontWeight: '700', marginTop: 12, marginBottom: 8, color: '#6B7190' },
  note: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, padding: 13, borderBottomWidth: StyleSheet.hairlineWidth },
  noteIcon: { width: 35, height: 35, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  unread: { width: 6, height: 6, borderRadius: 3, marginTop: 6 },
  stage: { height: 420, borderRadius: 27, overflow: 'hidden', backgroundColor: '#08155C' },
  storyCopy: { position: 'absolute', left: 20, right: 20, bottom: 28 },
  storyH: { color: '#fff', fontSize: 28, fontWeight: '800', letterSpacing: -0.8, marginVertical: 8 },
  filmBtn: { marginTop: 10, alignSelf: 'flex-start', flexDirection: 'row', gap: 6, alignItems: 'center', paddingHorizontal: 13, height: 34, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(255,255,255,0.25)', backgroundColor: 'rgba(255,255,255,0.13)' },
  metrics: { flexDirection: 'row', gap: 7, marginVertical: 13 },
  metric: { flex: 1, padding: 12, borderRadius: 14, alignItems: 'center' },
  scene: { flexDirection: 'row', gap: 10, paddingVertical: 12, borderTopWidth: StyleSheet.hairlineWidth },
  sceneNum: { width: 30, height: 30, borderRadius: 10, backgroundColor: '#EDF1FF', alignItems: 'center', justifyContent: 'center' },
  cta: { minHeight: 170, marginVertical: 13, borderRadius: 20, overflow: 'hidden', padding: 18, justifyContent: 'center' },
  ctaImg: { position: 'absolute', width: 200, height: 180, right: -56, bottom: -31, opacity: 0.55 },
  ctaBtn: { alignSelf: 'flex-start', backgroundColor: '#fff', height: 37, paddingHorizontal: 14, borderRadius: 12, flexDirection: 'row', alignItems: 'center', gap: 4 },
  stateIcon: { width: 74, height: 74, borderRadius: 37, alignItems: 'center', justifyContent: 'center' },
});
