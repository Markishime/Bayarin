export const light = {
  bg: '#F3F5FB',
  bgElevated: '#FFFFFF',
  surface: '#FFFFFF',
  surface2: '#EEF1F8',
  text: '#101528',
  textMuted: '#6B7190',
  textSoft: '#8B90A8',
  border: '#E2E6F2',
  primary: '#2F46E8',
  primaryDeep: '#1A2FBE',
  primarySoft: '#EEF1FF',
  accent: '#E72A7A',
  warning: '#C47A12',
  warningSoft: '#FFF3DD',
  danger: '#D53637',
  dangerSoft: '#FDECEA',
  success: '#16814D',
  successSoft: '#EAF8F0',
  overlay: 'rgba(10, 14, 40, 0.48)',
  nav: 'rgba(255,255,255,0.92)',
  shadow: 'rgba(30, 35, 102, 0.10)',
};

export const dark = {
  bg: '#0B0E1A',
  bgElevated: '#15192B',
  surface: '#181C2D',
  surface2: '#22263A',
  text: '#F5F6FB',
  textMuted: '#A8AEC1',
  textSoft: '#7E849A',
  border: '#343A54',
  primary: '#7C92FF',
  primaryDeep: '#5B73F2',
  primarySoft: '#202A55',
  accent: '#FF4D96',
  warning: '#E1A044',
  warningSoft: '#362913',
  danger: '#E06A61',
  dangerSoft: '#3B201E',
  success: '#3DCF8A',
  successSoft: '#163326',
  overlay: 'rgba(4, 6, 18, 0.64)',
  nav: 'rgba(18, 22, 40, 0.94)',
  shadow: 'rgba(0, 0, 0, 0.35)',
};

export type Palette = typeof light;

export const gradient = {
  brand: ['#08185E', '#1C36B4', '#5B2BD4', '#D52C79'] as const,
  button: ['#2448DC', '#6A38E5', '#168BFF'] as const,
  hero: ['#102B9A', '#3233C9', '#7437DF'] as const,
  auth: ['#0B258D', '#4931CE', '#A531C5'] as const,
  mark: ['#7B91FF', '#334BFF', '#6036DF', '#F32E7A'] as const,
  green: ['#154832', '#1F6B4A', '#357F5E'] as const,
};

export const toneColor: Record<string, string> = {
  orange: '#EE6C28',
  blue: '#3078A3',
  red: '#D53637',
  indigo: '#4146A0',
  green: '#264BD6',
  purple: '#6B37DD',
};

export const radius = { sm: 12, md: 16, lg: 20, xl: 28, pill: 999 };
export const space = { xs: 6, sm: 10, md: 16, lg: 24, xl: 32 };
