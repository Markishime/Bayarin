import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { Session, User } from '@supabase/supabase-js';
import { i18n } from './src/i18n';
import { isSupabaseConfigured, supabase } from './src/lib/supabase';
import { registerForPushNotifications, scheduleAllDueReminders } from './src/services/push';
import { checkAndCreateDueDateReminders } from './src/services/notifications';
import { billServices, defaultOnboarding, governmentServices, langToStored, storedToLang, type BillService, type GovernmentService, type ServiceProvider } from './src/data';
import { fetchCurrentHousehold, type Household } from './src/services/households';
import { ScreenTransition } from './src/motion';
import { AppShell } from './src/shell';
import { dark as darkPalette, light as lightPalette } from './src/theme';
import { protectedScreens, type Lang, type OnboardingDraft, type Screen } from './src/types';
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
  const [userName, setUserName] = useState('Juan Dela Cruz');
  const [authEmail, setAuthEmail] = useState('');
  const [emailPurpose, setEmailPurpose] = useState<'signup' | 'recovery'>('signup');
  const [draft, setDraft] = useState<OnboardingDraft>(defaultOnboarding);
  const [household, setHousehold] = useState<Household | null>(null);
  const [governmentService, setGovernmentService] = useState<GovernmentService>(governmentServices[0]);
  const [billService, setBillService] = useState<BillService>(billServices.electricity);
  const [billProvider, setBillProvider] = useState<ServiceProvider>(billServices.electricity.providers[0]);

  const t = i18n[lang];
  const c = dark ? darkPalette : lightPalette;
  const go = (next: Screen) => setScreen(next);

  useEffect(() => {
    if (Platform.OS !== 'web' || typeof document === 'undefined') return;
    const html = document.documentElement;
    const body = document.body;
    const root = document.getElementById('root');
    html.style.height = '100%';
    html.style.overflow = 'hidden';
    body.style.height = '100%';
    body.style.margin = '0';
    body.style.overflow = 'hidden';
    if (root) {
      root.style.height = '100%';
      root.style.display = 'flex';
      root.style.flex = '1';
    }
  }, []);
  const userId = session?.user.id || '';

  useEffect(() => {
    if (!supabase) return;
    const client = supabase;
    let active = true;
    const hydrate = async (nextSession: Session | null, event?: string) => {
      if (!active) return;
      setSession(nextSession);
      if (!nextSession) {
        setHousehold(null);
        setProfileReady(false);
        setAuthReady(true);
        if (event === 'SIGNED_OUT') setScreen('welcome');
        return;
      }
      const fallbackName = String(nextSession.user.user_metadata?.full_name || nextSession.user.email?.split('@')[0] || 'Home organizer');
      setUserName(fallbackName);
      setAuthEmail(nextSession.user.email || '');
      const { data } = await client.from('profiles').select('full_name,onboarding_completed,preferred_language,appearance').eq('id', nextSession.user.id).maybeSingle();
      if (!active) return;
      if (data) {
        setUserName(data.full_name || fallbackName);
        setLang(storedToLang(data.preferred_language));
        setDark(data.appearance === 'dark');
      }
      const nextHousehold = await fetchCurrentHousehold(nextSession.user.id);
      if (!active) return;
      setHousehold(nextHousehold);
      setProfileReady(true);
      setAuthReady(true);
      if (event === 'PASSWORD_RECOVERY') { setScreen('reset-password'); return; }
      if (data?.onboarding_completed === false) setScreen('onboarding');
      else setScreen(nextHousehold ? 'home' : 'household-setup');
    };
    const { data: listener } = client.auth.onAuthStateChange((event, nextSession) => {
      void hydrate(nextSession, event);
    });
    void client.auth.getSession().then(({ data }) => hydrate(data.session, 'INITIAL_SESSION'));
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!supabase || !session || !profileReady) return;
    const client = supabase;
    const timer = setTimeout(() => {
      void client.from('profiles').update({
        preferred_language: langToStored(lang),
        appearance: dark ? 'dark' : 'light',
      }).eq('id', session.user.id);
    }, 250);
    return () => clearTimeout(timer);
  }, [dark, lang, profileReady, session]);

  useEffect(() => {
    if (!session || !profileReady) return;
    const id = session.user.id;
    void registerForPushNotifications(id);
    if (household?.id) void checkAndCreateDueDateReminders(id, household.id);
    if (household?.id) void scheduleAllDueReminders(household.id);
  }, [session, profileReady, household?.id]);

  const handleAuthenticated = async (user: User) => {
    if (!supabase) return;
    const { data } = await supabase.auth.getSession();
    setSession(data.session);
    setUserName(String(user.user_metadata?.full_name || user.email?.split('@')[0] || 'Home organizer'));
    setAuthEmail(user.email || '');
    const nextHousehold = await fetchCurrentHousehold(user.id);
    setHousehold(nextHousehold);
    setScreen(nextHousehold ? 'home' : 'household-setup');
  };
  const completeOnboarding = async () => {
    if (!supabase || !session) { setScreen('signup'); return; }
    await supabase.from('profiles').update({
      onboarding_completed: true,
      preferred_language: langToStored(lang),
      appearance: dark ? 'dark' : 'light',
    }).eq('id', session.user.id);
    const nextHousehold = await fetchCurrentHousehold(session.user.id);
    setHousehold(nextHousehold);
    setScreen(nextHousehold ? 'home' : 'household-setup');
  };
  const logout = async () => {
    if (supabase) await supabase.auth.signOut();
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
      case 'signup': return <SignupScreen {...common} setAuthEmail={setAuthEmail} setEmailPurpose={setEmailPurpose} onAuthenticated={handleAuthenticated} />;
      case 'forgot-password': return <ForgotPasswordScreen {...common} setAuthEmail={setAuthEmail} setEmailPurpose={setEmailPurpose} />;
      case 'check-email': return <CheckEmailScreen {...common} email={authEmail} purpose={emailPurpose} />;
      case 'reset-password': return <ResetPasswordScreen {...common} />;
      case 'household-setup': return <HouseholdSetupScreen {...common} onJoined={(next) => { setHousehold(next); go('home'); }} />;
      case 'home': return <HomeScreen {...common} lang={lang} userName={userName} userId={userId} householdId={household?.id || ''} householdName={household?.name || ''} onSelectService={(service) => { setBillService(service); setBillProvider(service.providers[0]); go('service-providers'); }} />;
      case 'bills': return <BillsScreen {...common} userId={userId} householdId={household?.id || ''} />;
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
      case 'notification-settings': return <NotificationSettingsScreen {...common} userId={userId} draft={draft} />;
      case 'export-data': return <ExportDataScreen {...common} userId={userId} householdId={household?.id || ''} />;
      case 'about': return <AboutScreen {...common} />;
      case 'edit-profile': return (
        <EditProfileScreen
          {...common}
          userId={userId}
          userName={userName}
          setUserName={setUserName}
        />
      );
      case 'offline': return <StateScreen kind="offline" {...common} />;
      case 'empty': return <StateScreen kind="empty" {...common} />;
      case 'error': return <StateScreen kind="error" {...common} />;
      default: return <WelcomeScreen {...common} />;
    }
  }, [visibleScreen, t, c, lang, dark, draft, userName, userId, session, authEmail, emailPurpose, household, governmentService, billService, billProvider]);

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
        <AppShell c={c} immersive={immersive}>
          <StatusBar style={dark ? 'light' : 'dark'} />
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
        </AppShell>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
