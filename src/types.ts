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
  | 'service-providers'
  | 'calendar'
  | 'notifications'
  | 'settings'
  | 'language'
  | 'appearance'
  | 'privacy'
  | 'offline'
  | 'empty'
  | 'error'
  | 'household'
  | 'household-setup'
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

export type HouseholdMember = { id: string; name: string; role: string; contact?: string };

export type AppNotification = {
  id: string;
  user_id: string;
  title: string;
  body: string;
  type: string;
  bill_id: string | null;
  read: boolean;
  metadata: Record<string, unknown>;
  created_at: string;
};

export type OnboardingDraft = {
  services: string[];
  dueSoon: boolean;
  weeklySummary: boolean;
  loadReminders: boolean;
  lingkodDeadlines: boolean;
};

export const protectedScreens: Screen[] = [
  'home', 'bills', 'bill-detail', 'add-bill', 'edit-bill', 'mark-paid', 'success',
  'activity', 'load', 'load-detail', 'lingkod', 'government-detail', 'service-providers', 'calendar', 'notifications',
  'settings', 'language', 'appearance', 'privacy', 'offline', 'empty', 'error',
  'household', 'household-setup', 'payment-methods', 'notification-settings', 'export-data', 'edit-profile',
];
