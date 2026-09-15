import { BillDataProvider } from './src/services/bill-context';
import { NotificationNavigation } from './src/components/NotificationNavigation';
import { ReducedMotionConfig, ReduceMotion } from 'react-native-reanimated';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { AppState, Linking, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { Session, User } from '@supabase/supabase-js';
import { i18n } from './src/i18n';
import { isSupabaseConfigured, supabase } from './src/lib/supabase';
import { cancelAllLocalReminders } from './src/services/push';
import { billServices, defaultOnboarding, governmentServices, langToStored, storedToLang, type BillService, type GovernmentService, type ServiceProvider } from './src/data';
import { fetchCurrentHousehold, type Household } from './src/services/households';
import { ScreenTransition } from './src/motion';
import { AppShell } from './src/shell';
import { dark as darkPalette, light as lightPalette } from './src/theme';
import { protectedScreens, type BillFilter, type Lang, type OnboardingDraft, type Screen } from './src/types';
import { WelcomeScreen } from './src/screens/Welcome';
import { OnboardingScreen } from './src/screens/Onboarding';
import { CheckEmailScreen, ForgotPasswordScreen, LoadingScreen, LoginScreen, ResetPasswordScreen, SignupScreen } from './src/screens/Auth';
import { HomeScreen } from './src/screens/Home';
import { BillDetail, BillForm, BillsScreen, MarkPaid, PaySheets, SuccessScreen } from './src/screens/Bills';
import { CalendarScreen } from './src/screens/Calendar';
import { ServiceProvidersScreen } from './src/screens/ServiceProviders';
import { ActivityScreen, GovernmentDetail, LingkodScreen, LoadDetail, LoadScreen, NotificationsScreen, StateScreen } from './src/screens/Lifestyle';
import {
  AboutScreen, AppearanceScreen, EditProfileScreen, ExportDataScreen, HouseholdScreen, HouseholdSetupScreen,
  LanguageScreen, NotificationSettingsScreen, PaymentMethodsScreen, PrivacyScreen, SettingsScreen,
} from './src/screens/Settings';

export default function App() {
  const [screen, setScreen] = useState<Screen>('welcome');
  const [dark, setDark] = useState(false);
  const [lang, setLang] = useState<Lang>('en');
  const [payOpen, setPayOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);
  const [profileReady, setProfileReady] = useState(false);
  const [userName, setUserName] = useState('Home organizer');
  const [authError, setAuthError] = useState('');
  const [authEmail, setAuthEmail] = useState('');
  const [emailPurpose, setEmailPurpose] = useState<'signup' | 'recovery'>('signup');
  const [draft, setDraft] = useState<OnboardingDraft>(defaultOnboarding);
  const [household, setHousehold] = useState<Household | null>(null);
  const [governmentService, setGovernmentService] = useState<GovernmentService>(governmentServices[0]);
  const [billService, setBillService] = useState<BillService>(billServices.electricity);
  const [billProvider, setBillProvider] = useState<ServiceProvider>(billServices.electricity.providers[0]);
  const [billFilter, setBillFilter] = useState<BillFilter>('All');

  const t = i18n[lang];
  const c = dark ? darkPalette : lightPalette;
  const go = (next: Screen) => {
    if (next === 'bills') setBillFilter('All');
    if (next === 'add-bill' && screen === 'load') { setBillService(billServices.load); setBillProvider(billServices.load.providers[0]); }
    setScreen(next);
  };

  const userId = session?.user.id || '';

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    let active = true;
    let hydratedUser = '';
    let revision = 0;
    const hydrate = async (nextSession: Session | null, event?: string) => {
      if (!active) return;
      setSession(nextSession);
      if (nextSession && hydratedUser === nextSession.user.id && event !== 'PASSWORD_RECOVERY') return;
      const request = ++revision;
      if (!nextSession) {
        hydratedUser = '';
        setHousehold(null);
        setProfileReady(false);
        setAuthReady(true);
        if (event === 'SIGNED_OUT') setScreen('welcome');
        return;
      }
      const fallbackName = String(nextSession.user.user_metadata?.full_name || nextSession.user.email?.split('@')[0] || 'Home organizer');
      setUserName(fallbackName);
      setAuthEmail(nextSession.user.email || '');
      const { data, error } = await client.from('profiles').select('*').eq('id', nextSession.user.id).maybeSingle();
      if (!active) return;
      if (error) throw new Error(error.message);
      if (request !== revision) return;
      if (data) {
        setUserName(data.full_name || fallbackName);
        setLang(storedToLang(data.preferred_language));
        setDark(data.appearance === 'dark');
        if (data.selected_services) setDraft(current => ({ ...current, services: data.selected_services }));
      }
      const nextHousehold = await fetchCurrentHousehold(nextSession.user.id);
      if (!active) return;
      if (request !== revision) return;
      hydratedUser = nextSession.user.id;
      setAuthError('');
      setHousehold(nextHousehold);
      setProfileReady(true);
      setAuthReady(true);
      if (event === 'PASSWORD_RECOVERY') { setScreen('reset-password'); return; }
      if (data?.onboarding_completed === false) setScreen('onboarding');
      else setScreen(nextHousehold ? 'home' : 'household-setup');
    };
    const fail = (reason: unknown) => { if (active) { setAuthError(reason instanceof Error ? reason.message : 'Could not load your account.'); setAuthReady(true); } };
    const { data: listener } = client.auth.onAuthStateChange((event, nextSession) => {
      setTimeout(() => { if (active) void hydrate(nextSession, event).catch(fail); }, 0);
    });
    void client.auth.getSession().then(({ data }) => hydrate(data.session, 'INITIAL_SESSION')).catch(fail);
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  // Refresh membership after returning from another device or an admin change.
  useEffect(() => {
    if (!supabase || !userId || !profileReady) return;
    let active = true;
    const refreshMembership = async () => {
      try {
        const next = await fetchCurrentHousehold(userId);
        if (!active) return;
        if (household?.id !== next?.id || household?.role !== next?.role || household?.name !== next?.name) {
          if (household?.id !== next?.id) await cancelAllLocalReminders();
          if (!active) return;
          setHousehold(next);
          setScreen(next ? 'home' : 'household-setup');
        }
      } catch (reason) { if (active) setAuthError(reason instanceof Error ? reason.message : 'Could not refresh your household.'); }
    };
    const listener = AppState.addEventListener('change', state => { if (state === 'active') void refreshMembership(); });
    const client = supabase;
    const channel = client.channel(`profile-membership-${userId}`).on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'profiles', filter: `id=eq.${userId}` }, () => void refreshMembership()).subscribe();
    return () => { active = false; listener.remove(); void client.removeChannel(channel); };
  }, [userId, profileReady, household]);

  useEffect(() => {
    if (!supabase || !session || !profileReady) return;
    const client = supabase;
    const timer = setTimeout(() => {
      void client.from('profiles').update({
        preferred_language: langToStored(lang),
        appearance: dark ? 'dark' : 'light',
      }).eq('id', session.user.id).then(({ error }) => { if (error) setAuthError('Could not save your appearance or language. Please try again.'); });
    }, 250);
    return () => clearTimeout(timer);
  }, [dark, lang, profileReady, session]);

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    const receive = async (url: string) => {
      if (!url.startsWith('bayarin://auth')) return;
      const parsed = new URL(url);
      const code = parsed.searchParams.get('code');
      if (code) { const { error } = await client.auth.exchangeCodeForSession(code); if (error) setAuthError(error.message); }
    };
    const link = Linking.addEventListener('url', ({ url }) => { void receive(url).catch(e => setAuthError(e.message)); });
    void Linking.getInitialURL().then(url => { if (url) return receive(url); }).catch(e => setAuthError(e.message));
    const app = AppState.addEventListener('change', state => { if (state === 'active') client.auth.startAutoRefresh(); else client.auth.stopAutoRefresh(); });
    return () => { link.remove(); app.remove(); };
  }, []);

  const handleAuthenticated = (_user: User) => {
    // The auth subscription owns profile hydration and navigation.
  };
  const completeOnboarding = async () => {
    if (!supabase || !session) { setScreen('signup'); return; }
    const { error } = await supabase.from('profiles').update({
      onboarding_completed: true,
      selected_services: draft.services,
      preferred_language: langToStored(lang),
      appearance: dark ? 'dark' : 'light',
    }).eq('id', session.user.id);
    if (error) { setAuthError(error.message); return; }
    const { error: prefError } = await supabase.from('notification_preferences').upsert({ user_id: session.user.id, due_soon: draft.dueSoon, weekly_summary: draft.weeklySummary, load_reminders: draft.loadReminders, government_deadlines: draft.lingkodDeadlines });
    if (prefError) { setAuthError(prefError.message); return; }
    const nextHousehold = await fetchCurrentHousehold(session.user.id);
    setHousehold(nextHousehold);
    setScreen(nextHousehold ? 'home' : 'household-setup');
  };
  const logout = async () => {
    if (supabase) { const { error } = await supabase.auth.signOut(); if (error) { setAuthError(error.message); return; } }
    await cancelAllLocalReminders().catch(() => {});
    setSession(null);
    setProfileReady(false);
    setScreen('welcome');
  };

  const visibleScreen = !session && protectedScreens.includes(screen)
    ? 'login'
    : session && profileReady && !household && protectedScreens.includes(screen) && screen !== 'household-setup'
      ? 'household-setup'
      : screen;

  const content = useMemo(() => {
    const common = { go, t, c };
    switch (visibleScreen) {
      case 'welcome': return <WelcomeScreen {...common} />;
      case 'onboarding': return (
        <OnboardingScreen
          {...common}
          finish={session ? completeOnboarding : undefined}
          lang={lang}
          setLang={setLang}
          dark={dark}
          setDark={setDark}
          draft={draft}
          setDraft={setDraft}
        />
      );
      case 'login': return <LoginScreen {...common} onAuthenticated={handleAuthenticated} />;
      case 'signup': return <SignupScreen {...common} preferences={{ ...draft, preferred_language: langToStored(lang), appearance: dark ? 'dark' : 'light' }} setAuthEmail={setAuthEmail} setEmailPurpose={setEmailPurpose} onAuthenticated={handleAuthenticated} />;
      case 'forgot-password': return <ForgotPasswordScreen {...common} setAuthEmail={setAuthEmail} setEmailPurpose={setEmailPurpose} />;
      case 'check-email': return <CheckEmailScreen {...common} email={authEmail} purpose={emailPurpose} />;
      case 'reset-password': return <ResetPasswordScreen {...common} />;
      case 'household-setup': return <HouseholdSetupScreen {...common} onJoined={(next) => { setHousehold(next); go('home'); }} />;
      case 'home': return <HomeScreen {...common} onViewBills={filter => { setBillFilter(filter); setScreen('bills'); }} onSelectProvider={(service, provider) => { setBillService(service); setBillProvider(provider); go('add-bill'); }} preferredServices={draft.services} lang={lang} userName={userName} userId={userId} householdId={household?.id || ''} householdName={household?.name || ''} onSelectService={(service) => { setBillService(service); setBillProvider(service.providers[0]); go('service-providers'); }} />;
      case 'bills': return <BillsScreen {...common} initialFilter={billFilter} userId={userId} householdId={household?.id || ''} />;
      case 'bill-detail': return <BillDetail {...common} setPayOpen={setPayOpen} userId={userId} householdId={household?.id || ''} />;
      case 'add-bill': return <BillForm {...common} userId={userId} householdId={household?.id || ''} service={billService} provider={billProvider} />;
      case 'edit-bill': return <BillForm {...common} userId={userId} householdId={household?.id || ''} service={billService} provider={billProvider} edit />;
      case 'mark-paid': return <MarkPaid {...common} userId={userId} householdId={household?.id || ''} />;
      case 'success': return <SuccessScreen {...common} />;
      case 'activity': return <ActivityScreen {...common} householdId={household?.id || ''} />;
      case 'load': return <LoadScreen {...common} />;
      case 'load-detail': return <LoadDetail {...common} />;
      case 'lingkod': return <LingkodScreen {...common} householdId={household?.id || ''} onSelectGovernment={(service) => { setGovernmentService(service); go('government-detail'); }} />;
      case 'government-detail': return <GovernmentDetail {...common} userId={userId} householdId={household?.id || ''} government={governmentService} />;
      case 'service-providers': return <ServiceProvidersScreen {...common} service={billService} onSelectProvider={setBillProvider} />;
      case 'calendar': return <CalendarScreen {...common} householdId={household?.id || ''} />;
      case 'notifications': return <NotificationsScreen {...common} userId={userId} />;
      case 'settings': return <SettingsScreen {...common} dark={dark} lang={lang} userName={userName} email={session?.user.email || authEmail} onLogout={() => void logout()} />;
      case 'language': return <LanguageScreen {...common} lang={lang} setLang={setLang} />;
      case 'appearance': return <AppearanceScreen {...common} dark={dark} setDark={setDark} />;
      case 'privacy': return <PrivacyScreen {...common} />;
      case 'household': return <HouseholdScreen {...common} userId={userId} household={household} />;
      case 'payment-methods': return <PaymentMethodsScreen {...common} />;
      case 'notification-settings': return <NotificationSettingsScreen {...common} userId={userId} draft={draft} householdId={household?.id || ''} />;
      case 'export-data': return <ExportDataScreen {...common} userId={userId} householdId={household?.id || ''} />;
      case 'about': return <AboutScreen {...common} />;
      case 'edit-profile': return (
        <EditProfileScreen
          {...common}
          userId={userId}
          userName={userName}
          email={session?.user.email || ''}
          setUserName={setUserName}
        />
      );
      case 'offline': return <StateScreen kind="offline" {...common} />;
      case 'empty': return <StateScreen kind="empty" {...common} />;
      case 'error': return <StateScreen kind="error" {...common} />;
      default: return <WelcomeScreen {...common} />;
    }
  }, [visibleScreen, t, c, lang, dark, draft, userName, userId, session, authEmail, emailPurpose, household, governmentService, billService, billProvider, billFilter]);

  const fill = { flex: 1, width: '100%' as const, height: '100%' as const };
  const immersive = visibleScreen === 'welcome';

  if (!authReady) {
    return (
      <GestureHandlerRootView style={fill}>
        <SafeAreaProvider>
          <View style={fill}>
            <LoadingScreen t={t} />
          </View>
        </SafeAreaProvider>
      </GestureHandlerRootView>
    );
  }

  return (
    <GestureHandlerRootView style={fill}>
      <SafeAreaProvider>
        <AppShell c={c} immersive={immersive} screen={visibleScreen} go={go} userName={userName} signedIn={!!session && !!household}>
          <ReducedMotionConfig mode={ReduceMotion.System} />
          {authError ? <View style={{ padding: 16, backgroundColor: c.dangerSoft }}><Text accessibilityRole="alert" style={{ color: c.danger }}>{authError}</Text><Text onPress={() => void logout()} style={{ color: c.primary, marginTop: 8 }}>Return to sign in</Text></View> : null}
          <BillDataProvider key={userId + household?.id} householdId={household?.id || ''} userId={userId} c={c}>
          <StatusBar style={dark || immersive ? 'light' : 'dark'} />
          <NotificationNavigation householdId={household?.id || ''} go={go} />
          <View style={{ flex: 1, minHeight: 0 }}>
            <ScreenTransition key={visibleScreen} id={visibleScreen}>
              {content}
            </ScreenTransition>
            <PaySheets
              payOpen={payOpen}
              setPayOpen={setPayOpen}
              returnOpen={returnOpen}
              setReturnOpen={setReturnOpen}
              go={go}
              t={t}
              c={c}
            />
          </View>
        </BillDataProvider>
        </AppShell>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
