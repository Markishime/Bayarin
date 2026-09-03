import { Video, ResizeMode } from 'expo-av';
import { LinearGradient } from 'expo-linear-gradient';
import { Bell, CalendarDays, ChevronRight, Play, ShieldCheck } from 'lucide-react-native';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandMark, PrimaryButton } from '../components/ui';
import { storyVideo } from '../data';
import type { Copy } from '../i18n';
import { useLayout } from '../layout';
import { Float3D, OrbitOrb, Stagger } from '../motion';
import type { Palette } from '../theme';
import type { Screen } from '../types';

export function WelcomeScreen({ go, t, c }: { go: (s: Screen) => void; t: Copy; c: Palette }) {
  const insets = useSafeAreaInsets();
  const layout = useLayout();
  return (
    <View style={[styles.root, { justifyContent: 'space-between' }]}>
      <Video source={storyVideo} style={StyleSheet.absoluteFill} resizeMode={ResizeMode.COVER} shouldPlay isLooping isMuted />
      <LinearGradient colors={['rgba(4,17,82,0.28)', 'rgba(5,12,53,0.5)', 'rgba(5,12,53,0.96)']} style={StyleSheet.absoluteFill} />
      <OrbitOrb size={220} color="rgba(91,43,212,0.45)" radiusX={140} radiusY={80} duration={12000} />
      <OrbitOrb size={110} color="rgba(213,44,121,0.4)" radiusX={200} radiusY={130} duration={9000} delay={300} />
      <OrbitOrb size={70} color="rgba(22,139,255,0.5)" radiusX={80} radiusY={170} duration={7000} delay={700} />

      <View style={[styles.top, { paddingTop: insets.top + 8, paddingHorizontal: layout.pad }]}>
        <Text style={styles.kicker}>{t.welcome.organize}</Text>
        <Text style={styles.kicker}>{t.welcome.stayOnTrack}</Text>
      </View>

      <View style={[styles.brand, { marginTop: layout.isCompact ? 12 : 28 }]}>
        <BrandMark size={layout.isCompact ? 56 : 78} fontSize={layout.isCompact ? 34 : 48} />
        <Stagger index={0}><Text style={[styles.title, { fontSize: layout.titleSize + (layout.isCompact ? 4 : 8) }]}>{t.brand.name}</Text></Stagger>
        <Stagger index={1}><Text style={styles.tag}>{t.brand.tagline}</Text></Stagger>
        <Stagger index={2}><Text style={styles.sub}>{t.brand.forFilipinos}</Text></Stagger>
      </View>

      {!layout.isCompact && <View style={[styles.rail, { paddingHorizontal: layout.pad }]}>
        {[
          { Icon: CalendarDays, label: t.welcome.featureOrg },
          { Icon: Bell, label: t.welcome.featureRemind },
          { Icon: ShieldCheck, label: t.welcome.featureSafe },
        ].map(({ Icon, label }, i) => (
          <Stagger key={label} index={i + 3}>
            <Float3D delay={i * 160} intensity={0.7}>
              <View style={styles.chip}>
                <Icon size={15} color="#FFD45C" />
                <Text style={styles.chipText}>{label}</Text>
              </View>
            </Float3D>
          </Stagger>
        ))}
      </View>}

      <View style={[styles.actions, { paddingBottom: insets.bottom + 20, paddingHorizontal: layout.pad, maxWidth: 520, width: '100%', alignSelf: 'center' }]}>
        <PrimaryButton title={t.welcome.start} onPress={() => go('onboarding')} light c={c} icon={<ChevronRight size={18} color="#253CC0" />} />
        <Pressable onPress={() => go('story')} style={styles.storyLink}>
          <Play size={14} color="#fff" fill="#fff" />
          <Text style={styles.storyText}>{t.brand.storyCta}</Text>
        </Pressable>
        <Pressable onPress={() => go('login')} style={styles.loginLink}>
          <Text style={styles.loginMuted}>{t.brand.hasAccount} </Text>
          <Text style={styles.loginBold}>{t.brand.login}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#07195F', overflow: 'hidden' },
  top: { flexDirection: 'row', justifyContent: 'space-between' },
  kicker: { color: '#DCE1FF', fontSize: 11, letterSpacing: 1.2, textTransform: 'uppercase', fontWeight: '700' },
  brand: { alignItems: 'center', marginTop: 28 },
  title: { color: '#fff', fontWeight: '900', letterSpacing: -1.6, marginTop: 16, textShadowColor: 'rgba(0,0,40,0.35)', textShadowRadius: 16 },
  tag: { color: '#fff', fontSize: 16, fontWeight: '700' },
  sub: { color: '#E1E4FF', fontSize: 13, marginTop: 8 },
  rail: { flexDirection: 'row', justifyContent: 'center', flexWrap: 'wrap', gap: 8 },
  chip: { minWidth: 96, paddingVertical: 10, paddingHorizontal: 10, borderRadius: 15, borderWidth: 1, borderColor: 'rgba(255,255,255,0.18)', backgroundColor: 'rgba(8,17,79,0.55)', flexDirection: 'row', alignItems: 'center', gap: 6 },
  chipText: { color: '#fff', fontSize: 11, fontWeight: '800' },
  actions: { paddingTop: 16 },
  storyLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, marginTop: 14 },
  storyText: { color: '#fff', fontSize: 13, fontWeight: '800' },
  loginLink: { flexDirection: 'row', justifyContent: 'center', marginTop: 12 },
  loginMuted: { color: '#E0E4FF', fontSize: 13 },
  loginBold: { color: '#fff', fontSize: 13, fontWeight: '800' },
});
