# AfyaNine — API Endpoint Log

> Every endpoint the live backend serves, recorded before/while it ships.
> Base URL (dev): `http://localhost:3001` (port 3000 is held by another project on this machine) · prod URL: set on deploy
>
> Conventions for this prototype:
> - No auth layer; the Supabase Postgres role `afyanine` is the app identity.
> - Mother sessions identify themselves by clinic code (`MW-####`).
> - All times are ISO-8601 UTC; UI renders them with `en-KE` locale.
> - Errors: JSON `{ "error": string }` with a sensible 4xx/5xx; missing entity → 404.

---

## 1 · `GET /api` — health probe
- **Auth:** none
- **Response 200**
```json
{ "message": "Hello, world!" }
```

---

## 2 · `GET /api/mothers` — test-account switcher *(new)*
Powers the Login account picker: the six bot-simulated mothers, ordered to put the teaching case first.
- **Auth:** none
- **Query:** `?risk=High Risk` to filter (optional)
- **Response 200**
```json
{
  "mothers": [
    {
      "code": "MW-1048",
      "fullName": "Wanjiku Kamau",
      "firstName": "Wanjiku",
      "initials": "WK",
      "color": "#F6E7D8",
      "age": 28,
      "week": 28,
      "risk": "Normal",
      "simulated": true
    }
  ]
}
```
- **Errors:** 503 `{ "error": "database unavailable" }`

---

## 3 · `GET /api/mother?code=MW-1048` — pregnancy + vitals snapshot (mother app)
- **Auth:** none in prototype; code is the account key.
- **Query:** `code` (default `MW-1048`)
- **Response 200**
```json
{
  "mother": {
    "code": "MW-1048", "firstName": "Wanjiku", "fullName": "Wanjiku Kamau",
    "device": "AfyaBand", "sizeNote": "About the size of an eggplant",
    "week": 28, "totalWeeks": 40, "daysLeft": 84, "trimester": "Third trimester"
  },
  "appointment": { "label": "NEXT ANC VISIT", "place": "Kibera Health Centre", "scheduledAt": "2026-06-15T07:30:00.000Z" },
  "current": {
    "systolic": 118, "diastolic": 76, "heartRate": 74,
    "heartLow": 62, "heartHigh": 86, "device": "AfyaBand", "synced": "just now"
  },
  "series": {
    "Hourly":  { "labels": [], "systolic": [], "diastolic": [], "heart": [], "bpInsight": "…", "hrSummary": "…" },
    "Daily":   { "labels": [], "systolic": [], "diastolic": [], "heart": [], "bpInsight": "…", "hrSummary": "…" },
    "Weekly":  { "labels": [], "systolic": [], "diastolic": [], "heart": [], "bpInsight": "…", "hrSummary": "…" }
  }
}
```
- **Errors:** 404 `{ "error": "mother not found" }` (code unknown), 404 with empty readings handled client‑side (screen falls back to demo data).

---

## 4 · `GET /api/patients` — CHW register payload
- **Auth:** none (CHW session concept only)
- **Response 200**
```json
{
  "patients": [
    {
      "id": "MW-1048", "initials": "WK", "name": "Wanjiku Kamau",
      "week": "28 weeks", "age": 28, "bp": "118/76",
      "systolic": 118, "diastolic": 76,
      "risk": "Normal" | "Watch" | "High Risk", "color": "#F6E7D8"
    }
  ],
  "chw": { "firstName": "Grace", "stats": { "patients": 6, "attention": 2, "visits": 1 } },
  "emergency": {
    "kind": "Bleeding", "who": "Achieng Odera needs help",
    "where": "Kibera · Ambulance arriving in 8 min",
    "motherCode": "MW-2101", "createdAt": "2026-11-07T07:40:00.000Z"
  }
}
```
- `emergency` = latest **active** one, or `null`.
- Risk rules: sys ≥ 140 or dia ≥ 90 → `High Risk`; sys ≥ 130 or dia ≥ 85 → `Watch`; else `Normal`.
- Sort: teaching case `MW-1048` first, then risk, then code.

---

## 5 · `GET /api/patients/[code]` — patient detail for the CHW chart
- **Auth:** none
- **Response 200**
```json
{
  "patient": { "id": "MW-2101", "initials": "AO", "name": "Achieng Odera", "week": "33 weeks", "age": 34, "bp": "146/94", "systolic": 146, "diastolic": 94, "risk": "High Risk", "color": "#F9D8D6" },
  "alert": {
    "label": "AFYANINE AI ALERT · TODAY, 7:40 AM",
    "title": "High Risk: Possible Preeclampsia",
    "reason": "Blood pressure has remained above 140/90 for the past 3 readings, with a rising trend.",
    "latestBp": "146/94", "trend": "+9%", "trendLabel": "7-day increase"
  },
  "trend": { "axis": ["1 Jan", "Today"], "series": [140, 146], "threshold": 140, "headline": "Elevated and rising", "status": "High" },
  "notes": [ { "id": "…", "author": "Grace Wanjiru", "body": "…", "createdAt": "2026-11-06T09:12:00.000Z" } ]
}
```
- **Errors:** 404 `{ "error": "mother not found" }` / 404 no readings.

---

## 6 · `POST /api/patients/[code]/notes` — CHW visit note
- **Auth:** none
- **Body:**
```json
{ "body": "Discussed swelling; advised rest and water.", "author": "Grace Wanjiru" }
```
- **Response 201**
```json
{ "note": { "id": "…", "author": "Grace Wanjiru", "body": "…", "createdAt": "2026-11-07T08:01:00.000Z" } }
```
- **Errors:** 400 `error: "body and author required"` · 404 `error: "mother not found"`
- **Realtime side effect:** `VisitNote` INSERT broadcast → CHW register refetch.

---

## 7 · `POST /api/emergencies` — raise SOS (mother role)
- **Body:**
```json
{ "kind": "Bleeding", "motherCode": "MW-1048" }
```
- `motherCode` defaults to `MW-1048`; `kind` is a free label `"Bleeding" | "Labour" | "Blurry vision" | …`.
- **Response 201**
```json
{ "emergency": { "id": "…", "kind": "Bleeding", "motherCode": "MW-1048", "createdAt": "2026-11-07T08:02:10.000Z" } }
```
- **Errors:** 400 `error: "kind and mother code required"` · 404 `error: "mother not found"`
- **Realtime side effect:** `Emergency` INSERT → CHW banner lights up live.

---

## 8 · `POST /api/emergencies/resolve` — clear the active SOS *(new)*
CHW flow: banner shown → ambulance sent → record resolved so the register is quiet again.
- **Body:** `{}` (resolves the most recent **active** emergency) or `{ "id": "…" }` for a specific one.
- **Response 200**
```json
{ "resolved": 1, "emergency": { "id": "…", "kind": "Bleeding", "createdAt": "2026-11-07T08:05:00.000Z" } }
```
- **Response 200 (nothing active)**
```json
{ "resolved": 0, "emergency": null }
```
- **Errors:** 404 `error: "emergency record not found"` if `id` given but unknown.
- **Realtime side effect:** `Emergency` UPDATE → both sessions clear the banner.

---

## 9 · `POST /api/bot/tick` — mini-bot simulation step *(new)*
One "heartbeats pass" of the simulated ward. Designed to be safe to repeat from any scheduler (local runner, cron, curl). Realistic data only — see `docs/HANDOFF.md` for personas & realism rules.
- **Body:** `{}` · optional hooks:
  - `{ "forceSos": true }` — force the SOS roll (still capped at one active emergency app-wide).
  - `{ "forceMother": "MW-1048" }` — guarantee a fresh reading for that specific mother (UI verification).
- **What it does (per tick):**
  1. **Self-heal accounts** — creates any of the 6 test mothers that are missing (idempotent).
  2. **Vitals** — for each simulated mother whose last reading is ≥ 18 min old, `p = 0.75` chance of a new `VitalReading` (→ ~1 reading per tick lands somewhere in the ward); only 06:00–23:00 Nairobi time.
  3. **SOS drill** — preeclampsia persona rolls `p ≈ 0.12` (or 1 with `forceSos`, still capped at one active emergency app-wide).
  4. Occasionally a CHW note (p = 0.06, persona-specific copy).
  5. **Nudge** — if a pass produced zero readings at all, insert one persona-based reading so charts keep moving.
- **Response 200**
```json
{
  "tick": "2026-11-07T08:06:00.000Z",
  "accountsEnsured": 6,
  "readingsAdded": 4,
  "emergenciesRaised": [{ "id": "…", "motherCode": "MW-2101" }],
  "notesAdded": 0
}
```
- **Errors:** 503 `error: "database unavailable"`
- **Runner:** `npm run bot` (`mini-services/bot.mjs`) ticks every 45 s with jitter, hitting `POST /api/bot/tick`. For hosted deployments schedule this endpoint externally (e.g. cron).

---

## Realtime channel (documented contract)

- **Transport:** Supabase Realtime, `postgres_changes`.
- **Channel name:** `afyanine-live`
- **Tables / events** (schema `public`, after `REPLICA IDENTITY FULL`):

| Table | Events | Refetch side-effect |
|---|---|---|
| `Emergency` | INSERT | CHW: banner + register refresh, toast "SOS from …" |
| `Emergency` | UPDATE (status→resolved) | both sessions: banner clears + toast "SOS resolved" |
| `VitalReading` | INSERT | Mother snapshot + CHW register refresh (throttled 1.5 s) |
| `VisitNote` | INSERT | CHW register refresh (counts unaffected) |

Processed on both ends in `src/components/afyanine/AfyaNineApp.tsx` via a single
`useRealtime` hook; there's no server tick — changes are pushed by inserts.

## DBA notes (Supabase project “Imran”, ref `xosqbyjzlhjnoscspvcc`)

```sql
-- realtime publication + replica identity (already applied; re-run after any `prisma db push`
-- that recreates tables, because tables recreated by the app role won't be on the publication)
ALTER PUBLICATION supabase_realtime ADD TABLE public."Mother";
ALTER PUBLICATION supabase_realtime ADD TABLE public."VitalReading";
ALTER PUBLICATION supabase_realtime ADD TABLE public."VisitNote";
ALTER PUBLICATION supabase_realtime ADD TABLE public."Emergency";
ALTER TABLE public."Mother"        REPLICA IDENTITY FULL;
ALTER TABLE public."VitalReading"  REPLICA IDENTITY FULL;
ALTER TABLE public."VisitNote"     REPLICA IDENTITY FULL;
ALTER TABLE public."Emergency"     REPLICA IDENTITY FULL;
-- anon/browser can READ only (realtime receiver); the app role writes via Postgres role `afyanine`
GRANT SELECT ON ALL TABLES IN SCHEMA public TO anon;
-- permissive per-table policies already exist:
--   "Public read access - <table>" FOR SELECT TO anon, authenticated USING (true)
--   "App full access - <table>"    FOR ALL   TO afyanine USING (true) WITH CHECK (true)
```

Tables are physically owned by `postgres` (reassigned post-`db push` so the
management API could join them to the publication). Runtime role `afyanine`
holds explicit `GRANT ALL` + permissive RLS policies — writes work. If you run
`prisma db push` again, re-apply the block above.

# Integration checklist

**Full live demo (two-session):**
1. `npx next dev -p 3001` → open `http://localhost:3001` twice (Mother + CHW tabs; port
   3000 belongs to another running project on this machine).
2. Mother tab: Danger signs → pick "Bleeding" → banner lights on CHW tab live.
3. CHW tab: alert-banner ✕ (pointer or keyboard) → **Mark SOS resolved** → both clear live.
4. Let `npm run bot` run → Vitals numbers + CHW register rows update on screen without a refresh.
5. `npm run db:seed` recreates all six accounts from scratch (idempotent).

**Realtime smoke test (headless):**
- `node scripts/realtime-probe.mjs` listens on `afyanine-live` and prints any
  postgres_changes event (INSERT/UPDATE) as they happen; `--once` exits after
  the first event or 90 s.
