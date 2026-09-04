# Bayarin

**Pay. Organized. At peace.**

Bayarin is a Philippines-first household organizer for everyday bills, load reminders, and public-service deadlines. It keeps one calm view of what the household owes, when it is due, and what has already been paid — without becoming a wallet, bank, or payment processor.

Payments stay where they belong: GCash, Maya, your bank, the biller’s website, or the official government portal. Bayarin records status, reminders, and household activity. It never asks for wallet passwords, OTPs, PINs, card numbers, or government logins.

> Built for every Filipino household. Version 2.0.

---

## Why Bayarin exists

Philippine households juggle many due dates at once: Meralco, Maynilad, PLDT, Globe load, SSS, PhilHealth, Pag-IBIG, BIR, LTO. Those records usually live in screenshots, group chats, and memory.

Bayarin puts them in one shared household space:

- See what is still unpaid this month
- Get a gentle reminder before a due date
- Mark a bill paid after you settle it outside the app
- Keep the family in sync without sharing banking access

---

## What you can do

### Household bills

Track recurring household bills with Philippine providers baked in, plus an **Other** option for local utilities.

| Category | Example providers |
| --- | --- |
| Electricity | Meralco, VECO, Davao Light, BATELEC |
| Water | Maynilad, Manila Water, Metro Cebu Water District, PrimeWater, LWUA / local water districts |
| Internet | PLDT Home, Globe At Home, Converge, SKY Fiber |
| Cable & streaming | Cignal, SKY Cable, GSAT |
| Mobile load | Smart, Globe, DITO, TM |
| Insurance | AXA Philippines, Sun Life, Pru Life UK |
| Other | Any household bill you add yourself |

Each bill stores provider, account number, alias, amount, due date, billing period, recurrence, reminder window, status, and (when paid) payment method, reference number, and who paid.

Statuses: **Draft**, **Upcoming**, **Due soon**, **Overdue**, **Paid**.

### Shared households

A user belongs to one household at a time.

- **Create** a household and become its admin
- **Join** with a household name or join code
- Share bills, activity, and reminders with the people at home
- Admins can remove members

Members help organize records. Nobody stores wallet or bank passwords in Bayarin.

### Lingkod (public-service dates)

Lingkod is a reminder surface for government obligations, not a government service:

- SSS contribution
- PhilHealth contribution
- Pag-IBIG contribution
- BIR tax payment
- LTO registration

Bayarin tracks dates and amounts to prepare. Transactions happen on official websites and apps.

### Load reminders

Track when family numbers may need load next. Purchase still happens in the telco or payment app.

### Calendar, activity, and notifications

- **Calendar** — due dates in one month view
- **Activity** — a household log of bills added, marked paid, and reminder updates, updated in real time
- **In-app notifications** — due-soon and household events
- **Push / local reminders** — native reminder scheduling on device (Expo Notifications)

### Pay outside Bayarin

When it is time to pay, Bayarin opens the app or site you already use:

- GCash
- Maya
- Bank / biller website
- Copy payment details

After you finish outside the app, come back and **Mark as paid**. Opening another app does not confirm a payment.

### Language, appearance, and your data

- **Languages:** English, Tagalog, Cebuano (Binisaya) — switch anytime
- **Themes:** light and dark
- **Export:** download a JSON copy of profile, household bills, and activity
- **Privacy:** account-owned records behind Supabase Auth and row-level security

---

## How the app is structured

Bayarin is a single Expo / React Native app that runs on **web**, **iOS**, and **Android**. On wide screens the UI frames itself as a phone-sized household app.

```
App.tsx                 Screen router, auth session, household gate
src/
  screens/              Welcome, onboarding, auth, home, bills, calendar,
                        Lingkod, load, settings, household
  components/ui.tsx     Shared UI (headers, cards, nav, heroes)
  services/             Bills, households, notifications, push, realtime
  lib/supabase.ts       Supabase client (PKCE auth, AsyncStorage session)
  i18n.ts               English, Tagalog, Cebuano copy
  data.ts               Providers, government services, assets
  theme.ts              Light / dark palettes
supabase/migrations/    Auth, bills, households, realtime, notifications
```

Typical path through the app:

1. **Welcome** — brand story and get started
2. **Onboarding** — language, services, reminder rhythm, theme
3. **Sign up / log in** — email and password via Supabase Auth
4. **Household setup** — create or join a household
5. **Home** — unpaid this month, frequent services, upcoming bills
6. **Bills / Calendar / Lingkod / Profile** — bottom navigation

Protected screens require a signed-in session. If the account has no household yet, Bayarin sends you to household setup before Home.

---

## What Bayarin is not

Bayarin is **not**:

- a bank or e-money issuer
- a payment processor or wallet
- a government service (SSS, PhilHealth, Pag-IBIG, BIR, LTO)
- a place that stores OTPs, PINs, card numbers, CVVs, or government passwords

That boundary is intentional. The product organizes household records so payments can stay with trusted external providers.

---

## Tech stack

| Layer | Choice |
| --- | --- |
| App | Expo 57, React Native 0.86, React 19, TypeScript |
| Auth & data | Supabase (Auth, Postgres, RLS, Realtime) |
| Motion | Moti, React Native Reanimated, Gesture Handler |
| Icons | lucide-react-native |
| Web deploy | `expo export --platform web` → Vercel (`dist`) |

Native extras: Expo Image, Video, Blur, Haptics, Clipboard, Sharing, Web Browser, Notifications, Device, File System.

---

## Getting started

### Prerequisites

- Node.js 18+
- npm
- A [Supabase](https://supabase.com) project

### Install

```bash
npm install
```

### Environment

Copy the example env file and fill in your Supabase project values:

```bash
cp .env.example .env.local
```

```
EXPO_PUBLIC_SUPABASE_URL=
EXPO_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
```

Use the **publishable / anon** key only. Never put a `service_role` or secret key in this client app.

### Database

Run the SQL migrations in order in the Supabase SQL editor (or Supabase CLI):

1. `supabase/migrations/202609030001_bayarin_auth.sql` — profiles, bills, activity, RLS
2. `supabase/migrations/202609030002_household_features.sql` — members and notification preferences
3. `supabase/migrations/202609030003_realtime_paidby_notifications.sql` — `paid_by`, notifications, realtime publication
4. `supabase/migrations/202609040001_shared_households.sql` — shared households and memberships
5. `supabase/migrations/202609040002_fix_household_rpcs.sql` — create / join / remove household RPCs

More detail: [SUPABASE_SETUP.md](./SUPABASE_SETUP.md).

In **Authentication → URL Configuration**, set the Site URL and redirect URLs for your local and production hosts (for example `http://localhost:8081/**` and your deployed origin).

### Run

```bash
npm start          # Expo dev server
npm run web        # Web
npm run android    # Android
npm run ios        # iOS
```

### Web production build

```bash
npm run build      # expo export --platform web → dist/
```

`vercel.json` points Vercel at that `dist` output.

---

## Data model (high level)

| Table | Purpose |
| --- | --- |
| `profiles` | Display name, language, appearance, onboarding, push token |
| `households` | Shared household + join code |
| `household_memberships` | Admin / member; one household per user |
| `bills` | Household bill records and payment status |
| `activity_events` | Household timeline |
| `notifications` | Per-user in-app notifications |
| `notification_preferences` | Due-soon, weekly summary, payment, Lingkod toggles |

Access is gated by **row-level security**. Household members can see shared bills and activity; notifications stay private to the recipient.

Realtime subscriptions keep bills, activity, and notifications current across devices in the same household.

---

## Scripts

| Command | What it does |
| --- | --- |
| `npm start` / `npm run dev` | Start Expo |
| `npm run web` | Expo web |
| `npm run android` | Open Android |
| `npm run ios` | Open iOS |
| `npm run build` | Export a static web build to `dist/` |

---

## Product principles

1. **Organize, don’t process.** Record bills and payments; never move money.
2. **Household first.** One shared space for the people who live together.
3. **Philippines-native.** Providers, government dates, languages, and peso amounts that match home.
4. **Gentle reminders.** Nudge before the due date; don’t shout.
5. **Your records stay yours.** Auth + RLS, export on request, no credential harvesting.

---

## License

Private project. All rights reserved unless a license file is added later.
