# AfyaNine — Handoff & Task Ledger

> **Purpose:** live log of every task, taken *before* the work starts, so any
> other agent or developer can pick up where we left off if an agent gets stuck
> or runs out of tokens. Update statuses as you go — this file is the memory.
>
> **Secrets live in `tokens.txt` + `.env` (local only, never committed — see
> `~/.gitignore` entry `tokens.txt` / `.env*`).**

---

## Context snapshot

| Item | Value |
|---|---|
| Stack | Next.js 16 (App Router), React 19, Tailwind v4, shadcn/ui, Prisma |
| App concept | Maternal-health companion — **Mother** app (Wanjiku demo persona) + **CHW** dashboard (Grace persona) |
| Data layer | Supabase **Postgres** (project **"Imran"**, ref `xosqbyjzlhjnoscspvcc`, `eu-west-1`) |
| Realtime | Supabase Realtime `postgres_changes` → public tables `Mother`, `VitalReading`, `VisitNote`, `Emergency` |
| Mini bot | POST `/api/bot/tick` = one simulation step; server handle holds СНW register + every test mother |
| Origin of "realtime" requirement | Two role-based sessions (Mother & CHW) + live AfyaBand vitals; previously only polled per-screen-mount |
| Telemetry files | `tokens.txt` (`sbp_…` management token, project choice, no-push rule), `.env` (DATABASE_URL, public Supabase keys) |

## Test mother personas (bot-owned, `simulated = true`)

| Code | Name | Age | Week | Persona | Baseline sys/dia (mmHg) | HR | Special |
|---|---|---|---|---|---|---|---|
| MW-1048 | Wanjiku Kamau | 28 | 28 | Healthy teaching case | 108/68 ± 4 | 68–78 | default login; richer history |
| MW-2101 | Achieng Odera | 34 | 33 | **Preeclampsia risk** | 138→148 rising / 88–96 | 78–92 | fires SOS ~every 5–9 ticks; user-visible AI alert |
| MW-2102 | Njeri Mutiso | 23 | 18 | Healthy | 102/62 ± 4 | 70–84 | — |
| MW-2103 | Halima Barasa | 31 | 36 | Gestational hypertension (Watch) | 128/82 ± 5 | 72–88 | occasionally Watch → High Risk |
| MW-2104 | Esther Kiprotich | 19 | 24 | Healthy low | 98/58 ± 4 | 66–80 | — |
| MW-2105 | Faith Wambui | 38 | 21 | Anemia + Watch | 116/74 ± 5 | 92–108 | high resting HR |

Realism rules (bot + seed):
- **Diurnal curve** (Africa/Nairobi = UTC+3): +5..+9 systolic around 07:00–09:00
  and 18:00–21:00; −4 around 02:00–05:00 sleep.
- Noise ±4 mmHg, ±6 bpm, round-trip mean reversion per persona.
- Readings only between 06:00 and 23:00 (a band doesn't capture while asleep).
- SOS only from the preeclampsia persona and **only when no active emergency**
  anywhere in the register.

## Task ledger

| # | Task | Owner | Status | Notes |
|---|---|---|---|---|
| T1 | Install deps (`npm install`; bun is absent on this machine) | opencode | ✅ done | `package-lock.json` created; `bun.lock` kept for the sandbox |
| T2 | Probe Supabase via Management API (projects, keys, pooler config) | opencode | ✅ done | ref `xosqbyjzlhjnoscspvcc`; keys in `.env` now |
| T3 | Write `docs/API.md` (endpoint contract) + this ledger **before coding** | opencode | ✅ done | you are reading it |
| T4 | Prepare DB: drop legacy tables, `CREATE ROLE afyanine`, postgres provider in schema, `prisma db push`, RLS + realtime publication | opencode | ✅ done | ownership dance: tables reassigned to `postgres` to join `supabase_realtime` publication, then privileges granted back to `afyanine`. Future `db push` may recreate tables under `afyanine` again — re-run the grant block afterwards (see API.md “DBA notes”) |
| T5 | Seed 6 test mothers + realistic 3-week backfill (`prisma/seed.mjs`, `npm run db:seed`) | opencode | ✅ done | 223 readings, 17 appointments; old sqlite-era `prisma/seed.ts` deleted (superseded) |
| T6 | Realtime wiring: `src/lib/supabase.ts`, channel `afyanine-live`, live refetch in `AfyaNineApp`, resolve-SOS endpoint + UX, login account switcher (`GET /api/mothers`) | opencode | ✅ done | verified in a real browser (Playwright): CHW banner appears/clears live, Mother Vitals updates live without reload; demo-data fallback made honest (no ghost banner when live emergency is null) |
| T7 | Mini bot: `POST /api/bot/tick` (1 simulation step, idempotent) + `mini-services/bot.mjs` runner loop (`npm run bot`) | opencode | ✅ done | hooks: `forceSos`, `forceMother`; runner auto-detects next dev port (3000 collides with the user's other running project → 3001) |
| T8 | Verify locally end-to-end: dev server → seed → bot ticks → realtime delivery proven with a Node supabase listener → SOS resolve → UI states | opencode | ✅ done | `node scripts/realtime-probe.mjs` streamed INSERT/UPDATE events; two-session browser test passed; prod `next build` green; `tsc --noEmit` clean |
| T9 | Final docs pass: record every endpoint (incl. request/response examples) + flip task statuses | opencode | 🔵 in progress | you are reading it |
| T10 | Push to GitHub + deploy Vercel project | opencode | ✅ done (unblocked by Imran) | repo `imranshiundu/afyanine` (both histories merged; `tokens.txt`/`.env`/`*.tar`/`.playwright-cli` excluded & audited). Vercel project **afyanine** → https://afyanine.vercel.app — reads **and** serverless writes verified (mothers list, register, bot tick inserts, SOS resolve). Env: `DATABASE_URL` (session pooler) + `NEXT_PUBLIC_SUPABASE_*` on prod/preview/dev; `vercel.json` runs `prisma generate && next build` |
| T11 | Version the reusable Replit development environment | Replit | ✅ done | Saved environment `afyanine` built and verified in a fresh sandbox. Non-secret specification in `.replit-dev-environment.yaml`, instructions in `docs/development.md`; no production or app-behavior changes. |
| T12 | Redesign Test Ward and retain Vitals navigation | Replit | ✅ done | Separate Sign in / Test Ward panels; direct-entry fictional-account cards with loading/retry states; selected-account snapshot, profile labels and SOS identity; persistent Vitals navigation with bottom-card clearance. Build and changed-component lint pass. Browser verified Faith/Achieng entry, all-six-card reachability, keyboard tabs, Vitals/Home navigation and max-scroll clearance. Existing WebSocket example TypeScript errors remain. No schema, permissions, or sync-policy changes. |


## Deployment snapshot (added after T10)

| Item | Value |
|---|---|
| GitHub | https://github.com/imranshiundu/afyanine (`main`, planning-phase history merged — brand assets & diagrams preserved) |
| Vercel | project `afyanine` (scope `imranbuildswithcode`) → **https://afyanine.vercel.app** |
| Excluded from the repo | `tokens.txt`, `.env` (untracked, contains the `afyanine` DB password), `*.tar`, `.playwright-cli/`, `ops.tar` |
| Vercel env | `DATABASE_URL` `NEXT_PUBLIC_SUPABASE_URL` `NEXT_PUBLIC_SUPABASE_ANON_KEY` (production/preview/development) |
| Serverless runtime | Supabase **session pooler** `:5432` (transaction pooler `:6543` couldn't be reached from this machine to validate; switch to it + `pgbouncer=true` if connection counts ever become a concern) |
| Build | `prisma generate && next build` (via `vercel.json`) |
| Secrets audit | `git grep` for `sbp_…`, `service_role`, `sb_secret`, `afyanine.…:…` over HEAD → clean |

## Known non-blockers (pay attention when continuing)

- **Port 3000 is taken** on this machine by "Inside Nairobi Tours"
  (`~/Code/Client Builds/...`, running since Nov 5). AfyaNine dev runs on
  **3001**: `npx next dev -p 3001`. Don't kill the other project.
- 2 pre-existing lint errors live in scaffold files the team didn't write:
  `src/components/ui/carousel.tsx` and `src/hooks/use-mobile.ts`
  (react-hooks/set-state-in-effect). Not from this task; fix separately.
- `.env` and `tokens.txt` are **untracked on purpose** (secrets). `.env` was
  removed from the git index (was committed pre-task).
- The dev-server clock on this host drifts a few minutes from Nairobi time —
  persona realism uses UTC+3 arithmetic, unaffected.

## Recovering when stuck / low tokens (read this first)

1. Secrets: `tokens.txt` (Supabase management token `sbp_…`, "Do not push to github").
   `.env` holds `DATABASE_URL` + `NEXT_PUBLIC_SUPABASE_*`.
2. DB surgery without a DB password/proxy: `POST https://api.supabase.com/v1/projects/xosqbyjzlhjnoscspvcc/database/query`
   with `Authorization: Bearer $SUPA_TOKEN` and JSON body `{"query": "…"}`.
   (App sign-in role `afyanine` has its own password in `.env`.)
3. Rebuild everything from scratch: `npm install` → `npm run db:generate` →
   `npm run db:seed` → `npm run dev` → `npm run bot`.
4. Run one manual simulation step: `curl -X POST localhost:3000/api/bot/tick`.
5. Verify realtime from CLI: `node scripts/realtime-probe.mjs` (listens on
   `afyanine-live`, prints any postgres_changes event).
6. Statuses here lag reality at worst by one task — if in doubt, check the file
   dates of `src/components/afyanine/api.ts`, `prisma/seed.mjs`,
   `mini-services/bot.mjs` and just re-run T8.

## Data-flow map (target state)

```
AfyaBand (simulated by bot)
   └─ POST /api/bot/tick  → Prisma → Supabase Postgres
                                   │
        realtime broadcast (postgres_changes on public tables)
                                   │
     Mother session (Wanjiku)      │      CHW session (Grace)
   Vitals + Home + SOS banner  ◀───┴──▶  ChwDashboard banner + register
SOS raised → POST /api/emergencies → Emergency row (status=active)
              → CHW banner live → POST /api/emergencies/resolve → status=resolved
              → both sides clear + toast, in realtime
```

## Open questions / risks

- Supabase AV report: the Imran project had legacy portfolio tables — dropper is
  idempotent, and Imran explicitly cleared ("you may clear everything else there").
- Pooler host `aws-0-eu-west-1.pooler.supabase.com` is shared across projects —
  always qualify the role as `afyanine`.
- Realtime free tier: `postgres_changes` only broadcasts tables on
  `supabase_realtime` publication with `REPLICA IDENTITY FULL` for updates —
  T4 sets both.
