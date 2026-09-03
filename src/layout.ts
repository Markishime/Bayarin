import { useWindowDimensions } from 'react-native';

export function useLayout() {
  const { width, height } = useWindowDimensions();
  const framed = width >= 680;
  const frameWidth = 430;
  const frameHeight = Math.max(580, Math.min(Math.round(height - 32), 874));
  const appWidth = framed ? frameWidth : width;
  const appHeight = framed ? frameHeight : height;
  const isCompact = appHeight < 740;
  const pad = 16;
  const titleSize = isCompact ? 26 : 28;
  const heroH = isCompact ? 196 : 248;

  return {
    width,
    height,
    framed,
    frameWidth,
    frameHeight,
    appWidth,
    appHeight,
    isPhone: !framed,
    isTablet: false,
    isDesktop: framed,
    isCompact,
    pad,
    titleSize,
    heroH,
  };
}

export type Layout = ReturnType<typeof useLayout>;
