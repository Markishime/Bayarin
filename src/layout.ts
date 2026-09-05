import { useWindowDimensions } from 'react-native';

export function useLayout() {
  const { width, height } = useWindowDimensions();
  const framed = width >= 540;
  const frameWidth = 420;
  const frameHeight = Math.max(280, height - 32);
  const appWidth = framed ? frameWidth : width;
  const appHeight = framed ? frameHeight : height;
  const isCompact = appHeight < 740;
  const pad = 18;
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
    isTablet: framed && width < 1000,
    isDesktop: false,
    isCompact,
    pad,
    titleSize,
    heroH,
  };
}

export type Layout = ReturnType<typeof useLayout>;
