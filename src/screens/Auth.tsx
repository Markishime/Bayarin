import { LinearGradient } from 'expo-linear-gradient';
import {
  AlertTriangle, ArrowLeft, Check, ChevronRight, Eye, EyeOff, Info, KeyRound, LockKeyhole,
  Mail, Sparkles, UserPlus, UserRound,
} from 'lucide-react-native';
import { useState, type ComponentProps, type ReactNode } from 'react';
import {
  ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BrandLogo, BrandMark, PrimaryButton, SecondaryButton } from '../components/ui';
import { DEMO_EMAIL, DEMO_PASSWORD, images, isDemoConfigured } from '../data';
import type { Copy } from '../i18n';
import { isSupabaseConfigured, readableAuthError, supabase, supabaseSetupMessage } from '../lib/supabase';
import { gradient, type Palette } from '../theme';
import type { Screen } from '../types';
import type { User } from '@supabase/supabase-js';

function AuthShell({
  title, subtitle, go, t, c, children,
}: { title: string; subtitle: string; go: (s: Screen) => void; t: Copy; c: Palette; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ paddingBottom: insets.bottom + 28 }} keyboardShouldPersistTaps="handled">
      <View style={[styles.authHeader, { paddingTop: insets.top + 6 }]}>
        <Pressable onPress={() => go('welcome')} style={[styles.back, { backgroundColor: c.surface }]} accessibilityLabel="Back">
          <ArrowLeft size={18} color={c.text} />
        </Pressable>
        <BrandLogo compact />
        <View style={{ width: 40 }} />
      </View>
      <LinearGradient colors={[...gradient.auth]} style={styles.hero}>
        <Image source={images.auth} style={styles.heroImg} />
        <View style={styles.heroCopy}>
          <Text style={styles.kicker}>{t.auth.kicker}</Text>
          <Text style={styles.heroTitle}>{title}</Text>
          <Text style={styles.heroSub}>{subtitle}</Text>
        </View>
      </LinearGradient>
      {!isSupabaseConfigured && (
        <View style={[styles.banner, { backgroundColor: c.primarySoft, marginHorizontal: 24 }]}>
          <Info size={15} color={c.primary} />
          <View style={{ flex: 1 }}>
            <Text style={{ color: c.primary, fontWeight: '800', fontSize: 12 }}>{t.auth.demoMode}</Text>
            <Text style={{ color: c.primary, fontSize: 11 }}>{t.auth.demoHint}</Text>
          </View>
        </View>
      )}
      {children}
      <View style={styles.trust}>
        <LockKeyhole size={12} color={c.primary} />
        <Text style={{ color: c.textMuted, fontSize: 11, textAlign: 'center', flex: 1 }}>{t.auth.trust}</Text>
      </View>
    </ScrollView>
  );
}

function PasswordField({
  label, value, onChange, c, autoComplete = 'password',
}: { label: string; value: string; onChange: (v: string) => void; c: Palette; autoComplete?: ComponentProps<typeof TextInput>['autoComplete'] }) {
  const [visible, setVisible] = useState(false);
  return (
    <View style={{ gap: 6 }}>
      <Text style={[styles.label, { color: c.text }]}>{label}</Text>
      <View style={[styles.field, { borderColor: c.border, backgroundColor: c.bg }]}>
        <LockKeyhole size={17} color={c.textMuted} />
        <TextInput
          value={value}
          onChangeText={onChange}
          secureTextEntry={!visible}
          autoComplete={autoComplete}
          style={[styles.input, { color: c.text }]}
        />
        <Pressable onPress={() => setVisible((v) => !v)} accessibilityLabel={visible ? 'Hide password' : 'Show password'}>
          {visible ? <EyeOff size={16} color={c.textMuted} /> : <Eye size={16} color={c.textMuted} />}
        </Pressable>
      </View>
    </View>
  );
}

export function LoginScreen({
  go, t, c, onAuthenticated, onDemoAuthenticated,
}: {
  go: (s: Screen) => void; t: Copy; c: Palette;
  onAuthenticated: (user: User) => void; onDemoAuthenticated: () => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError('');
    if (isDemoConfigured && email.trim().toLowerCase() === DEMO_EMAIL.toLowerCase() && password === DEMO_PASSWORD) {
      onDemoAuthenticated();
      return;
    }
    if (!supabase) {
      setError('Connect Supabase for real accounts, or use the demo household login.');
      return;
    }
    setLoading(true);
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (authError) { setError(readableAuthError(authError)); return; }
    if (data.user) onAuthenticated(data.user);
  };

  return (
    <AuthShell title={t.auth.loginTitle} subtitle={t.auth.loginSubtitle} go={go} t={t} c={c}>
      <View style={[styles.form, { backgroundColor: c.surface, borderColor: c.border }]}>
        {error ? <View style={[styles.error, { backgroundColor: c.dangerSoft }]}><AlertTriangle size={14} color={c.danger} /><Text style={{ color: c.danger, flex: 1, fontSize: 12 }}>{error}</Text></View> : null}
        {isDemoConfigured && (
          <Pressable onPress={() => { setEmail(DEMO_EMAIL); setPassword(DEMO_PASSWORD); setError(''); }} style={styles.demo}>
            <View>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Sparkles size={14} color="#1F349C" />
                <Text style={{ fontWeight: '800', color: '#1F349C' }}>{t.auth.demoTitle}</Text>
              </View>
              <Text style={{ fontSize: 11, color: '#1F349C', opacity: 0.7 }}>{t.auth.demoHint}</Text>
            </View>
            <Text style={{ fontSize: 11, fontWeight: '800', color: '#1F349C' }}>{t.auth.demoFill}</Text>
          </Pressable>
        )}
        <Field label={t.auth.email} value={email} onChange={setEmail} c={c} icon={<Mail size={17} color={c.textMuted} />} autoComplete="email" keyboardType="email-address" />
        <PasswordField label={t.auth.password} value={password} onChange={setPassword} c={c} />
        <Pressable onPress={() => go('forgot-password')} style={{ alignSelf: 'flex-end' }}>
          <Text style={{ color: c.primary, fontSize: 13, fontWeight: '700' }}>{t.auth.forgot}</Text>
        </Pressable>
        <PrimaryButton title={loading ? t.auth.loggingIn : t.auth.logIn} loading={loading} onPress={() => void submit()} c={c} icon={<ChevronRight size={18} color="#fff" />} />
        <Text style={{ textAlign: 'center', color: c.textMuted, fontSize: 12 }}>{t.auth.newTo}</Text>
        <SecondaryButton title={t.auth.create} onPress={() => go('signup')} c={c} icon={<UserPlus size={16} color={c.text} />} />
      </View>
    </AuthShell>
  );
}

export function SignupScreen({
  go, t, c, setAuthEmail, setEmailPurpose, onAuthenticated,
}: {
  go: (s: Screen) => void; t: Copy; c: Palette;
  setAuthEmail: (email: string) => void;
  setEmailPurpose: (purpose: 'signup' | 'recovery') => void;
  onAuthenticated: (user: User) => void;
}) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    setError('');
    if (password !== confirm) { setError(t.auth.mismatch); return; }
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) { setError(t.auth.weak); return; }
    if (!accepted) { setError(t.auth.accept); return; }
    if (!supabase) { setError(supabaseSetupMessage); return; }
    setLoading(true);
    const { data, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: name.trim(), onboarding_completed: true } },
    });
    setLoading(false);
    if (authError) { setError(readableAuthError(authError)); return; }
    setAuthEmail(email.trim());
    setEmailPurpose('signup');
    if (data.session && data.user) onAuthenticated(data.user);
    else go('check-email');
  };

  return (
    <AuthShell title={t.auth.signupTitle} subtitle={t.auth.signupSubtitle} go={go} t={t} c={c}>
      <View style={[styles.form, { backgroundColor: c.surface, borderColor: c.border }]}>
        {error ? <View style={[styles.error, { backgroundColor: c.dangerSoft }]}><AlertTriangle size={14} color={c.danger} /><Text style={{ color: c.danger, flex: 1, fontSize: 12 }}>{error}</Text></View> : null}
        <Field label={t.auth.fullName} value={name} onChange={setName} c={c} icon={<UserRound size={17} color={c.textMuted} />} autoComplete="name" />
        <Field label={t.auth.email} value={email} onChange={setEmail} c={c} icon={<Mail size={17} color={c.textMuted} />} autoComplete="email" keyboardType="email-address" />
        <PasswordField label={t.auth.password} value={password} onChange={setPassword} c={c} autoComplete="new-password" />
        <PasswordField label={t.auth.confirm} value={confirm} onChange={setConfirm} c={c} autoComplete="new-password" />
        <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
          <Text style={{ color: password.length >= 8 ? c.success : c.textMuted, fontSize: 11 }}>{t.auth.rule8}</Text>
          <Text style={{ color: /[A-Za-z]/.test(password) && /\d/.test(password) ? c.success : c.textMuted, fontSize: 11 }}>{t.auth.ruleMix}</Text>
        </View>
        <Pressable onPress={() => setAccepted((v) => !v)} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
          <View style={[styles.check, { borderColor: accepted ? c.primary : c.border, backgroundColor: accepted ? c.primary : 'transparent' }]}>
            {accepted && <Check size={12} color="#fff" />}
          </View>
          <Text style={{ color: c.textMuted, fontSize: 12, flex: 1, lineHeight: 18 }}>
            {t.auth.terms} <Text style={{ color: c.primary, fontWeight: '800' }}>{t.auth.termsLink}</Text> {t.auth.and} <Text style={{ color: c.primary, fontWeight: '800' }}>{t.auth.privacyLink}</Text>.
          </Text>
        </Pressable>
        <PrimaryButton title={loading ? t.auth.creating : t.auth.create} loading={loading} onPress={() => void submit()} c={c} />
        <Pressable onPress={() => go('login')}>
          <Text style={{ textAlign: 'center', color: c.textMuted, fontSize: 13 }}>
            {t.auth.already} <Text style={{ color: c.primary, fontWeight: '800' }}>{t.auth.logIn}</Text>
          </Text>
        </Pressable>
      </View>
    </AuthShell>
  );
}

export function ForgotPasswordScreen({
  go, t, c, setAuthEmail, setEmailPurpose,
}: {
  go: (s: Screen) => void; t: Copy; c: Palette;
  setAuthEmail: (email: string) => void;
  setEmailPurpose: (purpose: 'signup' | 'recovery') => void;
}) {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const submit = async () => {
    setError('');
    if (!supabase) { setError(supabaseSetupMessage); return; }
    setLoading(true);
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email.trim());
    setLoading(false);
    if (authError) { setError(readableAuthError(authError)); return; }
    setAuthEmail(email.trim());
    setEmailPurpose('recovery');
    go('check-email');
  };
  return (
    <AuthShell title={t.auth.forgotTitle} subtitle={t.auth.forgotSubtitle} go={go} t={t} c={c}>
      <View style={[styles.form, { backgroundColor: c.surface, borderColor: c.border }]}>
        {error ? <View style={[styles.error, { backgroundColor: c.dangerSoft }]}><AlertTriangle size={14} color={c.danger} /><Text style={{ color: c.danger, flex: 1, fontSize: 12 }}>{error}</Text></View> : null}
        <Field label={t.auth.email} value={email} onChange={setEmail} c={c} icon={<Mail size={17} color={c.textMuted} />} autoComplete="email" keyboardType="email-address" />
        <PrimaryButton title={loading ? t.auth.sending : t.auth.sendLink} loading={loading} onPress={() => void submit()} c={c} icon={<Mail size={16} color="#fff" />} />
        <Pressable onPress={() => go('login')} style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
          <ArrowLeft size={13} color={c.textMuted} />
          <Text style={{ color: c.textMuted, fontSize: 13 }}>{t.auth.backLogin}</Text>
        </Pressable>
      </View>
    </AuthShell>
  );
}

export function CheckEmailScreen({ go, t, c, email, purpose }: { go: (s: Screen) => void; t: Copy; c: Palette; email: string; purpose: 'signup' | 'recovery' }) {
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const resend = async () => {
    if (!supabase || !email) return;
    setLoading(true);
    setMessage('');
    const { error } = purpose === 'signup'
      ? await supabase.auth.resend({ type: 'signup', email })
      : await supabase.auth.resetPasswordForEmail(email);
    setLoading(false);
    setMessage(error ? readableAuthError(error) : 'A new email is on its way.');
  };
  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top, paddingHorizontal: 24 }}>
      <View style={{ alignItems: 'center', marginTop: 12 }}><BrandLogo compact /></View>
      <View style={styles.mailArt}>
        <Image source={images.auth} style={{ width: 160, height: 160 }} />
        <View style={styles.mailBadge}><Check size={16} color="#fff" /></View>
      </View>
      <Text style={[styles.kicker, { color: c.primary, textAlign: 'center' }]}>{t.auth.checkKicker}</Text>
      <Text style={[styles.heroTitle, { color: c.text, textAlign: 'center', marginTop: 8 }]}>{t.auth.emailSent}</Text>
      <Text style={{ color: c.textMuted, textAlign: 'center', marginTop: 8, lineHeight: 20 }}>
        {t.auth.emailBody} <Text style={{ color: c.text, fontWeight: '800' }}>{email || 'your email address'}</Text>.
      </Text>
      <View style={[styles.banner, { backgroundColor: c.surface2, marginTop: 18 }]}>
        <Info size={14} color={c.textMuted} />
        <Text style={{ color: c.textMuted, flex: 1, fontSize: 12 }}>{message || t.auth.emailHelp}</Text>
      </View>
      <View style={{ marginTop: 18 }}>
        <PrimaryButton title={t.auth.backLogin} onPress={() => go('login')} c={c} />
      </View>
      <Pressable onPress={() => void resend()} disabled={loading} style={{ marginTop: 14 }}>
        <Text style={{ textAlign: 'center', color: c.primary, fontWeight: '700' }}>{loading ? t.auth.sending : t.auth.resend}</Text>
      </Pressable>
    </View>
  );
}

export function ResetPasswordScreen({ go, t, c }: { go: (s: Screen) => void; t: Copy; c: Palette }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const insets = useSafeAreaInsets();
  const submit = async () => {
    setError('');
    if (password !== confirm) { setError(t.auth.mismatch); return; }
    if (!supabase) { setError(supabaseSetupMessage); return; }
    setLoading(true);
    const { error: authError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (authError) { setError(readableAuthError(authError)); return; }
    setDone(true);
  };
  if (done) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top + 40, paddingHorizontal: 24, alignItems: 'center' }}>
        <View style={styles.mailArt}>
          <Image source={images.auth} style={{ width: 160, height: 160 }} />
          <View style={styles.mailBadge}><Check size={16} color="#fff" /></View>
        </View>
        <Text style={[styles.kicker, { color: c.primary }]}>{t.auth.updatedKicker}</Text>
        <Text style={[styles.heroTitle, { color: c.text, textAlign: 'center' }]}>{t.auth.allSet}</Text>
        <Text style={{ color: c.textMuted, textAlign: 'center', marginVertical: 10 }}>{t.auth.allSetBody}</Text>
        <View style={{ width: '100%' }}>
          <PrimaryButton title={t.auth.continueHome} onPress={() => go('home')} c={c} icon={<ChevronRight size={18} color="#fff" />} />
        </View>
      </View>
    );
  }
  return (
    <AuthShell title={t.auth.resetTitle} subtitle={t.auth.resetSubtitle} go={go} t={t} c={c}>
      <View style={[styles.form, { backgroundColor: c.surface, borderColor: c.border }]}>
        {error ? <View style={[styles.error, { backgroundColor: c.dangerSoft }]}><AlertTriangle size={14} color={c.danger} /><Text style={{ color: c.danger, flex: 1, fontSize: 12 }}>{error}</Text></View> : null}
        <PasswordField label={t.auth.newPassword} value={password} onChange={setPassword} c={c} autoComplete="new-password" />
        <PasswordField label={t.auth.confirmNew} value={confirm} onChange={setConfirm} c={c} autoComplete="new-password" />
        <PrimaryButton title={loading ? t.auth.creating : t.auth.resetTitle} loading={loading} onPress={() => void submit()} c={c} icon={<KeyRound size={16} color="#fff" />} />
      </View>
    </AuthShell>
  );
}

export function LoadingScreen({ t }: { t: Copy }) {
  return (
    <LinearGradient colors={[...gradient.brand]} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <BrandMark size={70} fontSize={42} />
      <ActivityIndicator color="#fff" />
      <Text style={{ color: '#DCE1FF', fontSize: 13 }}>{t.common.loading}</Text>
    </LinearGradient>
  );
}

function Field({
  label, value, onChange, c, icon, ...rest
}: {
  label: string; value: string; onChange: (v: string) => void; c: Palette; icon?: ReactNode;
} & Omit<ComponentProps<typeof TextInput>, 'value' | 'onChangeText' | 'style'>) {
  return (
    <View style={{ gap: 6 }}>
      <Text style={[styles.label, { color: c.text }]}>{label}</Text>
      <View style={[styles.field, { borderColor: c.border, backgroundColor: c.bg }]}>
        {icon}
        <TextInput value={value} onChangeText={onChange} placeholderTextColor={c.textSoft} autoCapitalize="none" style={[styles.input, { color: c.text }]} {...rest} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  authHeader: { height: 64, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  hero: { minHeight: 168, marginHorizontal: 16, marginBottom: 14, borderRadius: 25, overflow: 'hidden', justifyContent: 'flex-end', padding: 18 },
  heroImg: { position: 'absolute', right: -20, bottom: -12, width: 180, height: 180 },
  heroCopy: { width: '58%' },
  kicker: { color: '#CAD4FF', fontSize: 10, letterSpacing: 1.4, fontWeight: '800' },
  heroTitle: { color: '#fff', fontSize: 25, fontWeight: '800', marginTop: 6, letterSpacing: -0.6 },
  heroSub: { color: '#E7E9FF', fontSize: 12, marginTop: 4, lineHeight: 17 },
  form: { marginHorizontal: 16, borderRadius: 21, padding: 16, gap: 12, borderWidth: 1 },
  label: { fontSize: 12, fontWeight: '800' },
  field: { height: 50, borderWidth: 1, borderRadius: 14, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', gap: 8 },
  input: { flex: 1, fontSize: 15, height: 50 },
  banner: { flexDirection: 'row', gap: 8, padding: 12, borderRadius: 13, alignItems: 'flex-start' },
  error: { flexDirection: 'row', gap: 8, padding: 11, borderRadius: 13, alignItems: 'center' },
  demo: { borderRadius: 14, padding: 12, backgroundColor: '#EEF1FF', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  trust: { flexDirection: 'row', gap: 6, marginHorizontal: 24, marginTop: 14, alignItems: 'flex-start' },
  check: { width: 18, height: 18, borderRadius: 5, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  mailArt: { width: 146, height: 146, borderRadius: 32, alignSelf: 'center', marginTop: 36, marginBottom: 12, overflow: 'hidden', backgroundColor: '#E8ECFF', alignItems: 'center', justifyContent: 'center' },
  mailBadge: { position: 'absolute', right: -4, bottom: -4, width: 34, height: 34, borderRadius: 17, backgroundColor: '#1BA968', alignItems: 'center', justifyContent: 'center', borderWidth: 4, borderColor: '#F3F5FB' },
});
