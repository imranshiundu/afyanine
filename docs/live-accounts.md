# Current accounts and live data

This supersedes the Supabase Auth instructions in `accounts-care.md` and
`care-team.md`. The current implementation uses the Supabase **PostgreSQL
database**, not Supabase Auth.

## Account entry

- Registration: display name, email, phone, password (10–128 characters), and
  Mother/CHW account type. Kenya local phone formats normalize to E.164.
- Sign-in: **email and password only**. Phone/PIN is not required.
- Scrypt-salted password hashes remain in `AccountIdentity`, never in profile
  responses. Random 256-bit session tokens live in HttpOnly/SameSite cookies;
  only SHA-256 token digests are stored. Sessions expire after12hours.
- Sign-out revokes the current session in the DB. Login throttling is
  database-backed (five failed attempts per email per15minutes) and account
  lockout applies across instances. Mutating routes reject cross-site origins.
- Email/phone are self-declared, NOT verified by email or SMS. No confirmation,
  recovery or notification emails are sent. Self-service password recovery is
  not implemented. Existing Supabase Auth users are NOT automatically migrated.
- Mother and CHW profiles are real database rows. Registration role is enforced
  by the server; selecting another entry role cannot change an existing account.
  CHW institutions are self-declared, not independently credential-verified.

## Linking and live delivery

CHWs request access using the mother's registered phone or email. The mother
opts into storage categories and separately approves the request/categories.
Requests are in-app, do not disclose whether a contact exists, and do not
automatically grant access. Revocation immediately stops subsequent reads and
invalidates the CHW workspace. Family grants remain read-only.

PostgreSQL triggers send empty invalidation notifications. One server-side
session-pool LISTEN connection per server process fans out to authenticated
`/api/live` SSE streams. Every delivery rechecks the cookie session and
relationship/category rules through the existing care service. Neither
notifications nor browser-accessible Supabase channels expose table rows or
credentials. Browser reconnection is automatic;15second refresh/focus checks are
a labeled fallback, not represented as working realtime.

Use `SUPABASE_SESSION_DATABASE_URL` on port5432 for LISTEN (session mode).
Transaction-mode poolers on6543 cannot support LISTEN. The main `DATABASE_URL`
may use transaction pooling. Both clients verify the official Supabase root
certificate in `certs/supabase-root-2021.crt`; Next standalone tracing includes
it. Its source is Supabase's dashboard `ssl:certificate_url` custom-content
setting, not a third-party certificate site:
https://supabase-downloads.s3-ap-southeast-1.amazonaws.com/prod/ssl/prod-ca-2021.crt

## SOS and sound

Only a mother with Vitals storage consent can raise her SOS. Only approved CHWs
with Vitals access (and the mother herself) can see/resolve it. One active SOS
per mother avoids duplicate alarms. Withdrawing Vitals consent deletes the
alerts and bindings. A CHW must click **Enable alert sound** on each device.
An active SOS rings until silenced locally or resolved. Silence does not resolve
the server record or prevent a later SOS from ringing.

No background mobile push, phone call, SMS, ambulance dispatch, delivery
guarantee or clinician response guarantee is implemented. Closed/suspended
browsers cannot reliably ring. The interface directs urgent users to112.

## Bands: the only simulated records

Mother Home has **Bind simulated band** after Vitals consent. Codes must start
`SIM-`; this is not a claim of real hardware pairing. Each band can belong to one
mother and each mother can bind one. Binding is persisted in `CareBand`.

`afyanine_simulate_bands()` generates readings only for currently bound bands
whose mothers still consent to Vitals storage. Readings have source
`SIMULATED_BAND` and are explicitly labeled **not a medical measurement** in
both mother/CHW views. Nothing else (accounts, relationships, profiles, visits,
notes, SOS) is generated. Manual readings retain source `MANUAL`.

The DB function takes locks and checks the10second interval, preventing duplicate
generation across workers. Unbinding/withdrawing Vitals consent stops generation.
No synthetic reading automatically raises a clinical SOS.

Supabase pg_cron can run it every10seconds, including while all apps are closed.
For other installations run `node mini-services/band-simulator.mjs` as a managed
worker. Do not run an untracked endless process inside a serverless request.

## Database setup and deployment

Apply once, in order, as the trusted database administrator:
1. `prisma/care-team.sql`
2. `prisma/password-accounts.sql`
3. `prisma/live-bands.sql`

`scripts/setup-supabase-accounts.mjs <project-ref> --apply` performs the additive
setup for the explicitly approved **Imran** project only, creates a restricted
server login owning only the new tables, enables the band scheduler, and saves
runtime connections to ignored, mode600 `.env.supabase.local`. It deliberately
refuses existing account schemas/roles instead of resetting credentials or
deleting data. Re-run only after investigating a partial/failed setup.

All13new tables have RLS enabled and direct PUBLIC/anon/authenticated grants
revoked. The server's private runtime role owns them and performs authorization.
Keep its connections server-only; never expose them with NEXT_PUBLIC names.
No service-role or Supabase management token is required by the running app.

Deploy the branch with both database connection secrets and
`CARE_RECORDS_ENABLED=true` **only after authorizing clinical storage for that
installation**. Each mother must still opt in to categories herself. Production
builds generate Prisma but never run migrations. The repository's Vercel
integration must be configured by a workspace manager before this conversation
can configure hosting; database setup alone does not change the deployed app.

This is not a certified medical-device/emergency service or a claim of clinical,
retention, minors/guardian, or statutory/privacy compliance. Recovery and contact
ownership verification need implementing before general public account rollout.

## Checks

- `node --experimental-strip-types --test tests/*.test.mjs`
- `npx tsx tests/care-workspace.integration.ts`
- `npx tsx tests/accounts-live.integration.ts`
- `bash tests/care-migration.integration.sh`
- `npm run build`

The integration suites require the isolated local `/afyanine` DB, never remote
production data. Accounts/live tests cover email/password-only sign-in, CSRF,
session expiry/revocation, rate limiting, phone approval, authenticated SSE SOS,
unconnected-CHW denial, revocation, bound-only simulated readings and unbinding.
