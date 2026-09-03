import { LinearGradient } from 'expo-linear-gradient';
import type { ReactNode } from 'react';
import { useEffect } from 'react';
import { Image, Pressable, StyleSheet, type ImageSourcePropType, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  FadeInDown,
  FadeInUp,
  interpolate,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSpring,
  withTiming,
  ZoomIn,
} from 'react-native-reanimated';

const ease = Easing.inOut(Easing.sin);

export function ScreenTransition({ id, children }: { id: string; children: ReactNode }) {
  return (
    <Animated.View
      key={id}
      entering={FadeInDown.springify().damping(18).stiffness(180)}
      style={styles.screen}
    >
      {children}
    </Animated.View>
  );
}

export function Float3D({
  children, delay = 0, intensity = 1, style,
}: { children: ReactNode; delay?: number; intensity?: number; style?: ViewStyle }) {
  const t = useSharedValue(0);
  useEffect(() => {
    const timeout = setTimeout(() => {
      t.value = withRepeat(withTiming(1, { duration: 4200, easing: ease }), -1, true);
    }, delay);
    return () => clearTimeout(timeout);
  }, [delay, t]);
  const anim = useAnimatedStyle(() => ({
    transform: [
      { perspective: 900 },
      { translateY: interpolate(t.value, [0, 1], [-10 * intensity, 10 * intensity]) },
      { rotateY: `${interpolate(t.value, [0, 1], [-10 * intensity, 10 * intensity])}deg` },
      { rotateX: `${interpolate(t.value, [0, 1], [5 * intensity, -5 * intensity])}deg` },
      { scale: interpolate(t.value, [0, 1], [1, 1.045]) },
    ],
  }));
  return <Animated.View style={[anim, style]}>{children}</Animated.View>;
}

export function Pulse3D({ children }: { children: ReactNode }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: 2200, easing: ease }), -1, true);
  }, [t]);
  const anim = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(t.value, [0, 1], [1, 1.08]) }],
    opacity: interpolate(t.value, [0, 1], [0.55, 1]),
  }));
  return <Animated.View style={anim}>{children}</Animated.View>;
}

export function OrbitOrb({ size, color, radiusX, radiusY, duration, delay = 0 }: {
  size: number; color: string; radiusX: number; radiusY: number; duration: number; delay?: number;
}) {
  const t = useSharedValue(0);
  useEffect(() => {
    const timeout = setTimeout(() => {
      t.value = withRepeat(withTiming(1, { duration, easing: Easing.linear }), -1, false);
    }, delay);
    return () => clearTimeout(timeout);
  }, [delay, duration, t]);
  const anim = useAnimatedStyle(() => {
    const a = t.value * Math.PI * 2;
    return {
      transform: [
        { translateX: Math.cos(a) * radiusX },
        { translateY: Math.sin(a) * radiusY },
      ],
      opacity: 0.35 + 0.35 * Math.sin(a),
    };
  });
  return (
    <Animated.View style={[styles.orb, { width: size, height: size, borderRadius: size / 2, backgroundColor: color }, anim]} />
  );
}

export function PressScale({ children, onPress, disabled, style }: {
  children: ReactNode; onPress?: () => void; disabled?: boolean; style?: ViewStyle;
}) {
  const s = useSharedValue(1);
  const anim = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
  return (
    <Pressable
      disabled={disabled}
      onPress={onPress}
      onPressIn={() => { s.value = withSpring(0.96, { damping: 15, stiffness: 400 }); }}
      onPressOut={() => { s.value = withSpring(1, { damping: 12, stiffness: 260 }); }}
    >
      <Animated.View style={[anim, style]}>{children}</Animated.View>
    </Pressable>
  );
}

export function TiltCard({ children, style }: { children: ReactNode; style?: ViewStyle }) {
  const t = useSharedValue(0);
  useEffect(() => {
    t.value = withRepeat(withTiming(1, { duration: 5600, easing: ease }), -1, true);
  }, [t]);
  const anim = useAnimatedStyle(() => ({
    transform: [
      { perspective: 1000 },
      { rotateX: `${interpolate(t.value, [0, 1], [4, -4])}deg` },
      { rotateY: `${interpolate(t.value, [0, 1], [-7, 7])}deg` },
    ],
  }));
  return <Animated.View style={[anim, style]}>{children}</Animated.View>;
}

export function SceneArt({ source, height = 280 }: { source: ImageSourcePropType; height?: number }) {
  return (
    <Float3D intensity={1.15} style={[styles.scene, { height }]}>
      <Image source={source} style={styles.sceneImg} />
      <LinearGradient colors={['transparent', 'rgba(8,24,94,0.28)']} style={StyleSheet.absoluteFill} />
    </Float3D>
  );
}

export function Stagger({ index, children, style }: { index: number; children: ReactNode; style?: ViewStyle }) {
  return (
    <Animated.View entering={FadeInUp.delay(index * 70).springify().damping(16)} style={style}>
      {children}
    </Animated.View>
  );
}

export function PopIn({ children }: { children: ReactNode }) {
  return <Animated.View entering={ZoomIn.springify().damping(14)}>{children}</Animated.View>;
}

const styles = StyleSheet.create({
  screen: { flex: 1, minHeight: 0, height: '100%', overflow: 'hidden' },
  orb: { position: 'absolute', alignSelf: 'center', top: '38%' },
  scene: { borderRadius: 28, overflow: 'hidden', backgroundColor: '#0C1E7D' },
  sceneImg: { width: '112%', height: '112%', marginLeft: '-6%', marginTop: '-6%' },
});
