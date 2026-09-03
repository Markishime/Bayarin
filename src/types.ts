export type Screen =
  | 'welcome'
  | 'onboarding'
  | 'home'
  | 'bills'
  | 'bill-detail'
  | 'add-bill'
  | 'edit-bill'
  | 'mark-paid'
  | 'success'
  | 'activity'
  | 'load'
  | 'load-detail'
  | 'lingkod'
  | 'government-detail'
  | 'notifications'
  | 'settings'
  | 'language'
  | 'appearance'
  | 'privacy'
  | 'offline'
  | 'empty'
  | 'error'
  | 'story'
  | 'household'
  | 'payment-methods'
  | 'notification-settings'
  | 'export-data'
  | 'about'
  | 'edit-profile'
  | 'login'
  | 'signup'
  | 'forgot-password'
  | 'check-email'
  | 'reset-password';

export type Lang = 'en' | 'tl' | 'ceb';

export type BillStatus = 'Due soon' | 'Upcoming' | 'Overdue' | 'Paid' | 'Draft';

export type Bill = {
  provider: string;
  category: string;
  account: string;
  due: string;
  amount: string;
  status: BillStatus | string;
  tone: string;
};

export type HouseholdMember = { id: string; name: string; role: string; contact?: string };

export type OnboardingDraft = {
  services: string[];
  dueSoon: boolean;
  weeklySummary: boolean;
  loadReminders: boolean;
  lingkodDeadlines: boolean;
  householdName: string;
};

export const protectedScreens: Screen[] = [
  'home', 'bills', 'bill-detail', 'add-bill', 'edit-bill', 'mark-paid', 'success',
  'activity', 'load', 'load-detail', 'lingkod', 'government-detail', 'notifications',
  'settings', 'language', 'appearance', 'privacy', 'offline', 'empty', 'error',
  'household', 'payment-methods', 'notification-settings', 'export-data', 'edit-profile',
];
