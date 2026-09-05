export const light = {
  bg: '#F5F6FE',
  bgElevated: '#FCFCFF',
  surface: '#FFFFFF',
  surface2: '#EEEDFB',
  text: '#0B1034',
  textMuted: '#343B76',
  textSoft: '#777DA1',
  border: '#E9EAF8',
  primary: '#163DFF',
  primaryDeep: '#1811C9',
  primarySoft: '#EEEDFF',
  accent: '#743BFF',
  warning: '#C55B00',
  warningSoft: '#FFF0D8',
  danger: '#C4334A',
  dangerSoft: '#F6E2E6',
  success: '#1B7A52',
  successSoft: '#E0F8E4',
  overlay: 'rgba(18, 28, 52, 0.48)',
  nav: '#FFFFFF',
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
  brand: ['#003DFF', '#1713C5', '#6330F5'] as const,
  button: ['#B662FF', '#662CFF', '#0637FF'] as const,
  hero: ['#003DFF', '#1610B6', '#6123EF'] as const,
  auth: ['#0640FF', '#2220C8', '#6732EF'] as const,
  mark: ['#8BB0FF', '#163DFF', '#5B3ED4'] as const,
  green: ['#154832', '#1F6B4A', '#357F5E'] as const,
};

export const toneColor: Record<string, string> = {
  orange: '#D96A24',
  blue: '#2F74A8',
  red: '#C43B3C',
  indigo: '#3F4AA8',
  green: '#2F5FE0',
  purple: '#743BFF',
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
