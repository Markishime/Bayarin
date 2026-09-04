export const light = {
  bg: '#EEF1F7',
  bgElevated: '#F6F8FC',
  surface: '#F8FAFE',
  surface2: '#E7EDF6',
  text: '#1B2540',
  textMuted: '#4A5874',
  textSoft: '#66758F',
  border: '#D0D8E8',
  primary: '#2E5FE0',
  primaryDeep: '#244CC0',
  primarySoft: '#E4ECFC',
  accent: '#6A4AD4',
  warning: '#A65A0C',
  warningSoft: '#F6E9D4',
  danger: '#C4334A',
  dangerSoft: '#F6E2E6',
  success: '#1B7A52',
  successSoft: '#D9EEE4',
  overlay: 'rgba(18, 28, 52, 0.48)',
  nav: '#F4F6FB',
  shadow: 'rgba(28, 48, 92, 0.10)',
  onPrimary: '#F5F8FF',
};

export const dark = {
  bg: '#12182A',
  bgElevated: '#171F34',
  surface: '#1C2540',
  surface2: '#263352',
  text: '#EEF2FA',
  textMuted: '#B8C4D9',
  textSoft: '#8E9CB4',
  border: '#33415C',
  primary: '#8BB0FF',
  primaryDeep: '#5B86F5',
  primarySoft: 'rgba(139, 176, 255, 0.16)',
  accent: '#C4A6FF',
  warning: '#E8B45A',
  warningSoft: 'rgba(232, 180, 90, 0.16)',
  danger: '#F08A98',
  dangerSoft: 'rgba(240, 138, 152, 0.16)',
  success: '#6ED6A8',
  successSoft: 'rgba(110, 214, 168, 0.14)',
  overlay: 'rgba(6, 10, 22, 0.64)',
  nav: '#171F34',
  shadow: 'rgba(0, 0, 0, 0.32)',
  onPrimary: '#F5F8FF',
};

export type Palette = typeof light;

export const gradient = {
  brand: ['#1E4BB8', '#2E5FE0', '#5B3ED4'] as const,
  button: ['#2A58D8', '#3D6AE8', '#5B45D4'] as const,
  hero: ['#244CC0', '#2E5FE0', '#5B3ED4'] as const,
  auth: ['#1E4BB8', '#2E5FE0', '#5B3ED4'] as const,
  mark: ['#8BB0FF', '#2E5FE0', '#5B3ED4'] as const,
  green: ['#154832', '#1F6B4A', '#357F5E'] as const,
};

export const toneColor: Record<string, string> = {
  orange: '#D96A24',
  blue: '#2F74A8',
  red: '#C43B3C',
  indigo: '#3F4AA8',
  green: '#2F5FE0',
  purple: '#6A4AD4',
  slate: '#5A6A84',
};

export const radius = { sm: 12, md: 16, lg: 20, xl: 28, pill: 999 };
export const space = { xs: 6, sm: 10, md: 16, lg: 24, xl: 32 };

export function fade(color: string, alpha: number) {
  if (color.startsWith('rgba')) {
    return color.replace(/rgba\((\d+),\s*(\d+),\s*(\d+),\s*[\d.]+\)/, `rgba($1,$2,$3,${alpha})`);
  }
  const hex = color.replace('#', '');
  if (hex.length !== 6) return color;
  const n = parseInt(hex, 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${alpha})`;
}
