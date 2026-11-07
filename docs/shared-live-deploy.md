# Shared accounts and live delivery

Keep the existing main UI; the authorized additions are the signup fields,
CHW Patients/Visits/Profile destinations, email invitations, real account data
and real SOS state. The Test ward remains fictional and separate.

Apply the additive migrations in order: care-team.sql, password-accounts.sql,
live-bands.sql, shared-live.sql. The last can be applied to the existing Imran
database with:

```
replit secrets exec --keys SUPABASE_ACCESS_TOKEN -- node scripts/upgrade-shared-live.mjs PROJECT_REF --apply
```

No reset, original-table deletion or Supabase Auth migration is involved.

Both the Next server and persistent gateway need:
- DATABASE_URL and SUPABASE_SESSION_DATABASE_URL (session pool/direct, not6543,
  for LISTEN). Use the committed public CA with strict verification.
- CARE_RECORDS_ENABLED=true.
- SOCKET_TICKET_SECRET: a generated server-only random secret of at least32
  characters, identical on app and gateway. Never expose it in NEXT_PUBLIC.
- REALTIME_ALLOWED_ORIGINS: exact comma-separated UI origins on the gateway.
- REALTIME_PUBLIC_URL: public HTTPS gateway origin, or unset when a trusted
  reverse proxy routes /socket.io on the application's origin to the gateway.

Start the gateway with `node --import tsx mini-services/realtime.ts` on a
persistent host, not in a Vercel function. Set REALTIME_PORT (default3003).
Host near the database; measure write-to-browser p50/p95/p99 under load. A local
result is not a production latency or availability guarantee.

The local private .env.shared.local config and .env.supabase.local credentials
must stay ignored and chmod600. `node scripts/run-shared.mjs web|gateway --hosted`
loads them only into the child process. Without --hosted it uses the isolated
sandbox database. Local simulator startup is `... simulator`; do not run it in
addition to the hosted database's existing bound-band pg_cron schedule.

Provision the explicitly authorized operator using a password supplied through
the secure secrets form:
```
replit secrets exec --keys OPERATOR_PASSWORD -- node --import tsx scripts/provision-operator.ts operator@example.com
```
Run with the desired database runtime configuration. Existing accounts are
promoted only if their existing password authenticates them; it is not reset.
New staff accounts require at least12 characters. Do not grant based only on
an unverified email. There is no self-service operations signup.

Email-address requests are delivered in-app and appear on the mother's Profile;
no outbound mail provider or email-ownership verification is configured. Profiles
say email is unverified. Clinical rollout must add verified-email enrollment
before treating address matching as proof of real-world identity.

CHWs explicitly enable browser SOS sound once. Sound needs an open, running app
and the browser's audio permission; it is not a guaranteed background alarm.
No ambulance dispatch, GPS, SMS, support tickets, chat or push delivery is
pretended. Emergency999/112 and saved-contact tel: links use the user's SIM
dialler and normal carrier service.
