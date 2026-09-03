import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode } from 'expo-av';
import type { ReactNode } from 'react';
import { StyleSheet, View } from 'react-native';
import { storyVideo } from './data';
import { useLayout } from './layout';
import { OrbitOrb } from './motion';
import type { Palette } from './theme';

export function AppShell({ children, c }: { children: ReactNode; c: Palette }) {
  const layout = useLayout();

  return (
    <View style={styles.root}>
      {layout.framed && (
        <View style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>
          <Video
            source={storyVideo}
            style={StyleSheet.absoluteFill}
            resizeMode={ResizeMode.COVER}
            shouldPlay
            isLooping
            isMuted
          />
          <LinearGradient
            colors={['rgba(7,21,58,0.55)', 'rgba(8,16,48,0.82)', 'rgba(7,12,32,0.94)']}
            style={StyleSheet.absoluteFill}
          />
          <OrbitOrb size={220} color="rgba(92,80,255,0.28)" radiusX={180} radiusY={80} duration={14000} />
          <OrbitOrb size={120} color="rgba(231,42,122,0.22)" radiusX={240} radiusY={120} duration={10000} delay={400} />
        </View>
      )}

      <View
        style={[
          styles.frame,
          layout.framed
            ? {
                width: layout.frameWidth,
                height: layout.frameHeight,
                borderRadius: 36,
                borderWidth: 1,
                borderColor: 'rgba(255,255,255,0.14)',
                backgroundColor: c.bg,
                shadowColor: '#000',
                shadowOpacity: 0.35,
                shadowRadius: 40,
                shadowOffset: { width: 0, height: 18 },
              }
            : {
                flex: 1,
                width: '100%',
                height: '100%',
                backgroundColor: c.bg,
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
    backgroundColor: '#07153A',
    overflow: 'hidden',
  },
  frame: {
    overflow: 'hidden',
    flexDirection: 'column',
  },
});
