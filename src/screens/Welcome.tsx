import { LinearGradient } from 'expo-linear-gradient';
import { ShieldCheck } from 'lucide-react-native';
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandMark, PrimaryButton } from '../components/ui';
import { images } from '../data';
import type { Copy } from '../i18n';
import { useLayout } from '../layout';
import type { Palette } from '../theme';
import type { Screen } from '../types';

export function WelcomeScreen({ go, t, c }: { go: (s: Screen) => void; t: Copy; c: Palette }) {
  const insets = useSafeAreaInsets();
  const layout = useLayout();
  return <LinearGradient colors={['#040B49', '#061779', '#030B48']} locations={[0, .56, 1]} style={styles.root}>
    <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, minHeight: Math.max(720, layout.appHeight), paddingTop: insets.top + (layout.isCompact ? 30 : 65), paddingBottom: insets.bottom + 30 }}>
      <View style={styles.brand}>
        <BrandMark size={88} />
        <Text style={styles.title}>{t.brand.name}</Text>
        <Text style={styles.tag}>Bayad. Organisado. Panatag.</Text>
        <Text style={styles.sub}>Para sa bawat pamilyang Pilipino.</Text>
      </View>
      <View style={{ flex: 1, minHeight: 290, maxHeight: 410, justifyContent: 'center' }}>
        <Image source={images.welcome} resizeMode="contain" style={{ width: '106%', height: '100%', minHeight: 290, alignSelf: 'center' }} accessibilityLabel="A Filipino home with bill reminders and a Philippine flag" />
      </View>
      <View style={styles.actions}>
        <PrimaryButton title="Magsimula" onPress={() => go('onboarding')} c={c} />
        <Pressable accessibilityRole="button" onPress={() => go('login')} style={styles.login}>
          <Text style={{ color: '#FFFFFF', fontSize: 15 }}>May account na? <Text style={{ color: '#80B8FF' }}>Mag-login</Text></Text>
        </Pressable>
        <View style={styles.trust}><ShieldCheck size={24} color="#BBC6EF" /><Text style={styles.trustText}>Hindi e-wallet. Hindi tumatanggap ng pera. Bayarin ay gabay at tagasubaybay lamang.</Text></View>
      </View>
    </ScrollView>
  </LinearGradient>;
}
const styles = StyleSheet.create({
  root: { flex: 1 },
  brand: { alignItems: 'center', paddingHorizontal: 20 },
  title: { color: '#FFFFFF', fontSize: 50, fontWeight: '700', letterSpacing: -1.8, marginTop: 2 },
  tag: { color: '#FFFFFF', fontSize: 16, fontWeight: '500', marginTop: 10 },
  sub: { color: '#FFFFFF', fontSize: 14, marginTop: 7 },
  actions: { paddingHorizontal: 22, paddingTop: 8 },
  login: { alignItems: 'center', justifyContent: 'center', minHeight: 60 },
  trust: { flexDirection: 'row', alignSelf: 'center', gap: 12, maxWidth: 275, paddingTop: 22 },
  trustText: { flex: 1, color: '#D6DCF7', fontSize: 12, lineHeight: 18 },
});
