import type { Bill, HouseholdMember } from './types';

export const DEMO_EMAIL = 'demo@bayarin.app';
export const DEMO_PASSWORD = 'Bayarin2026!';

export const images = {
  story: require('../assets/bayarin-story-3d.png'),
  onboarding: require('../assets/bayarin-onboarding-3d.png'),
  auth: require('../assets/bayarin-auth-3d.png'),
};

export const storyVideo = require('../assets/bayarin-story.mp4');

export const providers = [
  { name: 'Meralco', mark: 'M', tone: 'orange' },
  { name: 'Maynilad', mark: 'W', tone: 'blue' },
  { name: 'PLDT', mark: 'P', tone: 'red' },
  { name: 'Globe', mark: 'G', tone: 'indigo' },
];

export const serviceIds = [
  'electricity',
  'water',
  'internet',
  'cable',
  'load',
  'government',
  'insurance',
  'other',
] as const;

export const bills: Bill[] = [
  { provider: 'MERALCO', category: 'Electricity', account: '9012', due: 'Sep 8, 2026', amount: '₱2,450.36', status: 'Due soon', tone: 'orange' },
  { provider: 'MAYNILAD', category: 'Water', account: '3381', due: 'Sep 12, 2026', amount: '₱598.00', status: 'Upcoming', tone: 'blue' },
  { provider: 'GLOBE', category: 'Internet', account: '7740', due: 'Sep 16, 2026', amount: '₱599.00', status: 'Upcoming', tone: 'indigo' },
  { provider: 'PLDT', category: 'Internet', account: '2710', due: 'Aug 31, 2026', amount: '₱1,699.00', status: 'Overdue', tone: 'red' },
];

export const demoMembers: HouseholdMember[] = [
  { id: 'demo-1', name: 'Juan Dela Cruz', role: 'Organizer', contact: 'You' },
  { id: 'demo-2', name: 'Maria Dela Cruz', role: 'Household member', contact: 'maria@email.com' },
];

export const loads = [
  { mark: 'S', tone: 'green', name: 'SMART', number: '0919 ••• 4821', date: 'Sep 7', amount: '₱299' },
  { mark: 'G', tone: 'indigo', name: 'GLOBE', number: '0917 ••• 2068', date: 'Sep 15', amount: '₱99' },
  { mark: 'D', tone: 'red', name: 'DITO', number: '0991 ••• 1830', date: 'Sep 20', amount: '₱199' },
];

export const governmentItems = [
  { mark: 'S', name: 'SSS Contribution', due: 'Sep 10', amount: '₱1,400', status: 'Upcoming' },
  { mark: 'P', name: 'PhilHealth', due: 'Sep 18', amount: '₱500', status: 'Upcoming' },
  { mark: 'L', name: 'LTO Registration', due: 'Oct 4', amount: '₱2,100', status: 'Draft' },
];

export const defaultOnboarding = {
  services: ['electricity', 'water', 'internet', 'load'],
  dueSoon: true,
  weeklySummary: true,
  loadReminders: true,
  lingkodDeadlines: true,
  householdName: 'Dela Cruz Household',
};

export function langToStored(lang: 'en' | 'tl' | 'ceb') {
  return lang === 'tl' ? 'Tagalog' : lang === 'ceb' ? 'Cebuano' : 'English';
}

export function storedToLang(value: string | null | undefined): 'en' | 'tl' | 'ceb' {
  if (value === 'Tagalog' || value === 'Filipino') return 'tl';
  if (value === 'Cebuano') return 'ceb';
  return 'en';
}
