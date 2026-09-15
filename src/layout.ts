import { useWindowDimensions } from 'react-native';

export function useLayout() {
  const { width, height } = useWindowDimensions();
  const appWidth = width;
  const appHeight = height;
  const isCompact = appHeight < 740;
  const pad = 18;
  const titleSize = isCompact ? 26 : 28;
  const heroH = isCompact ? 196 : 248;

  return {
    width,
    height,
    framed: false,
    frameWidth: width,
    frameHeight: height,
    appWidth,
    appHeight,
    isPhone: true,
    isTablet: false,
    isDesktop: false,
    isCompact,
    pad,
    titleSize,
    heroH,
  };
}

export type Layout = ReturnType<typeof useLayout>;
