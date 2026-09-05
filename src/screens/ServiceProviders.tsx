import { ChevronRight, Plus, Search } from 'lucide-react-native';
import { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { AppHeader, Card, CinematicHero, ProviderMark, ScreenScroll } from '../components/ui';
import type { BillService, ServiceProvider } from '../data';
import type { Copy } from '../i18n';
import type { Palette } from '../theme';
import type { Screen } from '../types';

export function ServiceProvidersScreen({
  go, t, c, service, onSelectProvider,
}: {
  go: (screen: Screen) => void; t: Copy; c: Palette; service: BillService;
  onSelectProvider: (provider: ServiceProvider) => void;
}) {
  const [query, setQuery] = useState('');
  const visibleProviders = useMemo(() => service.providers.filter((provider) =>
    `${provider.name} ${provider.detail}`.toLowerCase().includes(query.trim().toLowerCase()),
  ), [query, service.providers]);
  const choose = (provider: ServiceProvider) => { onSelectProvider(provider); go('add-bill'); };

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <AppHeader title={service.name} onBack={() => go('home')} c={c} />
      <ScreenScroll>
        <CinematicHero pose="services" height={160} c={c} title="Choose a provider" subtitle={`${service.detail}. Your household only adds the bills it uses.`} />
        <View style={[styles.search, { backgroundColor: c.surface, borderColor: c.border }]}>
          <Search size={16} color={c.textMuted} />
          <TextInput value={query} onChangeText={setQuery} placeholder="Search providers" placeholderTextColor={c.textSoft}
            style={{ flex: 1, color: c.text, fontSize: 15, outlineWidth: 0, outlineStyle: 'solid', outlineColor: 'transparent' }} />
        </View>
        <Text style={{ color: c.textMuted, fontSize: 11, fontWeight: '600', letterSpacing: .7, marginTop: 18, marginBottom: 9 }}>AVAILABLE PROVIDERS</Text>
        {visibleProviders.map((provider) => (
          <Card key={provider.id} c={c} onPress={() => choose(provider)} style={styles.row}>
            <ProviderMark tone={provider.tone} letter={provider.mark} size={42} />
            <View style={{ flex: 1 }}>
              <Text style={{ color: c.text, fontSize: 15, fontWeight: '600' }}>{provider.name}</Text>
              <Text style={{ color: c.textMuted, fontSize: 12, marginTop: 2 }}>{provider.detail}</Text>
            </View>
            {provider.id.includes('other') ? <Plus size={17} color={c.primary} /> : <ChevronRight size={17} color={c.textMuted} />}
          </Card>
        ))}
        {!visibleProviders.length && <View style={[styles.empty, { backgroundColor: c.surface, borderColor: c.border }]}><Text style={{ color: c.text, fontWeight: '600' }}>No provider found</Text><Text style={{ color: c.textMuted, fontSize: 12, marginTop: 3 }}>Try another search or choose Other provider.</Text></View>}
      </ScreenScroll>
    </View>
  );
}

const styles = StyleSheet.create({
  copy: { padding: 16, borderRadius: 20 },
  search: { marginTop: 14, height: 50, paddingHorizontal: 14, borderWidth: 1, borderRadius: 15, flexDirection: 'row', alignItems: 'center', gap: 9 },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, marginBottom: 9 },
  empty: { borderWidth: 1, borderRadius: 16, padding: 18, alignItems: 'center' },
});
