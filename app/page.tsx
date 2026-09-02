'use client';

import { useEffect, useState, type ReactNode } from 'react';
import {
  AlertTriangle, ArrowLeft, ArrowUpRight, Bell, CalendarDays, Check,
  CheckCircle2, ChevronRight, CircleHelp, Clock3, Copy, CreditCard,
  Droplets, FileText, Globe2, History, Home, Image as ImageIcon, Info,
  Landmark, Languages, Moon, MoreHorizontal, Pencil, Plus, ReceiptText,
  RefreshCw, Router, Settings, ShieldCheck, Smartphone, Sun, Tv, Upload,
  UserRound, WifiOff, X, Zap,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  Sheet, SheetContent, SheetDescription, SheetFooter, SheetHeader, SheetTitle,
} from '@/components/ui/sheet';

type Screen =
  | 'welcome' | 'onboarding' | 'home' | 'bills' | 'bill-detail' | 'add-bill'
  | 'edit-bill' | 'mark-paid' | 'success' | 'activity' | 'load' | 'load-detail'
  | 'lingkod' | 'government-detail' | 'notifications' | 'settings' | 'language'
  | 'appearance' | 'privacy' | 'offline' | 'empty' | 'error';

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

function BrandMark({ small = false }: { small?: boolean }) {
  return <span className={small ? 'brand-mark small' : 'brand-mark'} aria-label="Bayarin B">B</span>;
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
      <h1>{title}</h1>
      {trailing ?? <span className="header-spacer" />}
    </header>
  );
}

function BottomNav({ screen, go }: { screen: Screen; go: (s: Screen) => void }) {
  const items: { key: Screen; label: string; icon: typeof Home }[] = [
    { key: 'home', label: 'Home', icon: Home }, { key: 'bills', label: 'Bills', icon: ReceiptText },
    { key: 'load', label: 'Load', icon: Smartphone }, { key: 'lingkod', label: 'Lingkod', icon: Landmark },
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
    <div className="welcome-brand"><BrandMark /><h1>Bayarin</h1><p>Bayad. Organisado. Panatag.</p><span>Para sa bawat tahanang Pilipino.</span></div>
    <div className="home-silhouette" aria-hidden="true"><span /><span /><span /><i /></div>
    <div className="welcome-actions"><Button onClick={() => go('onboarding')} className="primary-button light">Magsimula <ChevronRight /></Button><button className="login-link" onClick={() => go('home')}>May account na? <b>Mag-login</b></button></div>
  </div>;
}

function Onboarding({ go }: { go: (s: Screen) => void }) {
  return <div className="onboarding-screen">
    <div className="onboarding-visual"><div className="mini-calendar"><span>SEPTEMBER</span><b>08</b><i><Check /></i></div><span className="float-card bill"><Zap /> MERALCO</span><span className="float-card shield"><ShieldCheck /></span></div>
    <div className="onboarding-copy"><span className="eyebrow">YOUR HOUSEHOLD, IN SYNC</span><h1>Never miss what matters at home.</h1><p>Track bills, load reminders, and government deadlines in one calm, private place.</p><div className="privacy-note"><ShieldCheck /><span><b>Private by design</b>Your bills stay on this device.</span></div></div>
    <div className="onboarding-actions"><div className="pager"><i className="active"/><i/><i/></div><Button className="primary-button" onClick={() => go('home')}>Set up my home <ChevronRight /></Button><button onClick={() => go('home')}>Skip for now</button></div>
  </div>;
}

function HomeScreen({ go, copy }: { go: (s: Screen) => void; copy: { hello: string; due: string; unpaid: string } }) {
  return <>
    <header className="home-header">
      <div className="avatar" aria-hidden="true">JD</div><div className="greeting"><span>{copy.hello}</span><strong>Juan Dela Cruz</strong></div>
      <button className="header-action" onClick={() => go('activity')} aria-label="Activity"><History /></button>
      <button className="header-action notify" onClick={() => go('notifications')} aria-label="Notifications"><Bell /><i /></button>
    </header>
    <ScrollScreen>
      <section className="summary-card">
        <div className="summary-kicker"><span>THIS MONTH</span><CalendarDays /></div>
        <div className="summary-main"><div><strong>₱7,591.00</strong><span>{copy.unpaid}</span></div><div className="bill-count"><b>3</b><span>bills remaining</span></div></div>
        <div className="summary-bottom"><div><span>Paid this month</span><b>₱4,850</b></div><div><span>Due soon</span><b>2 bills</b></div><Button className="view-bills" onClick={() => go('bills')}>View bills <ChevronRight /></Button></div>
      </section>
      <div className="calm-alert"><Clock3 /><span><b>{copy.due}</b>Next: Meralco on Sep 8.</span><ChevronRight /></div>
      <section className="content-section"><div className="section-heading"><h2>Madalas bayaran</h2><button onClick={() => go('bills')}>Tingnan lahat <ChevronRight /></button></div><div className="provider-grid">{providers.map(p => <button className="provider-tile" key={p.name} onClick={() => go('add-bill')}><ProviderMark tone={p.tone} letter={p.mark}/><span>{p.name}</span></button>)}</div></section>
      <section className="content-section"><div className="section-heading"><h2>Mga serbisyo</h2></div><div className="service-grid">{services.map(({label,icon:Icon}) => <button className="service-tile" key={label} onClick={() => label === 'Load' ? go('load') : label === 'Government' ? go('lingkod') : go('add-bill')}><span><Icon /></span><small>{label}</small></button>)}</div></section>
      <section className="content-section upcoming-section"><div className="section-heading"><h2>Mga susunod na bayarin</h2><button onClick={() => go('bills')}>Tingnan lahat <ChevronRight /></button></div>{bills.slice(0,2).map(b => <button className="bill-row" key={b.provider} onClick={() => go('bill-detail')}><ProviderMark tone={b.tone} letter={b.provider[0]}/><div className="bill-copy"><b>{b.provider}</b><span>•••• {b.account} · Due {b.due.replace(', 2026','')}</span></div><div className="bill-value"><b>{b.amount}</b><StatusPill status={b.status}/></div></button>)}</section>
    </ScrollScreen><BottomNav screen="home" go={go}/>
  </>;
}

function BillsScreen({ go }: { go: (s: Screen) => void }) {
  const [filter,setFilter] = useState('All');
  const filtered = filter === 'All' ? bills : bills.filter(b => b.status === filter);
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

function BillForm({ go, edit = false }: { go:(s:Screen)=>void; edit?:boolean }) {
  return <><AppHeader title={edit?'Edit bill':'Add bill'} onBack={() => go(edit?'bill-detail':'bills')}/><ScrollScreen>
    <div className="form-intro"><span className="form-icon"><ReceiptText/></span><div><h2>{edit?'Update bill details':'Track a household bill'}</h2><p>Bayarin will remind you before it’s due.</p></div></div>
    <form className="form-card" onSubmit={e=>{e.preventDefault();go('bill-detail')}}>
      <label>Provider<div className="provider-input"><ProviderMark tone="orange" letter="M"/><span>MERALCO</span><ChevronRight/></div></label>
      <label>Account number<Input defaultValue="1234 5678 9012" /></label><label>Alias <span>(optional)</span><Input defaultValue="Bahay" /></label>
      <div className="form-split"><label>Bill amount<Input defaultValue="₱ 2,450.36" /></label><label>Due date<Input defaultValue="Sep 8, 2026" /></label></div>
      <label>Billing period <span>(optional)</span><Input defaultValue="Aug 10 – Sep 10, 2026" /></label>
      <div className="form-split"><label>Repeat<div className="fake-select">Monthly <ChevronRight/></div></label><label>Reminder<div className="fake-select">3 days before <ChevronRight/></div></label></div>
      <Button className="primary-button" type="submit">{edit?'Save changes':'Save bill'} <Check/></Button>
    </form>
  </ScrollScreen></>;
}

function MarkPaid({ go }: { go:(s:Screen)=>void }) {
  return <><AppHeader title="Mark as paid" onBack={()=>go('bill-detail')}/><ScrollScreen><div className="mark-summary"><ProviderMark tone="orange" letter="M"/><div><b>MERALCO</b><span>Bill amount</span></div><strong>₱2,450.36</strong></div>
    <form className="form-card" onSubmit={e=>{e.preventDefault();go('success')}}><label>Amount<Input defaultValue="₱ 2,450.36"/></label><label>Date paid<Input defaultValue="Sep 2, 2026"/></label><label>Payment method<div className="fake-select">GCash <ChevronRight/></div></label><label>Reference number <span>(optional)</span><Input placeholder="Enter reference number"/></label><label>Receipt <span>(optional)</span><button type="button" className="upload-zone"><Upload/><b>Attach a receipt</b><span>JPG, PNG or PDF</span></button></label><Button className="primary-button" type="submit">Confirm paid <Check/></Button></form><p className="legal-inline"><Info/> You’re recording a payment completed outside Bayarin.</p>
  </ScrollScreen></>;
}

function Success({ go }: { go:(s:Screen)=>void }) {
  return <div className="success-screen"><div className="success-check"><Check/></div><span className="eyebrow">HOUSEHOLD ACTIVITY UPDATED</span><h1>Recorded as paid</h1><p>Your Meralco bill is now up to date.</p><section><span>Amount paid</span><strong>₱2,450.36</strong><div><span>Paid to</span><b>MERALCO</b></div><div><span>Date paid</span><b>Sep 2, 2026</b></div><div><span>Method</span><b>GCash</b></div></section><div className="success-actions"><Button variant="outline" className="secondary-button" onClick={()=>go('bill-detail')}>View bill</Button><Button className="primary-button" onClick={()=>go('home')}>Back to Home <Home/></Button></div></div>;
}

function ActivityScreen({ go }: { go:(s:Screen)=>void }) {
  const items = [
    ['M','orange','MERALCO','Marked paid','Sep 2 · 9:41 AM','₱2,450.36','Paid'],
    ['W','blue','MAYNILAD','Bill added','Sep 1 · 8:15 AM','₱598.00','Upcoming'],
    ['G','indigo','GLOBE','Reminder updated','Aug 30 · 7:22 PM','₱599.00','Due soon'],
  ];
  return <><AppHeader title="Activity" onBack={()=>go('home')}/><ScrollScreen><div className="filter-strip"><button className="active">All</button><button>Bills</button><button>Load</button><button>Lingkod</button></div><h3 className="month-title">September 2026</h3><section className="activity-card">{items.map(i=><div className="activity-row" key={i[2]}><ProviderMark tone={i[1]} letter={i[0]}/><div><b>{i[2]}</b><span>{i[3]}</span><small>{i[4]}</small></div><div><strong>{i[5]}</strong><StatusPill status={i[6]}/></div></div>)}</section><h3 className="month-title">August 2026</h3><section className="activity-card"><div className="activity-row"><ProviderMark tone="red" letter="P"/><div><b>PLDT</b><span>Bill added</span><small>Aug 28 · 9:10 AM</small></div><div><strong>₱1,699.00</strong><StatusPill status="Overdue"/></div></div></section></ScrollScreen></>;
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

function SettingsScreen({ go, dark, setDark, lang }: { go:(s:Screen)=>void; dark:boolean; setDark:(v:boolean)=>void; lang:Lang }) {
  return <><AppHeader title="Settings"/><ScrollScreen className="with-nav"><section className="profile-card"><div className="avatar large">JD</div><div><b>Juan Dela Cruz</b><span>Home organizer</span></div><button><Pencil/></button></section><SettingsGroup title="Preferences"><Setting icon={<Languages/>} label="Language" value={lang} onClick={()=>go('language')}/><Setting icon={dark?<Moon/>:<Sun/>} label="Appearance" value={dark?'Dark':'Light'} onClick={()=>go('appearance')}/><Setting icon={<Bell/>} label="Notifications" value="On" onClick={()=>go('notifications')}/></SettingsGroup><SettingsGroup title="Your data"><Setting icon={<ShieldCheck/>} label="Privacy & security" value="On-device" onClick={()=>go('privacy')}/><Setting icon={<History/>} label="Household activity" onClick={()=>go('activity')}/></SettingsGroup><SettingsGroup title="Preview states"><Setting icon={<WifiOff/>} label="Offline state" onClick={()=>go('offline')}/><Setting icon={<CircleHelp/>} label="Empty & error states" onClick={()=>go('empty')}/><Setting icon={<RefreshCw/>} label="Replay welcome" onClick={()=>go('welcome')}/></SettingsGroup><section className="settings-note"><BrandMark small/><div><b>Bayarin</b><span>Version 1.0 · Made for Filipino households</span></div></section></ScrollScreen><BottomNav screen="settings" go={go}/></>;
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
  return <><AppHeader title="Privacy" onBack={()=>go('settings')}/><ScrollScreen><div className="privacy-hero"><ShieldCheck/><h2>Your bills stay on this device.</h2><p>Bayarin is designed to organize obligations without holding your money or sensitive login details.</p></div><section className="privacy-list"><div><Check/><span><b>What Bayarin stores</b>Bill names, due dates, reminders, amounts, and records you choose to add.</span></div><div><X/><span><b>What Bayarin never asks for</b>Wallet passwords, OTPs, PINs, card numbers, CVVs, or government passwords.</span></div><div><ArrowUpRight/><span><b>Payments stay external</b>Transactions happen through external wallets, banks, billers, or official websites.</span></div></section><div className="legal-card">Bayarin is not a bank, e-money issuer, payment processor, or government service.</div></ScrollScreen></>;
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

  useEffect(()=>{document.documentElement.classList.toggle('dark',dark)},[dark]);
  useEffect(()=>{
    const context=document.modelContext;if(!context?.registerTool)return;
    const lifecycle=new AbortController();
    const register=(tool:ModelTool)=>{try{void Promise.resolve(context.registerTool(tool,{signal:lifecycle.signal})).catch(()=>undefined)}catch{/* unsupported implementation */}};
    register({name:'start_bill_creation',title:'Add a bill',description:'Open the visible form to start tracking a new household bill. This does not make a payment.',inputSchema:{type:'object',properties:{provider:{type:'string'}},additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:()=>{setScreen('add-bill');return {status:'form_opened',paymentInitiated:false}}});
    register({name:'start_recording_bill_paid',title:'Record a bill as paid',description:'Open the visible form for manually recording a payment completed outside Bayarin.',inputSchema:{type:'object',properties:{provider:{type:'string'},amount:{type:'number'}},required:['provider'],additionalProperties:false},annotations:{readOnlyHint:false,untrustedContentHint:false},execute:(input)=>{if(!input||typeof input!=='object'||typeof (input as {provider?:unknown}).provider!=='string')throw new Error('provider is required');setScreen('mark-paid');return {status:'form_opened',paymentConfirmed:false}}});
    return()=>lifecycle.abort();
  },[]);

  let content:ReactNode;
  switch(screen){
    case 'welcome':content=<Welcome go={setScreen}/>;break;case 'onboarding':content=<Onboarding go={setScreen}/>;break;
    case 'home':content=<HomeScreen go={setScreen} copy={languages[lang]}/>;break;case 'bills':content=<BillsScreen go={setScreen}/>;break;
    case 'bill-detail':content=<BillDetail go={setScreen} setPayOpen={setPayOpen}/>;break;case 'add-bill':content=<BillForm go={setScreen}/>;break;case 'edit-bill':content=<BillForm go={setScreen} edit/>;break;
    case 'mark-paid':content=<MarkPaid go={setScreen}/>;break;case 'success':content=<Success go={setScreen}/>;break;case 'activity':content=<ActivityScreen go={setScreen}/>;break;
    case 'load':content=<LoadScreen go={setScreen}/>;break;case 'load-detail':content=<LoadDetail go={setScreen}/>;break;case 'lingkod':content=<LingkodScreen go={setScreen}/>;break;case 'government-detail':content=<GovernmentDetail go={setScreen}/>;break;
    case 'notifications':content=<Notifications go={setScreen}/>;break;case 'settings':content=<SettingsScreen go={setScreen} dark={dark} setDark={setDark} lang={lang}/>;break;case 'language':content=<LanguageScreen go={setScreen} lang={lang} setLang={setLang}/>;break;case 'appearance':content=<AppearanceScreen go={setScreen} dark={dark} setDark={setDark}/>;break;case 'privacy':content=<PrivacyScreen go={setScreen}/>;break;
    case 'offline':content=<StateScreen kind="offline" go={setScreen}/>;break;case 'empty':content=<StateScreen kind="empty" go={setScreen}/>;break;case 'error':content=<StateScreen kind="error" go={setScreen}/>;break;
  }
  return <main className="app-canvas"><section className="phone-shell" aria-label="Bayarin mobile application"><div className="status-bar"><span>9:41</span><span className="device-icons">● ◔ ▰</span></div>{content}<PaySheet open={payOpen} setOpen={setPayOpen} onLeave={()=>setReturnOpen(true)}/><ReturnPrompt open={returnOpen} close={()=>setReturnOpen(false)} paid={()=>{setReturnOpen(false);setScreen('mark-paid')}}/></section></main>;
}
