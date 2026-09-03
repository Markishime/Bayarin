import { StatusBar } from 'expo-status-bar';
import { useEffect, useMemo, useState } from 'react';
import { Platform, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import type { Session, User } from '@supabase/supabase-js';
import { i18n } from './src/i18n';
import { isSupabaseConfigured, supabase } from './src/lib/supabase';
import { DEMO_EMAIL, defaultOnboarding, langToStored, storedToLang } from './src/data';
import { ScreenTransition } from './src/motion';
import { AppShell } from './src/shell';
import { dark as darkPalette, light as lightPalette } from './src/theme';
import { protectedScreens, type Lang, type OnboardingDraft, type Screen } from './src/types';
import { WelcomeScreen } from './src/screens/Welcome';
import { OnboardingScreen } from './src/screens/Onboarding';
import { CheckEmailScreen, ForgotPasswordScreen, LoadingScreen, LoginScreen, ResetPasswordScreen, SignupScreen } from './src/screens/Auth';
import { HomeScreen } from './src/screens/Home';
import { BillDetail, BillForm, BillsScreen, MarkPaid, PaySheets, SuccessScreen } from './src/screens/Bills';
import { ActivityScreen, GovernmentDetail, LingkodScreen, LoadDetail, LoadScreen, NotificationsScreen, StateScreen, StoryScreen } from './src/screens/Lifestyle';
import {
  AboutScreen, AppearanceScreen, EditProfileScreen, ExportDataScreen, HouseholdScreen,
  LanguageScreen, NotificationSettingsScreen, PaymentMethodsScreen, PrivacyScreen, SettingsScreen,
} from './src/screens/Settings';

export default function App() {
  const [screen, setScreen] = useState<Screen>('welcome');
  const [dark, setDark] = useState(false);
  const [lang, setLang] = useState<Lang>('en');
  const [payOpen, setPayOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const [session, setSession] = useState<Session | null>(null);
  const [demoMode, setDemoMode] = useState(false);
  const [authReady, setAuthReady] = useState(!isSupabaseConfigured);
  const [profileReady, setProfileReady] = useState(false);
  const [userName, setUserName] = useState('Juan Dela Cruz');
  const [authEmail, setAuthEmail] = useState('');
  const [emailPurpose, setEmailPurpose] = useState<'signup' | 'recovery'>('signup');
  const [draft, setDraft] = useState<OnboardingDraft>(defaultOnboarding);
  const [householdName, setHouseholdName] = useState(defaultOnboarding.householdName);

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
  const userId = session?.user.id || (demoMode ? 'demo-user' : '');

  useEffect(() => {
    if (!supabase) return;
    let active = true;
    const hydrate = async (nextSession: Session | null, event?: string) => {
      if (!active) return;
      setSession(nextSession);
      if (!nextSession) {
        setProfileReady(false);
        setAuthReady(true);
        if (event === 'SIGNED_OUT') setScreen('welcome');
        return;
      }
      const fallbackName = String(nextSession.user.user_metadata?.full_name || nextSession.user.email?.split('@')[0] || 'Home organizer');
      setUserName(fallbackName);
      setAuthEmail(nextSession.user.email || '');
      const { data } = await supabase.from('profiles').select('full_name,onboarding_completed,preferred_language,appearance,household_name').eq('id', nextSession.user.id).maybeSingle();
      if (!active) return;
      if (data) {
        setUserName(data.full_name || fallbackName);
        setLang(storedToLang(data.preferred_language));
        setDark(data.appearance === 'dark');
        if (data.household_name) {
          setHouseholdName(data.household_name);
          setDraft((current) => ({ ...current, householdName: data.household_name }));
        }
      }
      setProfileReady(true);
      setAuthReady(true);
      if (event === 'PASSWORD_RECOVERY') { setScreen('reset-password'); return; }
      if (data?.onboarding_completed === false) setScreen('onboarding');
      else setScreen('home');
    };
    const { data: listener } = supabase.auth.onAuthStateChange((event, nextSession) => {
      void hydrate(nextSession, event);
    });
    void supabase.auth.getSession().then(({ data }) => hydrate(data.session, 'INITIAL_SESSION'));
    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (!supabase || !session || !profileReady) return;
    const timer = setTimeout(() => {
      void supabase.from('profiles').update({
        preferred_language: langToStored(lang),
        appearance: dark ? 'dark' : 'light',
        household_name: householdName,
      }).eq('id', session.user.id);
    }, 250);
    return () => clearTimeout(timer);
  }, [dark, lang, householdName, profileReady, session]);

  const handleAuthenticated = async (user: User) => {
    if (!supabase) return;
    const { data } = await supabase.auth.getSession();
    setSession(data.session);
    setUserName(String(user.user_metadata?.full_name || user.email?.split('@')[0] || 'Home organizer'));
    setAuthEmail(user.email || '');
    setScreen('home');
  };
  const handleDemoAuthenticated = () => {
    setDemoMode(true);
    setUserName('Juan Dela Cruz');
    setAuthEmail(DEMO_EMAIL);
    setProfileReady(true);
    setScreen('home');
  };
  const completeOnboarding = async () => {
    setHouseholdName(draft.householdName);
    if (demoMode) { setScreen('home'); return; }
    if (!supabase || !session) { setScreen('signup'); return; }
    await supabase.from('profiles').update({
      onboarding_completed: true,
      preferred_language: langToStored(lang),
      appearance: dark ? 'dark' : 'light',
      household_name: draft.householdName,
    }).eq('id', session.user.id);
    setScreen('home');
  };
  const logout = async () => {
    if (supabase && !demoMode) await supabase.auth.signOut();
    setDemoMode(false);
    setSession(null);
    setProfileReady(false);
    setScreen('welcome');
  };

  const visibleScreen = !session && !demoMode && protectedScreens.includes(screen) ? 'login' : screen;

  const content = useMemo(() => {
    const common = { go, t, c };
    switch (visibleScreen) {
      case 'welcome': return <WelcomeScreen {...common} />;
      case 'onboarding': return (
        <OnboardingScreen
          {...common}
          finish={session || demoMode ? completeOnboarding : undefined}
          lang={lang}
          setLang={setLang}
          dark={dark}
          setDark={setDark}
          draft={draft}
          setDraft={setDraft}
        />
      );
      case 'login': return <LoginScreen {...common} onAuthenticated={handleAuthenticated} onDemoAuthenticated={handleDemoAuthenticated} />;
      case 'signup': return <SignupScreen {...common} setAuthEmail={setAuthEmail} setEmailPurpose={setEmailPurpose} onAuthenticated={handleAuthenticated} />;
      case 'forgot-password': return <ForgotPasswordScreen {...common} setAuthEmail={setAuthEmail} setEmailPurpose={setEmailPurpose} />;
      case 'check-email': return <CheckEmailScreen {...common} email={authEmail} purpose={emailPurpose} />;
      case 'reset-password': return <ResetPasswordScreen {...common} />;
      case 'home': return <HomeScreen {...common} lang={lang} userName={userName} />;
      case 'bills': return <BillsScreen {...common} userId={userId} />;
      case 'bill-detail': return <BillDetail {...common} setPayOpen={setPayOpen} userId={userId} demo={demoMode} />;
      case 'add-bill': return <BillForm {...common} userId={userId} />;
      case 'edit-bill': return <BillForm {...common} userId={userId} edit />;
      case 'mark-paid': return <MarkPaid {...common} userId={userId} />;
      case 'success': return <SuccessScreen {...common} />;
      case 'activity': return <ActivityScreen {...common} />;
      case 'story': return <StoryScreen {...common} />;
      case 'load': return <LoadScreen {...common} />;
      case 'load-detail': return <LoadDetail {...common} />;
      case 'lingkod': return <LingkodScreen {...common} />;
      case 'government-detail': return <GovernmentDetail {...common} />;
      case 'notifications': return <NotificationsScreen {...common} />;
      case 'settings': return <SettingsScreen {...common} dark={dark} lang={lang} userName={userName} email={session?.user.email || authEmail} onLogout={() => void logout()} />;
      case 'language': return <LanguageScreen {...common} lang={lang} setLang={setLang} />;
      case 'appearance': return <AppearanceScreen {...common} dark={dark} setDark={setDark} />;
      case 'privacy': return <PrivacyScreen {...common} />;
      case 'household': return <HouseholdScreen {...common} userId={userId || 'demo-user'} demo={demoMode} />;
      case 'payment-methods': return <PaymentMethodsScreen {...common} />;
      case 'notification-settings': return <NotificationSettingsScreen {...common} userId={userId || 'demo-user'} demo={demoMode} draft={draft} />;
      case 'export-data': return <ExportDataScreen {...common} userId={userId || 'demo-user'} demo={demoMode} />;
      case 'about': return <AboutScreen {...common} />;
      case 'edit-profile': return (
        <EditProfileScreen
          {...common}
          userId={userId || 'demo-user'}
          demo={demoMode}
          userName={userName}
          setUserName={setUserName}
          householdName={householdName}
          setHouseholdName={setHouseholdName}
        />
      );
      case 'offline': return <StateScreen kind="offline" {...common} />;
      case 'empty': return <StateScreen kind="empty" {...common} />;
      case 'error': return <StateScreen kind="error" {...common} />;
      default: return <WelcomeScreen {...common} />;
    }
  }, [visibleScreen, t, c, lang, dark, draft, userName, userId, demoMode, session, authEmail, emailPurpose, householdName]);

  const fill = { flex: 1, width: '100%' as const, height: '100%' as const };
  const immersive = visibleScreen === 'welcome' || visibleScreen === 'story';

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
        <AppShell c={c}>
          <StatusBar style={dark || immersive ? 'light' : 'dark'} />
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
