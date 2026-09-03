'use client';

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react';
import type { Session, User } from '@supabase/supabase-js';
import {
  AlertTriangle, ArrowLeft, ArrowUpRight, Bell, CalendarDays, Check,
  CheckCircle2, ChevronRight, CircleHelp, Clock3, Copy, Eye, EyeOff,
  Droplets, FileText, Globe2, History, Home, Info, KeyRound,
  Film, Landmark, Languages, LoaderCircle, LockKeyhole, LogOut, Mail, Moon, MoreHorizontal, Pause, Pencil, Play, Plus, ReceiptText,
  RefreshCw, Router, Settings, ShieldCheck, Smartphone, Sun, Tv, Upload,
  Sparkles, UserRound, UserPlus, WifiOff, X, Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';
import { isSupabaseConfigured, readableAuthError, supabase, supabaseSetupMessage } from '@/lib/supabase';

type Screen =
  | 'welcome' | 'onboarding' | 'home' | 'bills' | 'bill-detail' | 'add-bill'
  | 'edit-bill' | 'mark-paid' | 'success' | 'activity' | 'load' | 'load-detail'
  | 'lingkod' | 'government-detail' | 'notifications' | 'settings' | 'language'
  | 'appearance' | 'privacy' | 'offline' | 'empty' | 'error' | 'story'
  | 'login' | 'signup' | 'forgot-password' | 'check-email' | 'reset-password';

type Lang = 'English' | 'Filipino' | 'Cebuano';

type ModelTool = {
  name: string;
  title?: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: { readOnlyHint?: boolean; untrustedContentHint?: boolean };
  execute: (input: unknown) => unknown | Promise<unknown>;
};

declare global {
  interface Document {
    modelContext?: { registerTool: (tool: ModelTool, options?: { signal?: AbortSignal }) => void | Promise<void> };
  }
}

const providers = [
  { name: 'Meralco', mark: 'M', tone: 'orange' },
  { name: 'Maynilad', mark: 'W', tone: 'blue' },
  { name: 'PLDT', mark: 'P', tone: 'red' },
  { name: 'Globe', mark: 'G', tone: 'indigo' },
];

const services = [
  { label: 'Kuryente', icon: Zap }, { label: 'Tubig', icon: Droplets },
  { label: 'Internet', icon: Router }, { label: 'Cable TV', icon: Tv },
  { label: 'Load', icon: Smartphone }, { label: 'Government', icon: Landmark },
  { label: 'Insurance', icon: ShieldCheck }, { label: 'Iba pa', icon: MoreHorizontal },
];

const bills = [
  { provider: 'MERALCO', category: 'Electricity', account: '9012', due: 'Sep 8, 2026', amount: '₱2,450.36', status: 'Due soon', tone: 'orange' },
  { provider: 'MAYNILAD', category: 'Water', account: '3381', due: 'Sep 12, 2026', amount: '₱598.00', status: 'Upcoming', tone: 'blue' },
  { provider: 'GLOBE', category: 'Internet', account: '7740', due: 'Sep 16, 2026', amount: '₱599.00', status: 'Upcoming', tone: 'indigo' },
  { provider: 'PLDT', category: 'Internet', account: '2710', due: 'Aug 31, 2026', amount: '₱1,699.00', status: 'Overdue', tone: 'red' },
];

const languages: Record<Lang, { hello: string; due: string; unpaid: string }> = {
  English: { hello: 'Good evening,', due: '2 bills are due soon.', unpaid: 'Still unpaid' },
  Filipino: { hello: 'Magandang gabi,', due: '2 bayarin ang malapit nang mag-due.', unpaid: 'Hindi pa bayad' },
  Cebuano: { hello: 'Maayong gabii,', due: '2 ka bayranan ang hapit na ang due date.', unpaid: 'Wala pa mabayri' },
};

const DEMO_EMAIL = 'demo@bayarin.app';
const DEMO_PASSWORD = 'Bayarin2026!';

function BrandMark({ small = false }: { small?: boolean }) {
  return <span className={small ? 'brand-mark small' : 'brand-mark'} aria-label="Bayarin B">B</span>;
}

function BrandLogo({ compact = false, inverted = false }: { compact?: boolean; inverted?: boolean }) {
  return <span className={`brand-logo ${compact?'compact':''} ${inverted?'inverted':''}`}><BrandMark small/><span><b>Bayarin</b>{!compact&&<small>Bayad. Organisado. Panatag.</small>}</span></span>;
}

function ProviderMark({ tone, letter }: { tone: string; letter: string }) {
  return <span className={`provider-mark ${tone}`}>{letter}</span>;
}

function StatusPill({ status }: { status: string }) {
  const icon = status === 'Paid' ? <CheckCircle2 /> : status === 'Overdue' ? <AlertTriangle /> : status === 'Due soon' ? <Clock3 /> : <CalendarDays />;
  return <span className={`status-pill ${status.toLowerCase().replace(' ', '-')}`}>{icon}{status}</span>;
}

function AppHeader({ title, onBack, trailing }: { title: string; onBack?: () => void; trailing?: ReactNode }) {
  return (
    <header className="app-header">
      {onBack ? <button className="header-action" onClick={onBack} aria-label="Go back"><ArrowLeft /></button> : <span className="header-spacer" />}
      <h1><span className="header-brand-mark">B</span>{title}</h1>
      {trailing ?? <span className="header-spacer" />}
    </header>
  );
}

function BottomNav({ screen, go }: { screen: Screen; go: (s: Screen) => void }) {
  const items: { key: Screen; label: string; icon: typeof Home }[] = [
    { key: 'home', label: 'Home', icon: Home }, { key: 'bills', label: 'Bills', icon: ReceiptText },
    { key: 'story', label: 'Story', icon: Sparkles }, { key: 'lingkod', label: 'Lingkod', icon: Landmark },
    { key: 'settings', label: 'Settings', icon: Settings },
  ];
  return <nav className="bottom-nav" aria-label="Primary navigation">{items.map(({ key, label, icon: Icon }) => <button key={key} className={screen === key ? 'active' : ''} onClick={() => go(key)}><Icon /><span>{label}</span></button>)}</nav>;
}

function ScrollScreen({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`screen-scroll ${className}`}>{children}</div>;
}

function Welcome({ go }: { go: (s: Screen) => void }) {
  return <div className="welcome-screen">
    <div className="welcome-orbit orbit-one" /><div className="welcome-orbit orbit-two" />
    <div className="welcome-top"><span>Organize home</span><span>Stay on track</span></div>
    <img className="welcome-scene" src="/assets/bayarin-story-3d.png" alt="3D Bayarin household organizer scene"/>
    <div className="welcome-brand"><BrandMark /><h1>Bayarin</h1><p>Bayad. Mabilis. Organisado.</p><span>Para sa bawat tahanang Pilipino.</span></div>
    <div className="welcome-feature-rail"><span><CalendarDays/><b>Organisado</b></span><span><Bell/><b>Paalala</b></span><span><ShieldCheck/><b>Panatag</b></span></div>
    <div className="welcome-actions"><Button onClick={() => go('onboarding')} className="primary-button light">Magsimula <ChevronRight /></Button><button className="story-link" onClick={()=>go('story')}><Play/> Watch the Bayarin story</button><button className="login-link" onClick={() => go('login')}>May account na? <b>Mag-login</b></button></div>
  </div>;
}

function Onboarding({ go, finish }: { go: (s: Screen) => void; finish?:()=>void }) {
  const [step,setStep]=useState(0);
  const pages=[
    {eyebrow:'EVERY BILL, ONE PLACE',title:'Lahat ng bayarin, organisado.',body:'See what is due, what is coming, and what your household has already paid.',kind:'calendar'},
    {eyebrow:'CALM, TIMELY REMINDERS',title:'Huwag palampasin ang due date.',body:'Set gentle reminders for utilities, load, and government deadlines.',kind:'reminder'},
    {eyebrow:'PAYMENTS STAY EXTERNAL',title:'Organized—never a wallet.',body:'Continue through GCash, Maya, billers, or official sites, then record the result.',kind:'secure'},
  ];
  const page=pages[step];
  const complete=()=>finish?finish():go('signup');
  const next=()=>step<2?setStep(step+1):complete();
  return <div className="onboarding-screen auth-onboarding">
    <button className="onboarding-skip" onClick={complete}>Skip</button>
    <div className={`onboarding-visual visual-${page.kind}`}>
      <img key={page.kind} src="/assets/bayarin-onboarding-3d.png" alt="3D calendar, reminder bell, and security shield"/>
      <span className="onboarding-focus">{page.kind==='calendar'?<CalendarDays/>:page.kind==='reminder'?<Bell/>:<ShieldCheck/>}</span>
      <span className="float-card bill">{page.kind==='calendar'?<><Zap/> All bills</>:page.kind==='reminder'?<><Clock3/> 3 days before</>:<><ArrowUpRight/> Pay externally</>}</span>
    </div>
    <div className="onboarding-copy"><span className="eyebrow">{page.eyebrow}</span><h1>{page.title}</h1><p>{page.body}</p>{step===2&&<div className="privacy-note"><ShieldCheck /><span><b>Supabase-secured accounts</b>Your records are protected with row-level access rules.</span></div>}</div>
    <div className="onboarding-actions"><div className="pager">{pages.map((_,index)=><button aria-label={`Go to onboarding page ${index+1}`} key={index} className={step===index?'active':''} onClick={()=>setStep(index)}/>)}</div><Button className="primary-button" onClick={next}>{step===2?'Create my account':'Continue'} <ChevronRight /></Button><button onClick={()=>go('login')}>Already have an account? <b>Log in</b></button></div>
  </div>;
}

function AuthShell({ title, subtitle, go, children }: { title:string;subtitle:string;go:(s:Screen)=>void;children:ReactNode }) {
  return <div className="auth-screen"><header className="auth-header"><button onClick={()=>go('welcome')} aria-label="Back to welcome"><ArrowLeft/></button><BrandLogo compact/><span/></header><div className="auth-hero"><span className="auth-aura"/><img src="/assets/bayarin-auth-3d.png" alt="Bayarin household organizer with calendar and security shield"/><div className="auth-copy"><span className="auth-kicker">BAYARIN ACCOUNT</span><h1>{title}</h1><p>{subtitle}</p></div></div>{!isSupabaseConfigured&&<div className="auth-config"><Info/><span><b>Demo mode is ready</b>Use the test account below. Connect Supabase to enable real accounts.</span></div>}{children}<p className="auth-trust"><ShieldCheck/> Secured by Supabase Auth. Bayarin never asks for wallet or bank passwords.</p></div>;
}

function PasswordField({ value, onChange, label='Password', autoComplete='current-password' }: { value:string;onChange:(value:string)=>void;label?:string;autoComplete?:string }) {
  const [visible,setVisible]=useState(false);
  return <label>{label}<div className="password-input"><LockKeyhole/><Input value={value} onChange={e=>onChange(e.target.value)} type={visible?'text':'password'} autoComplete={autoComplete} required minLength={8}/><button type="button" onClick={()=>setVisible(!visible)} aria-label={visible?'Hide password':'Show password'}>{visible?<EyeOff/>:<Eye/>}</button></div></label>;
}

function LoginScreen({ go, onAuthenticated, onDemoAuthenticated }: { go:(s:Screen)=>void;onAuthenticated:(user:User)=>void;onDemoAuthenticated:()=>void }) {
  const [email,setEmail]=useState('');const [password,setPassword]=useState('');const [error,setError]=useState('');const [loading,setLoading]=useState(false);
  const submit=async(e:FormEvent)=>{e.preventDefault();setError('');if(email.trim().toLowerCase()===DEMO_EMAIL&&password===DEMO_PASSWORD){onDemoAuthenticated();return}if(!supabase){setError('Use the demo credentials shown below, or connect Supabase for real accounts.');return}setLoading(true);const {data,error:authError}=await supabase.auth.signInWithPassword({email:email.trim(),password});setLoading(false);if(authError){setError(readableAuthError(authError));return}if(data.user)onAuthenticated(data.user)};
  const fillDemo=()=>{setEmail(DEMO_EMAIL);setPassword(DEMO_PASSWORD);setError('')};
  return <AuthShell title="Welcome back" subtitle="Log in to see your household’s bills, reminders, and activity." go={go}><form className="auth-form" onSubmit={submit}>{error&&<div className="auth-error"><AlertTriangle/>{error}</div>}<button className="demo-login" type="button" onClick={fillDemo}><span><Sparkles/><b>Demo household</b></span><small>{DEMO_EMAIL}</small><strong>Fill test login <ChevronRight/></strong></button><label>Email address<div className="field-with-icon"><Mail/><Input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" placeholder="juan@email.com" required/></div></label><PasswordField value={password} onChange={setPassword}/><button className="forgot-link" type="button" onClick={()=>go('forgot-password')}>Forgot password?</button><Button className="primary-button auth-submit" disabled={loading} type="submit">{loading?<><LoaderCircle className="spin"/>Logging in…</>:<>Log in <ChevronRight/></>}</Button><div className="auth-divider"><span>New to Bayarin?</span></div><Button variant="outline" className="secondary-button" type="button" onClick={()=>go('signup')}><UserPlus/> Create an account</Button></form></AuthShell>;
}

function SignupScreen({ go, setAuthEmail, setEmailPurpose, onAuthenticated }: { go:(s:Screen)=>void;setAuthEmail:(email:string)=>void;setEmailPurpose:(purpose:'signup'|'recovery')=>void;onAuthenticated:(user:User)=>void }) {
  const [name,setName]=useState('');const [email,setEmail]=useState('');const [password,setPassword]=useState('');const [confirm,setConfirm]=useState('');const [accepted,setAccepted]=useState(false);const [error,setError]=useState('');const [loading,setLoading]=useState(false);
  const submit=async(e:FormEvent)=>{e.preventDefault();setError('');if(password!==confirm){setError('Passwords do not match.');return}if(!/[A-Za-z]/.test(password)||!/[0-9]/.test(password)){setError('Use at least one letter and one number.');return}if(!accepted){setError('Please accept the Terms and Privacy Notice.');return}if(!supabase){setError(supabaseSetupMessage);return}setLoading(true);const redirectTo=`${window.location.origin}/?auth=confirmed`;const {data,error:authError}=await supabase.auth.signUp({email:email.trim(),password,options:{emailRedirectTo:redirectTo,data:{full_name:name.trim(),onboarding_completed:true}}});setLoading(false);if(authError){setError(readableAuthError(authError));return}setAuthEmail(email.trim());setEmailPurpose('signup');if(data.session&&data.user){onAuthenticated(data.user)}else{go('check-email')}};
  return <AuthShell title="Create your household account" subtitle="Keep every bill and reminder safely tied to your account." go={go}><form className="auth-form compact" onSubmit={submit}>{error&&<div className="auth-error"><AlertTriangle/>{error}</div>}<label>Full name<div className="field-with-icon"><UserRound/><Input value={name} onChange={e=>setName(e.target.value)} autoComplete="name" placeholder="Juan Dela Cruz" required/></div></label><label>Email address<div className="field-with-icon"><Mail/><Input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" placeholder="juan@email.com" required/></div></label><PasswordField value={password} onChange={setPassword} autoComplete="new-password"/><PasswordField value={confirm} onChange={setConfirm} label="Confirm password" autoComplete="new-password"/><div className="password-rules"><span className={password.length>=8?'met':''}><Check/>At least 8 characters</span><span className={/[A-Za-z]/.test(password)&&/\d/.test(password)?'met':''}><Check/>Letters and numbers</span></div><label className="terms-check"><input type="checkbox" checked={accepted} onChange={e=>setAccepted(e.target.checked)}/><span>I agree to the <button type="button">Terms</button> and <button type="button">Privacy Notice</button>.</span></label><Button className="primary-button auth-submit" disabled={loading} type="submit">{loading?<><LoaderCircle className="spin"/>Creating account…</>:<>Create account <ChevronRight/></>}</Button><button className="auth-switch" type="button" onClick={()=>go('login')}>Already have an account? <b>Log in</b></button></form></AuthShell>;
}

function ForgotPasswordScreen({ go, setAuthEmail, setEmailPurpose }: { go:(s:Screen)=>void;setAuthEmail:(email:string)=>void;setEmailPurpose:(purpose:'signup'|'recovery')=>void }) {
  const [email,setEmail]=useState('');const [error,setError]=useState('');const [loading,setLoading]=useState(false);
  const submit=async(e:FormEvent)=>{e.preventDefault();setError('');if(!supabase){setError(supabaseSetupMessage);return}setLoading(true);const {error:authError}=await supabase.auth.resetPasswordForEmail(email.trim(),{redirectTo:`${window.location.origin}/?auth=recovery`});setLoading(false);if(authError){setError(readableAuthError(authError));return}setAuthEmail(email.trim());setEmailPurpose('recovery');go('check-email')};
  return <AuthShell title="Reset your password" subtitle="Enter your email and we’ll send you a secure recovery link." go={go}><form className="auth-form" onSubmit={submit}>{error&&<div className="auth-error"><AlertTriangle/>{error}</div>}<label>Email address<div className="field-with-icon"><Mail/><Input type="email" value={email} onChange={e=>setEmail(e.target.value)} autoComplete="email" placeholder="juan@email.com" required/></div></label><Button className="primary-button auth-submit" disabled={loading} type="submit">{loading?<><LoaderCircle className="spin"/>Sending…</>:<>Send recovery link <Mail/></>}</Button><button className="auth-switch" type="button" onClick={()=>go('login')}><ArrowLeft/> Back to login</button></form></AuthShell>;
}

function CheckEmailScreen({ go, email, purpose }: { go:(s:Screen)=>void;email:string;purpose:'signup'|'recovery' }) {
  const [loading,setLoading]=useState(false);const [message,setMessage]=useState('');
  const resend=async()=>{if(!supabase||!email)return;setLoading(true);setMessage('');const redirectTo=`${window.location.origin}/?auth=${purpose==='signup'?'confirmed':'recovery'}`;const {error}=purpose==='signup'?await supabase.auth.resend({type:'signup',email,options:{emailRedirectTo:redirectTo}}):await supabase.auth.resetPasswordForEmail(email,{redirectTo});setLoading(false);setMessage(error?readableAuthError(error):'A new email is on its way.')};
  return <div className="auth-screen check-email-screen"><header className="auth-header"><span/><BrandLogo compact/><span/></header><div className="email-illustration auth-image-mini"><img src="/assets/bayarin-auth-3d.png" alt="Bayarin account confirmation"/><i><Check/></i></div><div className="auth-copy centered"><span className="auth-kicker">CHECK YOUR INBOX</span><h1>Email sent</h1><p>We sent a secure link to <b>{email||'your email address'}</b>. Open it on this device to continue.</p></div><div className="email-help"><Info/><span>{message||'The link may take a minute to arrive. Check your spam folder too.'}</span></div><Button className="primary-button" onClick={()=>go('login')}>Back to login</Button><button className="auth-switch" onClick={resend} disabled={loading}>{loading?'Sending…':'Resend email'}</button></div>;
}

function ResetPasswordScreen({ go }: { go:(s:Screen)=>void }) {
  const [password,setPassword]=useState('');const [confirm,setConfirm]=useState('');const [error,setError]=useState('');const [loading,setLoading]=useState(false);const [done,setDone]=useState(false);
  const submit=async(e:FormEvent)=>{e.preventDefault();setError('');if(password!==confirm){setError('Passwords do not match.');return}if(!supabase){setError(supabaseSetupMessage);return}setLoading(true);const {error:authError}=await supabase.auth.updateUser({password});setLoading(false);if(authError){setError(readableAuthError(authError));return}setDone(true)};
  if(done)return <div className="auth-screen check-email-screen"><div className="email-illustration auth-image-mini success"><img src="/assets/bayarin-auth-3d.png" alt="Bayarin account secured"/><i><Check/></i></div><div className="auth-copy centered"><span className="auth-kicker">PASSWORD UPDATED</span><h1>You’re all set</h1><p>Your new password is active. You can continue to your household dashboard.</p></div><Button className="primary-button" onClick={()=>go('home')}>Continue to Bayarin <ChevronRight/></Button></div>;
  return <AuthShell title="Create a new password" subtitle="Choose a strong password you haven’t used before." go={go}><form className="auth-form" onSubmit={submit}>{error&&<div className="auth-error"><AlertTriangle/>{error}</div>}<PasswordField value={password} onChange={setPassword} label="New password" autoComplete="new-password"/><PasswordField value={confirm} onChange={setConfirm} label="Confirm new password" autoComplete="new-password"/><Button className="primary-button auth-submit" disabled={loading} type="submit">{loading?<><LoaderCircle className="spin"/>Updating…</>:<>Update password <KeyRound/></>}</Button></form></AuthShell>;
}

function HomeScreen({ go, copy, userName }: { go: (s: Screen) => void; copy: { hello: string; due: string; unpaid: string }; userName:string }) {
  return <>
    <header className="home-header">
      <div className="avatar portrait" aria-hidden="true"><img src="/assets/bayarin-auth-3d.png" alt=""/></div><div className="greeting"><span>{copy.hello}</span><strong>{userName}</strong></div>
      <button className="header-action" onClick={() => go('activity')} aria-label="Activity"><History /></button>
      <button className="header-action notify" onClick={() => go('notifications')} aria-label="Notifications"><Bell /><i /></button>
    </header>
    <ScrollScreen>
      <section className="summary-card">
        <img className="summary-art" src="/assets/bayarin-onboarding-3d.png" alt=""/>
        <div className="summary-kicker"><span>THIS MONTH</span><CalendarDays /></div>
        <div className="summary-main"><div><strong>₱7,591.00</strong><span>{copy.unpaid}</span></div><div className="bill-count"><b>3</b><span>bills remaining</span></div></div>
        <div className="summary-bottom"><div><span>Paid this month</span><b>₱4,850</b></div><div><span>Due soon</span><b>2 bills</b></div><Button className="view-bills" onClick={() => go('bills')}>View bills <ChevronRight /></Button></div>
      </section>
      <div className="calm-alert"><Clock3 /><span><b>{copy.due}</b>Next: Meralco on Sep 8.</span><ChevronRight /></div>
      <button className="story-promo" onClick={()=>go('story')}><span className="story-promo-art"><img src="/assets/bayarin-story-3d.png" alt="Bayarin 3D story preview"/><i><Play/></i></span><span><small>THE BAYARIN STORY</small><b>See calm household organizing in motion.</b></span><ChevronRight/></button>
      <section className="content-section"><div className="section-heading"><h2>Madalas bayaran</h2><button onClick={() => go('bills')}>Tingnan lahat <ChevronRight /></button></div><div className="provider-grid">{providers.map(p => <button className="provider-tile" key={p.name} onClick={() => go('add-bill')}><ProviderMark tone={p.tone} letter={p.mark}/><span>{p.name}</span></button>)}</div></section>
      <section className="content-section"><div className="section-heading"><h2>Mga serbisyo</h2></div><div className="service-grid">{services.map(({label,icon:Icon}) => <button className="service-tile" key={label} onClick={() => label === 'Load' ? go('load') : label === 'Government' ? go('lingkod') : go('add-bill')}><span><Icon /></span><small>{label}</small></button>)}</div></section>
      <section className="content-section upcoming-section"><div className="section-heading"><h2>Mga susunod na bayarin</h2><button onClick={() => go('bills')}>Tingnan lahat <ChevronRight /></button></div>{bills.slice(0,2).map(b => <button className="bill-row" key={b.provider} onClick={() => go('bill-detail')}><ProviderMark tone={b.tone} letter={b.provider[0]}/><div className="bill-copy"><b>{b.provider}</b><span>•••• {b.account} · Due {b.due.replace(', 2026','')}</span></div><div className="bill-value"><b>{b.amount}</b><StatusPill status={b.status}/></div></button>)}</section>
    </ScrollScreen><BottomNav screen="home" go={go}/>
  </>;
}

function BillsScreen({ go, userId }: { go: (s: Screen) => void;userId:string }) {
  const [filter,setFilter] = useState('All');
  const [userBills,setUserBills]=useState(bills);
  useEffect(()=>{if(!supabase||!userId||userId==='demo-user')return;void supabase.from('bills').select('provider,category,account_number,due_date,amount,status').eq('user_id',userId).neq('status','archived').order('due_date').then(({data})=>{if(!data?.length)return;setUserBills(data.map(row=>{const provider=String(row.provider).toUpperCase();const status=String(row.status).split('_').map(word=>word[0].toUpperCase()+word.slice(1)).join(' ');const tone=provider==='MERALCO'?'orange':provider==='MAYNILAD'?'blue':provider==='PLDT'?'red':'indigo';return {provider,category:String(row.category),account:String(row.account_number||'').slice(-4),due:new Intl.DateTimeFormat('en-PH',{month:'short',day:'numeric',year:'numeric'}).format(new Date(`${row.due_date}T00:00:00`)),amount:new Intl.NumberFormat('en-PH',{style:'currency',currency:'PHP'}).format(Number(row.amount)),status,tone}}))})},[userId]);
  const filtered = filter === 'All' ? userBills : userBills.filter(b => b.status === filter);
  return <><AppHeader title="Bills" trailing={<button className="header-action accent" onClick={() => go('add-bill')} aria-label="Add bill"><Plus /></button>}/><ScrollScreen className="with-nav">
    <section className="bill-summary"><span>Still unpaid</span><b>₱7,591.00</b><small>Across 3 remaining bills</small><div><span><i className="amber-dot"/>2 due soon</span><span><i className="red-dot"/>1 overdue</span></div></section>
    <div className="filter-strip">{['All','Due soon','Upcoming','Paid','Overdue'].map(f => <button key={f} className={filter===f?'active':''} onClick={()=>setFilter(f)}>{f}</button>)}</div>
    <div className="bill-list">{filtered.length ? filtered.map(b => <button className="bill-card" key={b.provider} onClick={() => go('bill-detail')}><div className="bill-card-top"><ProviderMark tone={b.tone} letter={b.provider[0]}/><div><b>{b.provider}</b><span>{b.category} · •••• {b.account}</span></div><ChevronRight /></div><div className="bill-card-bottom"><div><span>Due date</span><b>{b.due}</b></div><div className="amount-side"><strong>{b.amount}</strong><StatusPill status={b.status}/></div></div></button>) : <EmptyState go={go}/>}</div>
  </ScrollScreen><BottomNav screen="bills" go={go}/></>;
}

function BillDetail({ go, setPayOpen }: { go:(s:Screen)=>void; setPayOpen:(v:boolean)=>void }) {
  return <><AppHeader title="Bill details" onBack={() => go('bills')} trailing={<button className="header-action" onClick={() => go('edit-bill')} aria-label="Edit bill"><Pencil /></button>}/><ScrollScreen>
    <section className="provider-hero"><ProviderMark tone="orange" letter="M"/><div><h2>MERALCO</h2><p>Electricity · Bahay</p></div><StatusPill status="Due soon"/></section>
    <section className="detail-card account-card"><div><span>Account number</span><b>1234 5678 9012</b></div><button><Copy/> Copy</button></section>
    <section className="detail-card detail-list"><div><span>Bill amount</span><b className="large-amount">₱2,450.36</b></div><div><span>Due date</span><b>Sep 8, 2026</b></div><div><span>Billing period</span><b>Aug 10 – Sep 10, 2026</b></div><div><span>Status</span><StatusPill status="Due soon"/></div></section>
    <section className="detail-card reminder-row"><div><span className="icon-soft"><Bell/></span><span><b>Payment reminder</b><small>3 days before · 9:00 AM</small></span></div><Switch defaultChecked aria-label="Payment reminder"/></section>
    <div className="detail-actions"><Button className="primary-button" onClick={()=>setPayOpen(true)}>Pay outside Bayarin <ArrowUpRight/></Button><Button variant="outline" className="secondary-button" onClick={()=>go('mark-paid')}><Check/> Mark as paid</Button></div>
    <p className="legal-inline"><Info/> Bayarin records your status only. Payments happen outside the app.</p>
    <div className="text-actions"><button onClick={()=>go('edit-bill')}>Edit</button><button>Archive</button></div>
  </ScrollScreen></>;
}

function BillForm({ go, userId, edit = false }: { go:(s:Screen)=>void;userId:string;edit?:boolean }) {
  const [saving,setSaving]=useState(false);const [error,setError]=useState('');
  const save=async(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();setError('');if(userId==='demo-user'){go('bills');return}if(!supabase){setError(supabaseSetupMessage);return}setSaving(true);const values=new FormData(e.currentTarget);const payload={user_id:userId,provider:'MERALCO',category:'Electricity',account_number:String(values.get('account')||''),alias:String(values.get('alias')||''),amount:Number(values.get('amount')||0),due_date:String(values.get('due_date')||''),billing_period:String(values.get('billing_period')||''),recurrence:'monthly',reminder_days:3,status:'upcoming'};let authError;if(edit){const {data:existing}=await supabase.from('bills').select('id').eq('user_id',userId).eq('provider','MERALCO').limit(1).maybeSingle();if(existing){({error:authError}=await supabase.from('bills').update(payload).eq('id',existing.id).eq('user_id',userId))}else{({error:authError}=await supabase.from('bills').insert(payload))}}else{({error:authError}=await supabase.from('bills').insert(payload))}setSaving(false);if(authError){setError(authError.message);return}await supabase.from('activity_events').insert({user_id:userId,event_type:edit?'bill_updated':'bill_added',title:edit?'Meralco bill updated':'Meralco bill added',amount:payload.amount});go('bills')};
  return <><AppHeader title={edit?'Edit bill':'Add bill'} onBack={() => go(edit?'bill-detail':'bills')}/><ScrollScreen>
    <div className="form-intro"><span className="form-icon"><ReceiptText/></span><div><h2>{edit?'Update bill details':'Track a household bill'}</h2><p>Bayarin will remind you before it’s due.</p></div></div>
    <form className="form-card" onSubmit={save}>{error&&<div className="auth-error"><AlertTriangle/>{error}</div>}
      <label>Provider<div className="provider-input"><ProviderMark tone="orange" letter="M"/><span>MERALCO</span><ChevronRight/></div></label>
      <label>Account number<Input name="account" defaultValue="1234 5678 9012" required /></label><label>Alias <span>(optional)</span><Input name="alias" defaultValue="Bahay" /></label>
      <div className="form-split"><label>Bill amount<Input name="amount" type="number" step="0.01" min="0" defaultValue="2450.36" required /></label><label>Due date<Input name="due_date" type="date" defaultValue="2026-09-08" required /></label></div>
      <label>Billing period <span>(optional)</span><Input name="billing_period" defaultValue="Aug 10 – Sep 10, 2026" /></label>
      <div className="form-split"><label>Repeat<div className="fake-select">Monthly <ChevronRight/></div></label><label>Reminder<div className="fake-select">3 days before <ChevronRight/></div></label></div>
      <Button className="primary-button" type="submit" disabled={saving}>{saving?<><LoaderCircle className="spin"/>Saving…</>:<>{edit?'Save changes':'Save bill'} <Check/></>}</Button>
    </form>
  </ScrollScreen></>;
}

function MarkPaid({ go, userId }: { go:(s:Screen)=>void;userId:string }) {
  const [saving,setSaving]=useState(false);const [error,setError]=useState('');
  const save=async(e:FormEvent<HTMLFormElement>)=>{e.preventDefault();setError('');if(userId==='demo-user'){go('success');return}if(!supabase){setError(supabaseSetupMessage);return}setSaving(true);const values=new FormData(e.currentTarget);const {data:bill,error:lookupError}=await supabase.from('bills').select('id').eq('user_id',userId).eq('provider','MERALCO').limit(1).maybeSingle();if(lookupError||!bill){setSaving(false);setError(lookupError?.message||'Add the Meralco bill before recording it as paid.');return}const {error:updateError}=await supabase.from('bills').update({status:'paid',paid_at:new Date().toISOString(),payment_method:String(values.get('method')||'GCash'),reference_number:String(values.get('reference')||'')}).eq('id',bill.id).eq('user_id',userId);if(!updateError)await supabase.from('activity_events').insert({user_id:userId,bill_id:bill.id,event_type:'bill_marked_paid',title:'Meralco marked paid',amount:2450.36});setSaving(false);if(updateError){setError(updateError.message);return}go('success')};
  return <><AppHeader title="Mark as paid" onBack={()=>go('bill-detail')}/><ScrollScreen><div className="mark-summary"><ProviderMark tone="orange" letter="M"/><div><b>MERALCO</b><span>Bill amount</span></div><strong>₱2,450.36</strong></div>
    <form className="form-card" onSubmit={save}>{error&&<div className="auth-error"><AlertTriangle/>{error}</div>}<label>Amount<Input defaultValue="₱ 2,450.36" readOnly/></label><label>Date paid<Input type="date" defaultValue="2026-09-02"/></label><label>Payment method<select className="fake-select" name="method" defaultValue="GCash"><option>GCash</option><option>Maya</option><option>Bank</option><option>Cash</option></select></label><label>Reference number <span>(optional)</span><Input name="reference" placeholder="Enter reference number"/></label><label>Receipt <span>(optional)</span><button type="button" className="upload-zone"><Upload/><b>Attach a receipt</b><span>JPG, PNG or PDF</span></button></label><Button className="primary-button" type="submit" disabled={saving}>{saving?<><LoaderCircle className="spin"/>Recording…</>:<>Confirm paid <Check/></>}</Button></form><p className="legal-inline"><Info/> You’re recording a payment completed outside Bayarin.</p>
  </ScrollScreen></>;
}

function Success({ go }: { go:(s:Screen)=>void }) {
  return <div className="success-screen"><div className="success-visual"><img src="/assets/bayarin-onboarding-3d.png" alt="3D Bayarin calendar and security shield"/><div className="success-check"><Check/></div></div><span className="eyebrow">HOUSEHOLD ACTIVITY UPDATED</span><h1>Recorded as paid</h1><p>Your Meralco bill is now up to date.</p><section><span>Amount paid</span><strong>₱2,450.36</strong><div><span>Paid to</span><b>MERALCO</b></div><div><span>Date paid</span><b>Sep 2, 2026</b></div><div><span>Method</span><b>GCash</b></div></section><div className="success-actions"><Button variant="outline" className="secondary-button" onClick={()=>go('bill-detail')}>View bill</Button><Button className="primary-button" onClick={()=>go('home')}>Back to Home <Home/></Button></div></div>;
}

function ActivityScreen({ go }: { go:(s:Screen)=>void }) {
  const items = [
    ['M','orange','MERALCO','Marked paid','Sep 2 · 9:41 AM','₱2,450.36','Paid'],
    ['W','blue','MAYNILAD','Bill added','Sep 1 · 8:15 AM','₱598.00','Upcoming'],
    ['G','indigo','GLOBE','Reminder updated','Aug 30 · 7:22 PM','₱599.00','Due soon'],
  ];
  return <><AppHeader title="Activity" onBack={()=>go('home')}/><ScrollScreen><div className="filter-strip"><button className="active">All</button><button>Bills</button><button>Load</button><button>Lingkod</button></div><h3 className="month-title">September 2026</h3><section className="activity-card">{items.map(i=><div className="activity-row" key={i[2]}><ProviderMark tone={i[1]} letter={i[0]}/><div><b>{i[2]}</b><span>{i[3]}</span><small>{i[4]}</small></div><div><strong>{i[5]}</strong><StatusPill status={i[6]}/></div></div>)}</section><h3 className="month-title">August 2026</h3><section className="activity-card"><div className="activity-row"><ProviderMark tone="red" letter="P"/><div><b>PLDT</b><span>Bill added</span><small>Aug 28 · 9:10 AM</small></div><div><strong>₱1,699.00</strong><StatusPill status="Overdue"/></div></div></section></ScrollScreen></>;
}

function MarketingStory({ go }: { go:(s:Screen)=>void }) {
  const videoRef=useRef<HTMLVideoElement|null>(null);const [playing,setPlaying]=useState(true);
  const toggle=()=>{const video=videoRef.current;if(!video)return;if(video.paused){void video.play();setPlaying(true)}else{video.pause();setPlaying(false)}};
  return <><AppHeader title="Bayarin story" onBack={()=>go('home')} trailing={<button className="header-action accent" onClick={toggle} aria-label={playing?'Pause story':'Play story'}>{playing?<Pause/>:<Play/>}</button>}/><ScrollScreen className="with-nav story-screen">
    <section className="story-stage"><video ref={videoRef} autoPlay muted loop playsInline poster="/assets/bayarin-story-3d.png"><source src="/assets/bayarin-story.mp4" type="video/mp4"/></video><div className="story-vignette"/><div className="story-live-logo"><BrandLogo inverted/></div><div className="story-copy"><span><Sparkles/> A calmer household starts here</span><h2>Every due date.<br/>One beautiful rhythm.</h2><p>Organize bills, get timely reminders, and record payments—without turning Bayarin into a wallet.</p><button onClick={toggle}>{playing?<Pause/>:<Play/>}{playing?'Pause film':'Play film'}</button></div><div className="story-progress"><i/><span>00:10</span></div></section>
    <section className="story-metrics"><div><strong>1</strong><span>calm home view</span></div><div><strong>3d</strong><span>gentle reminder</span></div><div><strong>0</strong><span>payments processed</span></div></section>
    <section className="story-scenes"><span className="eyebrow">CAMPAIGN STORYBOARD</span><h2>From kalat to calm—in three moments.</h2><div><article><i>01</i><span><b>See everything</b><small>Household bills and deadlines come into focus.</small></span></article><article><i>02</i><span><b>Remember early</b><small>Gentle reminders arrive before the rush.</small></span></article><article><i>03</i><span><b>Feel panatag</b><small>Record what is done and move on with your day.</small></span></article></div></section>
    <section className="story-cta"><img src="/assets/bayarin-onboarding-3d.png" alt="3D Bayarin calendar and shield"/><span><small>READY WHEN YOU ARE</small><b>Make space for what matters at home.</b><Button className="primary-button" onClick={()=>go('onboarding')}>Start organizing <ChevronRight/></Button></span></section>
  </ScrollScreen><BottomNav screen="story" go={go}/></>;
}

function LoadScreen({ go }: { go:(s:Screen)=>void }) {
  const loads=[['S','green','SMART','0919 ••• 4821','Sep 7','₱299'],['G','indigo','GLOBE','0917 ••• 2068','Sep 15','₱99'],['D','red','DITO','0991 ••• 1830','Sep 20','₱199']];
  return <><AppHeader title="Load reminders" trailing={<button className="header-action accent"><Plus/></button>}/><ScrollScreen className="with-nav"><div className="page-lead"><span className="lead-icon"><Smartphone/></span><div><h2>Stay connected</h2><p>Track when the family may need load next.</p></div></div><div className="info-banner"><Info/><span>Bayarin tracks reminders only. Load is purchased in your provider or payment app.</span></div><div className="stack-list">{loads.map(l=><button className="load-card" key={l[2]} onClick={()=>go('load-detail')}><ProviderMark tone={l[1]} letter={l[0]}/><div className="load-title"><b>{l[2]}</b><span>{l[3]}</span></div><div className="load-meta"><span>Next reminder</span><b>{l[4]}</b></div><div className="load-meta"><span>Typical</span><b>{l[5]}</b></div><ChevronRight/></button>)}</div></ScrollScreen><BottomNav screen="load" go={go}/></>;
}

function LoadDetail({ go }: { go:(s:Screen)=>void }) {
  return <><AppHeader title="Load details" onBack={()=>go('load')} trailing={<button className="header-action"><Pencil/></button>}/><ScrollScreen><section className="provider-hero"><ProviderMark tone="green" letter="S"/><div><h2>SMART</h2><p>0919 ••• 4821 · Nanay</p></div></section><section className="detail-card detail-list"><div><span>Next load reminder</span><b>Sep 7, 2026</b></div><div><span>Typical amount</span><b>₱299</b></div><div><span>Repeats</span><b>Every 30 days</b></div></section><section className="detail-card reminder-row"><div><span className="icon-soft"><Bell/></span><span><b>Remind me</b><small>Sep 7 at 9:00 AM</small></span></div><Switch defaultChecked/></section><div className="detail-actions"><Button className="primary-button">Open provider / payment app <ArrowUpRight/></Button><Button variant="outline" className="secondary-button">Mark reminder done <Check/></Button></div><p className="legal-inline"><Info/> You’ll purchase load outside Bayarin.</p></ScrollScreen></>;
}

function LingkodScreen({ go }: { go:(s:Screen)=>void }) {
  const gov=[['S','SSS Contribution','Sep 10','₱1,400','Upcoming'],['P','PhilHealth','Sep 18','₱500','Upcoming'],['L','LTO Registration','Oct 4','₱2,100','Draft']];
  return <><AppHeader title="Lingkod" trailing={<button className="header-action accent"><Plus/></button>}/><ScrollScreen className="with-nav"><div className="page-lead"><span className="lead-icon gov"><Landmark/></span><div><h2>Public-service deadlines</h2><p>Keep dates and obligations in one place.</p></div></div><div className="info-banner"><Info/><span>Bayarin tracks dates only. Transactions happen on official apps and websites. Bayarin is not a government service.</span></div><div className="stack-list">{gov.map(g=><button className="gov-card" key={g[1]} onClick={()=>go('government-detail')}><span className="gov-mark">{g[0]}</span><div><b>{g[1]}</b><span>Due {g[2]}</span></div><div><strong>{g[3]}</strong><StatusPill status={g[4]}/></div><ChevronRight/></button>)}</div></ScrollScreen><BottomNav screen="lingkod" go={go}/></>;
}

function GovernmentDetail({ go }: { go:(s:Screen)=>void }) {
  return <><AppHeader title="Lingkod details" onBack={()=>go('lingkod')} trailing={<button className="header-action"><Pencil/></button>}/><ScrollScreen><section className="provider-hero neutral"><span className="gov-mark large">S</span><div><h2>SSS Contribution</h2><p>Monthly contribution reminder</p></div><StatusPill status="Upcoming"/></section><section className="detail-card detail-list"><div><span>Amount to prepare</span><b className="large-amount">₱1,400</b></div><div><span>Due date</span><b>Sep 10, 2026</b></div><div><span>Reference</span><b>SS Number •••• 2814</b></div></section><section className="detail-card reminder-row"><div><span className="icon-soft"><Bell/></span><span><b>Deadline reminder</b><small>5 days before · 9:00 AM</small></span></div><Switch defaultChecked/></section><div className="detail-actions"><Button className="primary-button">Open official SSS site <ArrowUpRight/></Button><Button variant="outline" className="secondary-button"><Check/> Mark as completed</Button></div><p className="legal-inline"><ShieldCheck/> Always verify that you’re on the official SSS website before signing in.</p></ScrollScreen></>;
}

function Notifications({ go }: { go:(s:Screen)=>void }) {
  return <><AppHeader title="Notifications" onBack={()=>go('home')} trailing={<button className="text-button">Mark all read</button>}/><ScrollScreen><div className="notification-group"><h3>Today</h3><button className="notification unread" onClick={()=>go('bill-detail')}><span className="note-icon amber"><Clock3/></span><div><b>Meralco is due in 6 days</b><p>₱2,450.36 · Sep 8</p><small>9:00 AM</small></div><i/></button><button className="notification unread" onClick={()=>go('government-detail')}><span className="note-icon green"><Landmark/></span><div><b>SSS contribution is due Sep 10</b><p>Review the details before visiting the official site.</p><small>8:30 AM</small></div><i/></button></div><div className="notification-group"><h3>Yesterday</h3><button className="notification"><span className="note-icon neutral"><Smartphone/></span><div><b>Globe load reminder is tomorrow</b><p>Typical amount · ₱99</p><small>Sep 1</small></div></button></div></ScrollScreen></>;
}

function SettingsScreen({ go, dark, lang, userName, email, onLogout }: { go:(s:Screen)=>void; dark:boolean; lang:Lang;userName:string;email:string;onLogout:()=>void }) {
  return <><AppHeader title="Settings"/><ScrollScreen className="with-nav"><section className="profile-card"><div className="avatar large portrait"><img src="/assets/bayarin-auth-3d.png" alt=""/></div><div><b>{userName}</b><span>{email}</span></div><button aria-label="Edit profile"><Pencil/></button></section><SettingsGroup title="Experience"><Setting icon={<Film/>} label="Bayarin story" value="AI motion film" onClick={()=>go('story')}/></SettingsGroup><SettingsGroup title="Preferences"><Setting icon={<Languages/>} label="Language" value={lang} onClick={()=>go('language')}/><Setting icon={dark?<Moon/>:<Sun/>} label="Appearance" value={dark?'Dark':'Light'} onClick={()=>go('appearance')}/><Setting icon={<Bell/>} label="Notifications" value="On" onClick={()=>go('notifications')}/></SettingsGroup><SettingsGroup title="Your data"><Setting icon={<ShieldCheck/>} label="Privacy & security" value="Supabase RLS" onClick={()=>go('privacy')}/><Setting icon={<History/>} label="Household activity" onClick={()=>go('activity')}/></SettingsGroup><SettingsGroup title="Preview states"><Setting icon={<WifiOff/>} label="Offline state" onClick={()=>go('offline')}/><Setting icon={<CircleHelp/>} label="Empty & error states" onClick={()=>go('empty')}/></SettingsGroup><button className="logout-button" onClick={onLogout}><LogOut/> Log out</button><section className="settings-note"><BrandLogo/><div><span>Version 2.0 · Made for Filipino households</span></div></section></ScrollScreen><BottomNav screen="settings" go={go}/></>;
}

function SettingsGroup({ title, children }: { title:string; children:ReactNode }) { return <section className="settings-group"><h3>{title}</h3><div>{children}</div></section>; }
function Setting({ icon, label, value, onClick }: { icon:ReactNode;label:string;value?:string;onClick?:()=>void }) { return <button className="setting-row" onClick={onClick}><span className="setting-icon">{icon}</span><b>{label}</b>{value&&<span>{value}</span>}<ChevronRight/></button>; }

function LanguageScreen({ go, lang, setLang }: { go:(s:Screen)=>void;lang:Lang;setLang:(l:Lang)=>void }) {
  return <><AppHeader title="Language" onBack={()=>go('settings')}/><ScrollScreen><div className="page-copy"><h2>Choose your language</h2><p>You can change this anytime.</p></div><section className="choice-card">{(['English','Filipino','Cebuano'] as Lang[]).map(l=><button key={l} onClick={()=>setLang(l)}><div><b>{l}</b><span>{l==='English'?'2 bills are due soon.':l==='Filipino'?'2 bayarin ang malapit nang mag-due.':'2 ka bayranan ang hapit na ang due date.'}</span></div><i className={lang===l?'selected':''}>{lang===l&&<Check/>}</i></button>)}</section><Button className="primary-button sticky-cta" onClick={()=>go('settings')}>Save language</Button></ScrollScreen></>;
}

function AppearanceScreen({ go, dark, setDark }: { go:(s:Screen)=>void;dark:boolean;setDark:(v:boolean)=>void }) {
  return <><AppHeader title="Appearance" onBack={()=>go('settings')}/><ScrollScreen><div className="page-copy"><h2>Make it comfortable</h2><p>Choose a theme that feels right at home.</p></div><section className="theme-grid"><button className={!dark?'selected':''} onClick={()=>setDark(false)}><div className="theme-preview light"><i/><i/><i/></div><span><Sun/>Light</span>{!dark&&<CheckCircle2/>}</button><button className={dark?'selected':''} onClick={()=>setDark(true)}><div className="theme-preview dark"><i/><i/><i/></div><span><Moon/>Dark</span>{dark&&<CheckCircle2/>}</button></section><section className="detail-card reminder-row"><div><span className="icon-soft"><Moon/></span><span><b>Use dark mode</b><small>Warm, low-glare surfaces</small></span></div><Switch checked={dark} onCheckedChange={setDark}/></section></ScrollScreen></>;
}

function PrivacyScreen({ go }: { go:(s:Screen)=>void }) {
  return <><AppHeader title="Privacy" onBack={()=>go('settings')}/><ScrollScreen><div className="privacy-hero"><ShieldCheck/><h2>Your household data belongs to you.</h2><p>Your account and records are protected by Supabase authentication and row-level security.</p></div><section className="privacy-list"><div><Check/><span><b>Private account records</b>Only your signed-in account can read or change its bills, preferences, and activity.</span></div><div><X/><span><b>What Bayarin never asks for</b>Wallet passwords, OTPs, PINs, card numbers, CVVs, or government passwords.</span></div><div><ArrowUpRight/><span><b>Payments stay external</b>Transactions happen through external wallets, banks, billers, or official websites.</span></div></section><div className="legal-card">Bayarin is not a bank, e-money issuer, payment processor, or government service.</div></ScrollScreen></>;
}

function EmptyState({ go }: { go:(s:Screen)=>void }) { return <div className="empty-state"><div><CheckCircle2/></div><h2>All caught up</h2><p>Walang due ngayong linggo.</p><Button className="primary-button" onClick={()=>go('add-bill')}><Plus/> Add a bill</Button></div>; }

function StateScreen({ kind, go }: { kind:'offline'|'empty'|'error';go:(s:Screen)=>void }) {
  const data = kind==='offline'?{icon:<WifiOff/>,title:'You’re offline',body:'Your saved bills are still available. Changes will stay on this device.',action:'Try again'}:kind==='error'?{icon:<AlertTriangle/>,title:'Something went wrong',body:'We couldn’t open that bill. Your saved information is safe.',action:'Try again'}:{icon:<CheckCircle2/>,title:'All caught up',body:'Walang due ngayong linggo.',action:'Add a bill'};
  return <><AppHeader title={kind==='offline'?'Offline':'Bills'} onBack={()=>go('settings')}/><div className={`state-screen ${kind}`}><span>{data.icon}</span><h2>{data.title}</h2><p>{data.body}</p><Button className="primary-button" onClick={()=>kind==='empty'?go('add-bill'):kind==='error'?go('bill-detail'):go('home')}>{kind!=='empty'&&<RefreshCw/>}{kind==='empty'&&<Plus/>}{data.action}</Button>{kind!=='empty'&&<button onClick={()=>go('home')}>Back to Home</button>}{kind==='empty'&&<button onClick={()=>go('error')}>Preview error state</button>}</div></>;
}

function PaySheet({ open, setOpen, onLeave }: { open:boolean;setOpen:(v:boolean)=>void;onLeave:()=>void }) {
  const choose=()=>{setOpen(false);onLeave()};
  return <Sheet open={open} onOpenChange={setOpen}><SheetContent side="bottom" className="pay-sheet"><SheetHeader><span className="sheet-handle"/><SheetTitle>Pay outside Bayarin</SheetTitle><SheetDescription>Bayarin does not process payments. Choose where you want to continue.</SheetDescription></SheetHeader><div className="sheet-bill"><ProviderMark tone="orange" letter="M"/><div><b>MERALCO</b><span>Account •••• 9012</span></div><strong>₱2,450.36</strong></div><div className="external-options"><button onClick={choose}><span className="external-icon gcash">G</span><b>Open GCash</b><ArrowUpRight/></button><button onClick={choose}><span className="external-icon maya">M</span><b>Open Maya</b><ArrowUpRight/></button><button onClick={choose}><span className="external-icon web"><Globe2/></span><b>Open biller’s website</b><ArrowUpRight/></button><button><span className="external-icon copy"><Copy/></span><b>Copy payment details</b><Check/></button></div><SheetFooter><p><ShieldCheck/> You’ll complete the payment outside Bayarin.</p></SheetFooter></SheetContent></Sheet>;
}

function ReturnPrompt({ open, close, paid }: { open:boolean;close:()=>void;paid:()=>void }) {
  return <Sheet open={open} onOpenChange={v=>!v&&close()}><SheetContent side="bottom" className="pay-sheet return-sheet"><SheetHeader><span className="sheet-handle"/><SheetTitle>Did you finish paying?</SheetTitle><SheetDescription>Opening another app doesn’t confirm a payment.</SheetDescription></SheetHeader><div className="sheet-bill"><ProviderMark tone="orange" letter="M"/><div><b>MERALCO</b><span>Account •••• 9012</span></div><strong>₱2,450.36</strong></div><SheetFooter><Button className="primary-button" onClick={paid}><Check/> Yes, mark as paid</Button><Button variant="outline" className="secondary-button" onClick={close}>Not yet</Button></SheetFooter></SheetContent></Sheet>;
}

export default function BayarinApp() {
  const [screen, setScreen] = useState<Screen>('welcome');
  const [dark,setDark] = useState(false);
  const [lang,setLang] = useState<Lang>('English');
  const [payOpen,setPayOpen] = useState(false);
  const [returnOpen,setReturnOpen] = useState(false);
  const [session,setSession] = useState<Session|null>(null);
  const [demoMode,setDemoMode] = useState(false);
  const [authReady,setAuthReady] = useState(!isSupabaseConfigured);
  const [profileReady,setProfileReady] = useState(false);
  const [userName,setUserName] = useState('Juan Dela Cruz');
  const [authEmail,setAuthEmail] = useState('');
  const [emailPurpose,setEmailPurpose] = useState<'signup'|'recovery'>('signup');

  useEffect(()=>{document.documentElement.classList.toggle('dark',dark)},[dark]);
  useEffect(()=>{
    if(!supabase)return;
    let active=true;
    const hydrate=async(nextSession:Session|null,event?:string)=>{
      if(!active)return;
      setSession(nextSession);
      if(!nextSession){setProfileReady(false);setAuthReady(true);if(event==='SIGNED_OUT')setScreen('welcome');return}
      const fallbackName=String(nextSession.user.user_metadata?.full_name||nextSession.user.email?.split('@')[0]||'Home organizer');
      setUserName(fallbackName);setAuthEmail(nextSession.user.email||'');
      const {data}=await supabase.from('profiles').select('full_name,onboarding_completed,preferred_language,appearance').eq('id',nextSession.user.id).maybeSingle();
      if(!active)return;
      if(data){setUserName(data.full_name||fallbackName);if(['English','Filipino','Cebuano'].includes(data.preferred_language))setLang(data.preferred_language as Lang);setDark(data.appearance==='dark');}
      setProfileReady(true);setAuthReady(true);
      if(event==='PASSWORD_RECOVERY'){setScreen('reset-password');return}
      if(data?.onboarding_completed===false)setScreen('onboarding');else setScreen('home');
    };
    const {data:listener}=supabase.auth.onAuthStateChange((event,nextSession)=>{void hydrate(nextSession,event)});
    void supabase.auth.getSession().then(({data})=>hydrate(data.session,'INITIAL_SESSION'));
    return()=>{active=false;listener.subscription.unsubscribe()};
  },[]);
  useEffect(()=>{
    if(!supabase||!session||!profileReady)return;
    const timer=window.setTimeout(()=>{void supabase.from('profiles').update({preferred_language:lang,appearance:dark?'dark':'light'}).eq('id',session.user.id)},250);
    return()=>window.clearTimeout(timer);
  },[dark,lang,profileReady,session]);
  useEffect(()=>{
    const context=document.modelContext;if(!context?.registerTool)return;
    const lifecycle=new AbortController();
    const register=(tool:ModelTool)=>{try{void Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>undefined)}catch{/* unsupported implementation */}};
    register({name:'start_bill_creation',title:'Add a bill',description:'Open the visible form to start tracking a new household bill. This does not make a payment.',inputSchema:{type:'object',properties:{provider:{type:'string'}},additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:()=>{setScreen('add-bill');return {status:'form_opened',paymentInitiated:false}}});
    register({name:'start_recording_bill_paid',title:'Record a bill as paid',description:'Open the visible form for manually recording a payment completed outside Bayarin.',inputSchema:{type:'object',properties:{provider:{type:'string'},amount:{type:'number'}},required:['provider'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:(input)=>{if(!input||typeof input!=='object'||typeof (input as {provider?:unknown}).provider!=='string')throw new Error('provider is required');setScreen('mark-paid');return {status:'form_opened',paymentConfirmed:false}}});
    return()=>lifecycle.abort();
  },[]);

  const handleAuthenticated=async(user:User)=>{
    if(!supabase)return;
    const {data}=await supabase.auth.getSession();
    setSession(data.session);setUserName(String(user.user_metadata?.full_name||user.email?.split('@')[0]||'Home organizer'));setAuthEmail(user.email||'');setScreen('home');
  };
  const handleDemoAuthenticated=()=>{setDemoMode(true);setUserName('Juan Dela Cruz');setAuthEmail(DEMO_EMAIL);setProfileReady(true);setScreen('home')};
  const completeOnboarding=async()=>{
    if(demoMode){setScreen('home');return}if(!supabase||!session){setScreen('signup');return}
    await supabase.from('profiles').update({onboarding_completed:true}).eq('id',session.user.id);setScreen('home');
  };
  const logout=async()=>{if(supabase&&!demoMode)await supabase.auth.signOut();setDemoMode(false);setSession(null);setProfileReady(false);setScreen('welcome')};

  if(!authReady)return <main className="app-canvas"><section className="phone-shell auth-loading" aria-label="Loading Bayarin"><div className="status-bar"><span>9:41</span><span className="device-icons">● ◔ ▰</span></div><BrandMark/><LoaderCircle className="spin"/><p>Opening your household…</p></section></main>;

  const protectedScreens:Screen[]=['home','bills','bill-detail','add-bill','edit-bill','mark-paid','success','activity','load','load-detail','lingkod','government-detail','notifications','settings','language','appearance','privacy','offline','empty','error'];
  const visibleScreen=!session&&!demoMode&&protectedScreens.includes(screen)?'login':screen;

  let content:ReactNode;
  switch(visibleScreen){
    case 'welcome':content=<Welcome go={setScreen}/>;break;case 'onboarding':content=<Onboarding go={setScreen} finish={session||demoMode?completeOnboarding:undefined}/>;break;
    case 'login':content=<LoginScreen go={setScreen} onAuthenticated={handleAuthenticated} onDemoAuthenticated={handleDemoAuthenticated}/>;break;case 'signup':content=<SignupScreen go={setScreen} setAuthEmail={setAuthEmail} setEmailPurpose={setEmailPurpose} onAuthenticated={handleAuthenticated}/>;break;
    case 'forgot-password':content=<ForgotPasswordScreen go={setScreen} setAuthEmail={setAuthEmail} setEmailPurpose={setEmailPurpose}/>;break;case 'check-email':content=<CheckEmailScreen go={setScreen} email={authEmail} purpose={emailPurpose}/>;break;case 'reset-password':content=<ResetPasswordScreen go={setScreen}/>;break;
    case 'home':content=<HomeScreen go={setScreen} copy={languages[lang]} userName={userName}/>;break;case 'bills':content=<BillsScreen go={setScreen} userId={session?.user.id||(demoMode?'demo-user':'')}/>;break;
    case 'bill-detail':content=<BillDetail go={setScreen} setPayOpen={setPayOpen}/>;break;case 'add-bill':content=<BillForm go={setScreen} userId={session?.user.id||(demoMode?'demo-user':'')}/>;break;case 'edit-bill':content=<BillForm go={setScreen} userId={session?.user.id||(demoMode?'demo-user':'')} edit/>;break;
    case 'mark-paid':content=<MarkPaid go={setScreen} userId={session?.user.id||(demoMode?'demo-user':'')}/>;break;case 'success':content=<Success go={setScreen}/>;break;case 'activity':content=<ActivityScreen go={setScreen}/>;break;case 'story':content=<MarketingStory go={setScreen}/>;break;
    case 'load':content=<LoadScreen go={setScreen}/>;break;case 'load-detail':content=<LoadDetail go={setScreen}/>;break;case 'lingkod':content=<LingkodScreen go={setScreen}/>;break;case 'government-detail':content=<GovernmentDetail go={setScreen}/>;break;
    case 'notifications':content=<Notifications go={setScreen}/>;break;case 'settings':content=<SettingsScreen go={setScreen} dark={dark} lang={lang} userName={userName} email={session?.user.email||authEmail} onLogout={logout}/>;break;case 'language':content=<LanguageScreen go={setScreen} lang={lang} setLang={setLang}/>;break;case 'appearance':content=<AppearanceScreen go={setScreen} dark={dark} setDark={setDark}/>;break;case 'privacy':content=<PrivacyScreen go={setScreen}/>;break;
    case 'offline':content=<StateScreen kind="offline" go={setScreen}/>;break;case 'empty':content=<StateScreen kind="empty" go={setScreen}/>;break;case 'error':content=<StateScreen kind="error" go={setScreen}/>;break;
  }
  return <main className="app-canvas"><section className="phone-shell" aria-label="Bayarin mobile application"><div className="status-bar"><span>9:41</span><span className="device-icons">● ◔ ▰</span></div>{content}<PaySheet open={payOpen} setOpen={setPayOpen} onLeave={()=>setReturnOpen(true)}/><ReturnPrompt open={returnOpen} close={()=>setReturnOpen(false)} paid={()=>{setReturnOpen(false);setScreen('mark-paid')}}/></section></main>;
}
