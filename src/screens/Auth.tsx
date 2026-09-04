import { LinearGradient } from 'expo-linear-gradient';
import {
  AlertTriangle, ArrowLeft, Check, ChevronRight, Eye, EyeOff, Info, KeyRound, LockKeyhole,
  Mail, UserPlus, UserRound,
} from 'lucide-react-native';
import { useEffect, useState, type ComponentProps, type ReactNode } from 'react';
import {
  ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Animated, { Easing, interpolate, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { BrandLogo, BrandMark, PrimaryButton, SecondaryButton } from '../components/ui';
import { images } from '../data';
import type { Copy } from '../i18n';
import { isSupabaseConfigured, readableAuthError, supabase, supabaseSetupMessage } from '../lib/supabase';
import { Entrance, FadeScale, GlowPulse, HeroFloat, Shake } from '../motion';
import { gradient, type Palette } from '../theme';
import type { Screen } from '../types';
import type { User } from '@supabase/supabase-js';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

function AuthShell({
  title, subtitle, go, t, c, children,
}: { title: string; subtitle: string; go: (s: Screen) => void; t: Copy; c: Palette; children: ReactNode }) {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView style={{ flex: 1, backgroundColor: c.bg }} contentContainerStyle={{ paddingBottom: insets.bottom + 28 }} keyboardShouldPersistTaps="handled">
      <View style={[styles.authHeader, { paddingTop: insets.top + 6 }]}>
        <Pressable onPress={() => go('welcome')} style={[styles.back, { backgroundColor: c.surface, borderColor: c.border, borderWidth: 1 }]} accessibilityLabel="Back">
          <ArrowLeft size={18} color={c.text} />
        </Pressable>
        <BrandLogo compact c={c} />
        <View style={{ width: 40 }} />
      </View>
      <HeroFloat>
        <LinearGradient colors={[...gradient.auth]} style={styles.hero}>
          <Image source={images.auth} style={styles.heroImg} resizeMode="contain" />
          <View style={styles.heroCopy}>
            <Text style={styles.kicker}>{t.auth.kicker}</Text>
            <Text style={styles.heroTitle}>{title}</Text>
            <Text style={styles.heroSub}>{subtitle}</Text>
          </View>
        </LinearGradient>
      </HeroFloat>
      <FadeScale delay={180}>
        {children}
      </FadeScale>
      <View style={styles.trust}>
        <LockKeyhole size={12} color={c.primary} />
        <Text style={{ color: c.textMuted, fontSize: 11, textAlign: 'center', flex: 1 }}>{t.auth.trust}</Text>
      </View>
    </ScrollView>
  );
}

/* ── Enhanced Animated Field ── */
function AuthField({
  label, value, onChange, c, icon, onFocus, onBlur, ...rest
}: {
  label: string; value: string; onChange: (v: string) => void; c: Palette; icon?: ReactNode;
} & Omit<ComponentProps<typeof TextInput>, 'value' | 'onChangeText' | 'onChange' | 'style'>) {
  const [focused, setFocused] = useState(false);
  const focusProgress = useSharedValue(0);

  useEffect(() => {
    focusProgress.value = withTiming(focused ? 1 : 0, { duration: 220, easing: Easing.out(Easing.quad) });
  }, [focused, focusProgress]);

  const borderAnim = useAnimatedStyle(() => ({
    borderColor: focused
      ? c.primary
      : c.border,
    shadowRadius: interpolate(focusProgress.value, [0, 1], [0, 14]),
    shadowOpacity: interpolate(focusProgress.value, [0, 1], [0, 0.2]),
  }));

  return (
    <View style={{ gap: 6 }}>
      <Text style={[styles.label, { color: focused ? c.primary : c.text }]}>{label}</Text>
      <Animated.View style={[styles.field, { backgroundColor: c.bgElevated, shadowColor: c.primary }, borderAnim]}>
        {icon}
        <TextInput
          value={value}
          onChangeText={onChange}
          placeholderTextColor={c.textSoft}
          accessibilityLabel={label}
          onFocus={(event) => { setFocused(true); onFocus?.(event); }}
          onBlur={(event) => { setFocused(false); onBlur?.(event); }}
          style={[styles.input, { color: c.text }]}
          {...rest}
        />
      </Animated.View>
    </View>
  );
}

/* ── Enhanced Password Field ── */
function PasswordField({
  label, value, onChange, c, autoComplete = 'password',
}: { label: string; value: string; onChange: (v: string) => void; c: Palette; autoComplete?: ComponentProps<typeof TextInput>['autoComplete'] }) {
  const [visible, setVisible] = useState(false);
  const [focused, setFocused] = useState(false);
  const focusProgress = useSharedValue(0);

  useEffect(() => {
    focusProgress.value = withTiming(focused ? 1 : 0, { duration: 220, easing: Easing.out(Easing.quad) });
  }, [focused, focusProgress]);

  const borderAnim = useAnimatedStyle(() => ({
    borderColor: focused
      ? c.primary
      : c.border,
    shadowRadius: interpolate(focusProgress.value, [0, 1], [0, 14]),
    shadowOpacity: interpolate(focusProgress.value, [0, 1], [0, 0.2]),
  }));

  return (
    <View style={{ gap: 6 }}>
      <Text style={[styles.label, { color: focused ? c.primary : c.text }]}>{label}</Text>
      <Animated.View style={[styles.field, { backgroundColor: c.bgElevated, shadowColor: c.primary }, borderAnim]}>
        <LockKeyhole size={17} color={c.textMuted} />
        <TextInput
          value={value}
          onChangeText={onChange}
          secureTextEntry={!visible}
          autoComplete={autoComplete}
          autoCapitalize="none"
          autoCorrect={false}
          placeholderTextColor={c.textSoft}
          accessibilityLabel={label}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[styles.input, { color: c.text }]}
        />
        <Pressable onPress={() => setVisible((v) => !v)} accessibilityLabel={visible ? 'Hide password' : 'Show password'}>
          {visible ? <EyeOff size={16} color={c.textMuted} /> : <Eye size={16} color={c.textMuted} />}
        </Pressable>
      </Animated.View>
    </View>
  );
}

export function LoginScreen({
  go, t, c, onAuthenticated,
}: {
  go: (s: Screen) => void; t: Copy; c: Palette;
  onAuthenticated: (user: User) => void;
}) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorKey, setErrorKey] = useState(0);
  const valid = email.trim().length > 0 && password.length > 0;

  const submit = async () => {
    setError('');
    if (!valid) { setError(t.auth.fillAll); setErrorKey((k) => k + 1); return; }
    if (!supabase) {
      setError(supabaseSetupMessage);
      setErrorKey((k) => k + 1);
      return;
    }
    setLoading(true);
    const { data, error: authError } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
    setLoading(false);
    if (authError) { setError(readableAuthError(authError)); setErrorKey((k) => k + 1); return; }
    if (data.user) onAuthenticated(data.user);
  };

  return (
    <AuthShell title={t.auth.loginTitle} subtitle={t.auth.loginSubtitle} go={go} t={t} c={c}>
      <View style={[styles.form, { backgroundColor: c.surface, borderColor: c.border }]}>
        <Shake trigger={errorKey}>
          {error ? <View style={[styles.error, { backgroundColor: c.dangerSoft }]}><AlertTriangle size={14} color={c.danger} /><Text style={{ color: c.danger, flex: 1, fontSize: 12 }}>{error}</Text></View> : null}
        </Shake>
        <Entrance index={0}>
          <AuthField label={t.auth.email} value={email} onChange={setEmail} c={c} icon={<Mail size={17} color={c.textMuted} />} autoComplete="email" autoCapitalize="none" autoCorrect={false} keyboardType="email-address" inputMode="email" />
        </Entrance>
        <Entrance index={1}>
          <PasswordField label={t.auth.password} value={password} onChange={setPassword} c={c} />
        </Entrance>
        <Entrance index={2}>
          <Pressable onPress={() => go('forgot-password')} style={{ alignSelf: 'flex-end', paddingVertical: 2 }}>
            <Text style={{ color: c.primary, fontSize: 13, fontWeight: '700' }}>{t.auth.forgot}</Text>
          </Pressable>
        </Entrance>
        <Entrance index={3}>
          <PrimaryButton title={loading ? t.auth.loggingIn : t.auth.logIn} loading={loading} onPress={() => void submit()} c={c} icon={<ChevronRight size={18} color="#fff" />} disabled={!valid && !loading} />
        </Entrance>
        <Entrance index={4}>
          <View style={styles.divider}>
            <View style={[styles.dividerLine, { backgroundColor: c.border }]} />
            <Text style={{ color: c.textMuted, fontSize: 12, marginHorizontal: 10 }}>{t.auth.newTo}</Text>
            <View style={[styles.dividerLine, { backgroundColor: c.border }]} />
          </View>
        </Entrance>
        <Entrance index={5}>
          <SecondaryButton title={t.auth.create} onPress={() => go('signup')} c={c} icon={<UserPlus size={16} color={c.text} />} />
        </Entrance>
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
  const [errorKey, setErrorKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const valid =
    name.trim().length > 0 &&
    /\S+@\S+\.\S+/.test(email.trim()) &&
    password.length >= 8 &&
    /[A-Za-z]/.test(password) &&
    /[0-9]/.test(password) &&
    password === confirm;

  const submit = async () => {
    setError('');
    if (!valid) { setError(t.auth.fillAll); setErrorKey((k) => k + 1); return; }
    if (password !== confirm) { setError(t.auth.mismatch); setErrorKey((k) => k + 1); return; }
    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) { setError(t.auth.weak); setErrorKey((k) => k + 1); return; }
    if (!accepted) { setError(t.auth.accept); setErrorKey((k) => k + 1); return; }
    if (!supabase) { setError(supabaseSetupMessage); setErrorKey((k) => k + 1); return; }
    setLoading(true);
    const { data, error: authError } = await supabase.auth.signUp({
      email: email.trim(),
      password,
      options: { data: { full_name: name.trim(), onboarding_completed: true } },
    });
    setLoading(false);
    if (authError) { setError(readableAuthError(authError)); setErrorKey((k) => k + 1); return; }
    setAuthEmail(email.trim());
    setEmailPurpose('signup');
    if (data.session && data.user) onAuthenticated(data.user);
    else go('check-email');
  };

  const hasEight = password.length >= 8;
  const hasMix = /[A-Za-z]/.test(password) && /\d/.test(password);

  return (
    <AuthShell title={t.auth.signupTitle} subtitle={t.auth.signupSubtitle} go={go} t={t} c={c}>
      <View style={[styles.form, { backgroundColor: c.surface, borderColor: c.border }]}>
        <Shake trigger={errorKey}>
          {error ? <View style={[styles.error, { backgroundColor: c.dangerSoft }]}><AlertTriangle size={14} color={c.danger} /><Text style={{ color: c.danger, flex: 1, fontSize: 12 }}>{error}</Text></View> : null}
        </Shake>
        <Entrance index={0}>
          <AuthField label={t.auth.fullName} value={name} onChange={setName} c={c} icon={<UserRound size={17} color={c.textMuted} />} autoComplete="name" autoCapitalize="words" />
        </Entrance>
        <Entrance index={1}>
          <AuthField label={t.auth.email} value={email} onChange={setEmail} c={c} icon={<Mail size={17} color={c.textMuted} />} autoComplete="email" autoCapitalize="none" autoCorrect={false} keyboardType="email-address" inputMode="email" />
        </Entrance>
        <Entrance index={2}>
          <PasswordField label={t.auth.password} value={password} onChange={setPassword} c={c} autoComplete="new-password" />
        </Entrance>
        <Entrance index={3}>
          <PasswordField label={t.auth.confirm} value={confirm} onChange={setConfirm} c={c} autoComplete="new-password" />
        </Entrance>
        <Entrance index={4}>
          <PasswordStrength hasEight={hasEight} hasMix={hasMix} t={t} c={c} />
        </Entrance>
        <Entrance index={5}>
          <Pressable onPress={() => setAccepted((v) => !v)} style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
            <View style={[styles.check, { borderColor: accepted ? c.primary : c.border, backgroundColor: accepted ? c.primary : 'transparent' }]}>
              {accepted && <Check size={12} color="#fff" />}
            </View>
            <Text style={{ color: c.textMuted, fontSize: 12, flex: 1, lineHeight: 18 }}>
              {t.auth.terms} <Text style={{ color: c.primary, fontWeight: '800' }}>{t.auth.termsLink}</Text> {t.auth.and} <Text style={{ color: c.primary, fontWeight: '800' }}>{t.auth.privacyLink}</Text>.
            </Text>
          </Pressable>
        </Entrance>
        <Entrance index={6}>
          <PrimaryButton title={loading ? t.auth.creating : t.auth.create} loading={loading} onPress={() => void submit()} c={c} disabled={!valid && !loading} />
        </Entrance>
        <Entrance index={7}>
          <Pressable onPress={() => go('login')} style={{ alignItems: 'center', paddingVertical: 2 }}>
            <Text style={{ textAlign: 'center', color: c.textMuted, fontSize: 13 }}>
              {t.auth.already} <Text style={{ color: c.primary, fontWeight: '800' }}>{t.auth.logIn}</Text>
            </Text>
          </Pressable>
        </Entrance>
      </View>
    </AuthShell>
  );
}

/* ── Animated Password Strength Indicator ── */
function PasswordStrength({ hasEight, hasMix, t, c }: { hasEight: boolean; hasMix: boolean; t: Copy; c: Palette }) {
  const score = (hasEight ? 1 : 0) + (hasMix ? 1 : 0);

  const barAnim = useAnimatedStyle(() => ({
    width: `${score * 50}%` as unknown as number,
    backgroundColor: score >= 2 ? c.success : score >= 1 ? c.warning : c.border,
  }));

  return (
    <View style={{ gap: 4 }}>
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <Text style={{ color: hasEight ? c.success : c.textMuted, fontSize: 11, fontWeight: hasEight ? '700' : '500' }}>
          {t.auth.rule8}
        </Text>
        <Text style={{ color: hasMix ? c.success : c.textMuted, fontSize: 11, fontWeight: hasMix ? '700' : '500' }}>
          {t.auth.ruleMix}
        </Text>
      </View>
      <View style={{ height: 3, borderRadius: 2, backgroundColor: c.surface2, overflow: 'hidden' }}>
        <Animated.View style={[{ height: '100%', borderRadius: 2 }, barAnim]} />
      </View>
    </View>
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
  const [errorKey, setErrorKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const valid = /\S+@\S+\.\S+/.test(email.trim());
  const submit = async () => {
    setError('');
    if (!valid) { setError(t.auth.invalidEmail); setErrorKey((k) => k + 1); return; }
    if (!supabase) { setError(supabaseSetupMessage); setErrorKey((k) => k + 1); return; }
    setLoading(true);
    const { error: authError } = await supabase.auth.resetPasswordForEmail(email.trim());
    setLoading(false);
    if (authError) { setError(readableAuthError(authError)); setErrorKey((k) => k + 1); return; }
    setAuthEmail(email.trim());
    setEmailPurpose('recovery');
    go('check-email');
  };
  return (
    <AuthShell title={t.auth.forgotTitle} subtitle={t.auth.forgotSubtitle} go={go} t={t} c={c}>
      <View style={[styles.form, { backgroundColor: c.surface, borderColor: c.border }]}>
        <Shake trigger={errorKey}>
          {error ? <View style={[styles.error, { backgroundColor: c.dangerSoft }]}><AlertTriangle size={14} color={c.danger} /><Text style={{ color: c.danger, flex: 1, fontSize: 12 }}>{error}</Text></View> : null}
        </Shake>
        <Entrance index={0}>
          <AuthField label={t.auth.email} value={email} onChange={setEmail} c={c} icon={<Mail size={17} color={c.textMuted} />} autoComplete="email" autoCapitalize="none" autoCorrect={false} keyboardType="email-address" inputMode="email" />
        </Entrance>
        <Entrance index={1}>
          <PrimaryButton title={loading ? t.auth.sending : t.auth.sendLink} loading={loading} onPress={() => void submit()} c={c} icon={<Mail size={16} color="#fff" />} />
        </Entrance>
        <Entrance index={2}>
          <Pressable onPress={() => go('login')} style={{ flexDirection: 'row', justifyContent: 'center', gap: 6 }}>
            <ArrowLeft size={13} color={c.textMuted} />
            <Text style={{ color: c.textMuted, fontSize: 13 }}>{t.auth.backLogin}</Text>
          </Pressable>
        </Entrance>
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
      <FadeScale delay={80}>
        <View style={{ alignItems: 'center', marginTop: 12 }}><BrandLogo compact c={c} /></View>
      </FadeScale>
      <FadeScale delay={200}>
        <View style={[styles.mailArt, { backgroundColor: c.primarySoft }]}>
          <Image source={images.auth} style={{ width: 160, height: 160 }} />
          <GlowPulse color={c.success} size={16}>
            <View style={[styles.mailBadge, { borderColor: c.bg }]}><Check size={16} color="#fff" /></View>
          </GlowPulse>
        </View>
      </FadeScale>
      <Entrance index={0}>
        <Text style={[styles.kicker, { color: c.primary, textAlign: 'center' }]}>{t.auth.checkKicker}</Text>
      </Entrance>
      <Entrance index={1}>
        <Text style={[styles.heroTitle, { color: c.text, textAlign: 'center', marginTop: 8 }]}>{t.auth.emailSent}</Text>
      </Entrance>
      <Entrance index={2}>
        <Text style={{ color: c.textMuted, textAlign: 'center', marginTop: 8, lineHeight: 20 }}>
          {t.auth.emailBody} <Text style={{ color: c.text, fontWeight: '800' }}>{email || 'your email address'}</Text>.
        </Text>
      </Entrance>
      <Entrance index={3}>
        <View style={[styles.banner, { backgroundColor: c.surface2, marginTop: 18 }]}>
          <Info size={14} color={c.textMuted} />
          <Text style={{ color: c.textMuted, flex: 1, fontSize: 12 }}>{message || t.auth.emailHelp}</Text>
        </View>
      </Entrance>
      <Entrance index={4}>
        <View style={{ marginTop: 18 }}>
          <PrimaryButton title={t.auth.backLogin} onPress={() => go('login')} c={c} />
        </View>
      </Entrance>
      <Entrance index={5}>
        <Pressable onPress={() => void resend()} disabled={loading} style={{ marginTop: 14 }}>
          <Text style={{ textAlign: 'center', color: c.primary, fontWeight: '700' }}>{loading ? t.auth.sending : t.auth.resend}</Text>
        </Pressable>
      </Entrance>
    </View>
  );
}

export function ResetPasswordScreen({ go, t, c }: { go: (s: Screen) => void; t: Copy; c: Palette }) {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [error, setError] = useState('');
  const [errorKey, setErrorKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const insets = useSafeAreaInsets();
  const submit = async () => {
    setError('');
    if (password !== confirm) { setError(t.auth.mismatch); setErrorKey((k) => k + 1); return; }
    if (!supabase) { setError(supabaseSetupMessage); setErrorKey((k) => k + 1); return; }
    setLoading(true);
    const { error: authError } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (authError) { setError(readableAuthError(authError)); setErrorKey((k) => k + 1); return; }
    setDone(true);
  };
  if (done) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top + 40, paddingHorizontal: 24, alignItems: 'center' }}>
        <FadeScale delay={100}>
          <View style={[styles.mailArt, { backgroundColor: c.primarySoft }]}>
            <Image source={images.auth} style={{ width: 160, height: 160 }} />
            <GlowPulse color={c.success} size={16}>
              <View style={[styles.mailBadge, { borderColor: c.bg }]}><Check size={16} color="#fff" /></View>
            </GlowPulse>
          </View>
        </FadeScale>
        <Entrance index={0}>
          <Text style={[styles.kicker, { color: c.primary }]}>{t.auth.updatedKicker}</Text>
        </Entrance>
        <Entrance index={1}>
          <Text style={[styles.heroTitle, { color: c.text, textAlign: 'center' }]}>{t.auth.allSet}</Text>
        </Entrance>
        <Entrance index={2}>
          <Text style={{ color: c.textMuted, textAlign: 'center', marginVertical: 10 }}>{t.auth.allSetBody}</Text>
        </Entrance>
        <Entrance index={3}>
          <View style={{ width: '100%' }}>
            <PrimaryButton title={t.auth.continueHome} onPress={() => go('home')} c={c} icon={<ChevronRight size={18} color="#fff" />} />
          </View>
        </Entrance>
      </View>
    );
  }
  return (
    <AuthShell title={t.auth.resetTitle} subtitle={t.auth.resetSubtitle} go={go} t={t} c={c}>
      <View style={[styles.form, { backgroundColor: c.surface, borderColor: c.border }]}>
        <Shake trigger={errorKey}>
          {error ? <View style={[styles.error, { backgroundColor: c.dangerSoft }]}><AlertTriangle size={14} color={c.danger} /><Text style={{ color: c.danger, flex: 1, fontSize: 12 }}>{error}</Text></View> : null}
        </Shake>
        <Entrance index={0}>
          <PasswordField label={t.auth.newPassword} value={password} onChange={setPassword} c={c} autoComplete="new-password" />
        </Entrance>
        <Entrance index={1}>
          <PasswordField label={t.auth.confirmNew} value={confirm} onChange={setConfirm} c={c} autoComplete="new-password" />
        </Entrance>
        <Entrance index={2}>
          <PrimaryButton title={loading ? t.auth.creating : t.auth.resetTitle} loading={loading} onPress={() => void submit()} c={c} icon={<KeyRound size={16} color="#fff" />} />
        </Entrance>
      </View>
    </AuthShell>
  );
}

export function LoadingScreen({ t }: { t: Copy }) {
  return (
    <LinearGradient colors={[...gradient.brand]} style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: 16 }}>
      <GlowPulse color="rgba(123,145,255,0.5)" size={20}>
        <BrandMark size={70} fontSize={42} />
      </GlowPulse>
      <ActivityIndicator color="#fff" />
      <Text style={{ color: '#DCE1FF', fontSize: 13 }}>{t.common.loading}</Text>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  authHeader: { height: 64, paddingHorizontal: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  back: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  hero: { minHeight: 178, marginHorizontal: 18, marginBottom: 16, borderRadius: 22, overflow: 'hidden', justifyContent: 'flex-end', padding: 20 },
  heroImg: { position: 'absolute', right: -8, bottom: -18, width: 188, height: 188 },
  heroCopy: { width: '56%' },
  kicker: { color: '#D5DCF8', fontSize: 11, letterSpacing: 1.3, fontWeight: '800' },
  heroTitle: { color: '#F5F8FF', fontSize: 24, fontWeight: '800', marginTop: 6, letterSpacing: -0.5 },
  heroSub: { color: '#E4E9FA', fontSize: 13, marginTop: 4, lineHeight: 18 },
  form: { marginHorizontal: 18, borderRadius: 21, padding: 18, gap: 14, borderWidth: 1 },
  label: { fontSize: 12, fontWeight: '800' },
  field: { minHeight: 54, borderWidth: 1.5, borderRadius: 16, paddingHorizontal: 14, flexDirection: 'row', alignItems: 'center', gap: 10, shadowOffset: { width: 0, height: 0 }, elevation: 0 },
  input: { flex: 1, fontSize: 16, minHeight: 52, paddingVertical: 0, outlineWidth: 0, outlineStyle: 'solid', outlineColor: 'transparent' },
  banner: { flexDirection: 'row', gap: 8, padding: 12, borderRadius: 13, alignItems: 'flex-start' },
  error: { flexDirection: 'row', gap: 8, padding: 11, borderRadius: 13, alignItems: 'center' },
  trust: { flexDirection: 'row', gap: 6, marginHorizontal: 24, marginTop: 14, alignItems: 'flex-start' },
  check: { width: 18, height: 18, borderRadius: 5, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', marginTop: 1 },
  mailArt: { width: 146, height: 146, borderRadius: 32, alignSelf: 'center', marginTop: 36, marginBottom: 12, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  mailBadge: { position: 'absolute', right: -4, bottom: -4, width: 34, height: 34, borderRadius: 17, backgroundColor: '#1BA968', alignItems: 'center', justifyContent: 'center', borderWidth: 4 },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: 2 },
  dividerLine: { flex: 1, height: StyleSheet.hairlineWidth },
});
