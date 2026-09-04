import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { images } from './data';
import { useLayout } from './layout';
import { fade, type Palette } from './theme';

export function AppShell({ children, c, immersive = false }: { children: ReactNode; c: Palette; immersive?: boolean }) {
  const layout = useLayout();

  return (
    <View style={[styles.root, { backgroundColor: immersive ? '#0B1B42' : c.bgElevated }]}>
      {immersive ? (
        <ImageBackground source={images.welcome} resizeMode="cover" style={StyleSheet.absoluteFill}>
          <LinearGradient colors={['rgba(8,18,48,0.42)', 'rgba(10,24,58,0.28)', 'rgba(8,14,40,0.62)']} style={StyleSheet.absoluteFill} />
        </ImageBackground>
      ) : null}

      <View
        style={[
          styles.frame,
          layout.framed
            ? {
                width: layout.frameWidth,
                height: layout.frameHeight,
                borderRadius: 36,
                borderWidth: 1,
                borderColor: fade(c.border, 0.9),
                backgroundColor: immersive ? 'transparent' : c.bg,
                shadowColor: c.shadow,
                shadowOpacity: 0.28,
                shadowRadius: 36,
                shadowOffset: { width: 0, height: 16 },
              }
            : {
                flex: 1,
                width: '100%',
                height: '100%',
                backgroundColor: immersive ? 'transparent' : c.bg,
              },
        ]}
      >
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  frame: {
    overflow: 'hidden',
    flexDirection: 'column',
  },
});
