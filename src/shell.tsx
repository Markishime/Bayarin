import type { ReactNode } from 'react';
import { View } from 'react-native';
import type { Palette } from './theme';
import type { Screen } from './types';

export function AppShell({ children, c, immersive = false }: {
  children: ReactNode; c: Palette; immersive?: boolean; screen: Screen;
  go: (screen: Screen) => void; userName: string; signedIn: boolean;
}) {
  return <View style={{ flex: 1, width: '100%', backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ width: '100%', height: '100%', overflow: 'hidden', backgroundColor: immersive ? '#030B50' : c.bg }}>
      {children}
    </View>
  </View>;
}