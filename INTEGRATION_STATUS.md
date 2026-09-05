# Bayarin redesign and integration status

Updated September 5, 2026.

The welcome, dashboard, bill details, external payment sheets, receipt confirmation, activity, navigation, forms, and settings now share the supplied blue/violet visual style. Illustrations and provider marks are recreated approximations; the screenshot did not include original design assets.

## Implemented connections

| Feature | Connection |
| --- | --- |
| Account | Supabase email/password authentication, email confirmation, password recovery, persisted sessions and profile preferences |
| Household | Protected create/join/remove RPCs, shared member profiles, membership refresh and realtime subscriptions |
| Bills | Supabase create/edit/archive; exact provider selection; validated amounts and dates; live household lists, search, calendar and status filters |
| Payments | Records the selected bill as paid; prevents duplicate submissions; database trigger writes activity, member notifications and one next recurring bill |
| Receipts | Native/web document selection, private Supabase storage, household access policies and expiring viewing links |
| Reminders | Database in-app reminder sync and saved preferences; local iOS/Android scheduling, notification navigation and cancellation on payment or household change |
| External payment destinations | GCash/Maya native app links with website fallback, BPI website and supported provider websites; account/payment detail copying |
| Data export | Household bills, activity, account and notification preferences exported as JSON |

Bayarin records payments made elsewhere. No wallet, bank, or utility payment-processing API is connected, and no live payment was made during verification. Device reminders are local scheduled notifications; a server-driven remote push sender is not configured.

## Live deployment still required

The configured Supabase Auth service responds, but a read-only deployment check confirms that the live database is missing `bills.previous_bill_id`, `bills.receipt_path`, `profiles.selected_services`, `notification_preferences.load_reminders`, and `sync_due_reminders`.

The prepared additive SQL is [supabase/deploy-integrations.sql](supabase/deploy-integrations.sql). It contains the four September 5 migrations in one transaction and does not reset account or household data. It requires the existing September 3 and 4 migrations. Applying the bundle twice was tested against the local PostgreSQL fixture.

1. Sign in to the Supabase dashboard and open the existing Bayarin project.
2. Run the prepared SQL in its SQL editor. With a configured authenticated Supabase CLI, apply the migration files instead.
3. Run `node --env-file=.env.local scripts/check-backend.cjs` again.
4. Verify sign-in, a real household bill, receipt upload/viewing, and notification permissions on physical iOS and Android development builds.

The dashboard was signed out during this session, and no Supabase management token or database password was available. Live SQL deployment and authenticated production smoke testing were therefore not performed.

## Verification

- TypeScript check passed.
- Seven automated tests passed, including the full migration chain, household data isolation, payment/recurrence/reminder rules, receipt policies, retrying the deployment bundle, monthly totals, date/amount validation and external-link fallbacks.
- Web, iOS and Android JavaScript exports passed. Native exports used `--no-bytecode` because Windows denied execution of the local Hermes compiler; these are not signed store binaries.
- Browser review covered the welcome, mobile dashboard, bill details, provider changes and payment-return flow, including 320-pixel layouts.

Useful local commands:

```powershell
node --stack-size=8192 node_modules/typescript/bin/tsc --noEmit
node --test tests/*.test.cjs
node scripts/build-integration-sql.cjs
node node_modules/expo/bin/cli export --platform web
node scripts/serve.cjs dist 8086
```

Store distribution still requires developer accounts, signing, production native builds, store metadata/privacy disclosures, physical-device checks, and store review. This work does not publish the app.
