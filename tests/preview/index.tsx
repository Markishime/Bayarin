// Isolated visual fixture. Never imported by the production entry point.
import { registerRootComponent } from 'expo';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { BillDataContext } from '../../src/services/bill-context';
import type { DbBill } from '../../src/services/household';
import { AppShell } from '../../src/shell';
import { ScreenTransition } from '../../src/motion';
import { light, dark } from '../../src/theme';
import { i18n } from '../../src/i18n';
import type { Screen } from '../../src/types';
import { billServices, defaultOnboarding } from '../../src/data';
import { localDateKey } from '../../src/services/bill-rules';
import { HomeScreen } from '../../src/screens/Home';
import { WelcomeScreen } from '../../src/screens/Welcome';
import { LoginScreen } from '../../src/screens/Auth';
import { OnboardingScreen } from '../../src/screens/Onboarding';
import { BillsScreen, BillDetail, BillForm, MarkPaid, SuccessScreen, PaySheets } from '../../src/screens/Bills';
import { CalendarScreen } from '../../src/screens/Calendar';
import { ActivityScreen, LoadScreen, LoadDetail, LingkodScreen } from '../../src/screens/Lifestyle';
import { SettingsScreen } from '../../src/screens/Settings';

const today = localDateKey();
const sample = (id: string, provider: string, category: string, amount: number, status = 'upcoming'): DbBill => ({ id, provider, category, amount, status, due_date: today, account_number: '123456789012', alias: 'Bahay', user_id: 'fixture', household_id: 'fixture', billing_period: 'Current month', recurrence: 'monthly', reminder_days: 3, paid_at: status === 'paid' ? new Date().toISOString() : null, paid_by: status === 'paid' ? 'Alex' : null, payment_method: status === 'paid' ? 'Cash' : null, reference_number: null, created_at: new Date().toISOString(), updated_at: new Date().toISOString() });
const bills = [sample('one','Meralco','Electricity',2450.36), sample('two','PLDT Home','Internet',1699), sample('three','Maynilad','Water',480,'paid'), sample('four','Smart','Mobile load',299)];
function Review() {
  const [screen, go] = useState<Screen>('home');
  const [selectedId, selectBill] = useState('one');
  const [isDark, setDark] = useState(false);
  const [draft, setDraft] = useState(defaultOnboarding);
  const [payOpen, setPayOpen] = useState(false);
  const [returnOpen, setReturnOpen] = useState(false);
  const c = isDark ? dark : light;
  const common = { c, t: i18n.en, go };
  const props = { ...common, userId: '', householdId: '' };
  const render = () => {
    switch (screen) {
      case 'welcome': return <WelcomeScreen {...common} />;
      case 'login': return <LoginScreen {...common} onAuthenticated={() => go('home')} />;
      case 'onboarding': return <OnboardingScreen {...common} lang="en" setLang={() => {}} dark={isDark} setDark={setDark} draft={draft} setDraft={setDraft} />;
      case 'activity': return <ActivityScreen {...props} />;
      case 'home': return <HomeScreen {...props} lang="en" userName="Juan Dela Cruz" householdName="Reyes household" onSelectService={() => go('add-bill')} />;
      case 'bills': return <BillsScreen {...props} />;
      case 'bill-detail': return <BillDetail {...props} setPayOpen={setPayOpen} />;
      case 'add-bill': case 'edit-bill': return <BillForm {...props} edit={screen === 'edit-bill'} service={billServices.electricity} provider={billServices.electricity.providers[0]} />;
      case 'mark-paid': return <MarkPaid {...props} />;
      case 'success': return <SuccessScreen {...common} />;
      case 'calendar': return <CalendarScreen {...props} />;
      case 'load': return <LoadScreen {...common} />;
      case 'load-detail': return <LoadDetail {...common} />;
      case 'lingkod': return <LingkodScreen {...props} onSelectGovernment={() => go('add-bill')} />;
      default: return <SettingsScreen {...common} dark={isDark} lang="en" userName="Juan Dela Cruz" email="fixture@example.invalid" onLogout={() => go('home')} />;
    }
  };
  return <GestureHandlerRootView style={{ flex: 1 }}><SafeAreaProvider><View style={{ flex: 1, minHeight: 0 }}><View style={{ backgroundColor: '#17243B', padding: 8, flexDirection: 'row', gap: 8, flexWrap: 'wrap', justifyContent: 'center' }}><Text style={{ color: '#fff', fontSize: 10 }}>SAMPLE DATA</Text>{(['welcome','home','bill-detail','success','activity'] as Screen[]).map(s => <Pressable key={s} accessibilityRole="button" onPress={() => go(s)}><Text style={{ color: '#fff', fontSize: 10 }}>{s}</Text></Pressable>)}<Pressable accessibilityRole="button" onPress={() => setReturnOpen(true)}><Text style={{ color: '#fff', fontSize: 10 }}>Payment return</Text></Pressable><Pressable accessibilityRole="button" onPress={() => setDark(!isDark)}><Text style={{ color: '#A9C3FF', fontSize: 12 }}>Toggle theme</Text></Pressable></View><AppShell c={c} screen={screen} go={go} signedIn userName="Juan Dela Cruz"><BillDataContext.Provider value={{ bills, selected: bills.find(b => b.id === selectedId) || null, selectBill, refresh: async () => {}, error: '', loading: false }}><ScreenTransition key={screen} id={screen}>{render()}</ScreenTransition><PaySheets {...common} payOpen={payOpen} setPayOpen={setPayOpen} returnOpen={returnOpen} setReturnOpen={setReturnOpen} /></BillDataContext.Provider></AppShell></View></SafeAreaProvider></GestureHandlerRootView>;
}
registerRootComponent(Review);
