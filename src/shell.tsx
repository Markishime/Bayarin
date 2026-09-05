import type { ReactNode } from 'react';
import { View } from 'react-native';
import { useLayout } from './layout';
import type { Palette } from './theme';
import type { Screen } from './types';

export function AppShell({ children, c, immersive = false }: {
  children: ReactNode; c: Palette; immersive?: boolean; screen: Screen;
  go: (screen: Screen) => void; userName: string; signedIn: boolean;
}) {
  const layout = useLayout();
  return <View style={{ flex: 1, width: '100%', backgroundColor: c.bg, alignItems: 'center', justifyContent: 'center' }}>
    <View style={{ width: layout.framed ? layout.frameWidth : '100%', height: layout.framed ? layout.frameHeight : '100%', overflow: 'hidden', backgroundColor: immersive ? '#030B50' : c.bg, borderRadius: layout.framed ? 34 : 0, borderWidth: layout.framed ? 1 : 0, borderColor: c.border, boxShadow: layout.framed ? '0 20px 80px rgba(42,37,132,0.10)' : undefined }}>
      {children}
    </View>
  </View>;
}
