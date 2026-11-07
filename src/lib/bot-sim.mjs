/**
 * AfyaNine ward simulation core — the single source of truth shared by
 *   - prisma/seed.mjs   (backfill of test mothers, `npm run db:seed`)
 *   - src/app/api/bot/tick/route.ts  (one live simulation step, mini bot)
 *
 * Plain ESM (no types) so it can be imported from Node scripts AND the
 * Next.js server bundle. Prisma client is passed in as `db`.
 *
 * Realism rules (see docs/HANDOFF.md):
 *   - diurnal curve in Nairobi time (UTC+3): morning/evening peaks, sleep trough
 *   - readings only between 06:00 and 23:00 Nairobi time
 *   - SOS only from the preeclampsia persona, and at most one active app-wide
 */

export const NAIROBI_UTC_OFFSET = 3;
export const DAY = 86_400_000;

/* ------------------------------------------------------------------ */
/* Test-mother personas (bot-owned, `simulated = true`)                */
/* ------------------------------------------------------------------ */

export const PERSONAS = [
  { code: "MW-1048", fullName: "Wanjiku Kamau", firstName: "Wanjiku", age: 28, week: 28, phone: "+254712000104", color: "#F6E7D8", base: { sys: 108, dia: 68, hr: 72 }, drift: 12, sizeNote: "About the size of a cabbage", notes: ["Home visit: Wanjiku is feeling well, baby active. Advised on iron supplements.", "Reviewed AfyaBand readings together — resting BP is very steady."] },
  { code: "MW-2101", fullName: "Achieng Odera", firstName: "Achieng", age: 34, week: 33, phone: "+254712210101", color: "#F9D8D6", base: { sys: 138, dia: 89, hr: 82 }, drift: 10, sizeNote: "About the size of a pineapple", notes: ["Reported headaches and swollen ankles in the evening. Flagged for BP review.", "Discussed referral to Pumwani Maternity if readings continue to rise."] },
  { code: "MW-2102", fullName: "Njeri Mutiso", firstName: "Njeri", age: 23, week: 18, phone: "+254712210102", color: "#DCE9D5", base: { sys: 102, dia: 62, hr: 74 }, drift: 6, sizeNote: "About the size of an avocado", notes: ["First ANC yesterday — booked at Kianda Kagar Health Centre. Very cheerful."] },
  { code: "MW-2103", fullName: "Halima Barasa", firstName: "Halima", age: 31, week: 36, phone: "+254712210103", color: "#F5E3C6", base: { sys: 128, dia: 82, hr: 78 }, drift: 9, sizeNote: "About the size of a papaya", notes: ["Borderline BP twice this week. Advised salt reduction and 8 glasses of water."] },
  { code: "MW-2104", fullName: "Esther Kiprotich", firstName: "Esther", age: 19, week: 24, phone: "+254712210104", color: "#DDE8F0", base: { sys: 98, dia: 58, hr: 70 }, drift: 6, sizeNote: "About the size of an ear of corn", notes: ["Glowing and energetic. Folded into the Uzazi Salama nutrition programme."] },
  { code: "MW-2105", fullName: "Faith Wambui", firstName: "Faith", age: 38, week: 21, phone: "+254712210105", color: "#E9DFF0", base: { sys: 116, dia: 74, hr: 98 }, drift: 8, sizeNote: "About the size of a pomegranate", notes: ["Pulse runs high — suspected mild anaemia. Picked up ferrous sulfate today."] },
];

export const SOS_KINDS = ["Bleeding", "Labour", "Blurry vision", "Severe headache", "Swelling with pain"];

/* ------------------------------------------------------------------ */
/* Realism helpers                                                     */
/* ------------------------------------------------------------------ */

/** Nairobi hour-of-day (0–23). */
export function nairobiHour(date) {
  return (date.getUTCHours() + NAIROBI_UTC_OFFSET) % 24;
}

/** Diurnal systolic adjustment (Africa/Nairobi). */
export function diurnal(h) {
  if (h >= 2 && h < 5) return -4; // sleeping trough
  if (h >= 7 && h < 9) return 8; // morning peak
  if (h >= 9 && h < 11) return 4;
  if (h >= 12 && h < 14) return 2;
  if (h >= 18 && h < 21) return 7; // evening peak
  if (h >= 22) return -2;
  return 0;
}

const jitter = (n, span) => Math.round(n + (Math.random() * 2 - 1) * (span / 2));
const clamp = (n, lo, hi) => Math.min(hi, Math.max(lo, n));
/** zero-centred noise around any value: ±span/2 */
const noise = (span) => Math.round((Math.random() * 2 - 1) * (span / 2));

/** Realistic reading for a persona at a moment in time. */
export function readingFor(p, takenAt, weeksIn) {
  const h = nairobiHour(takenAt);
  const progress = Math.max(0, weeksIn) / 40;
  const sys = clamp(Math.round(p.base.sys + p.drift * progress + diurnal(h)) + noise(8), 88, 160);
  const dia = clamp(Math.round(p.base.dia + p.drift * 0.62 * progress + diurnal(h) * 0.5) + noise(6), 55, 105);
  const hr = clamp(Math.round(p.base.hr + (h >= 2 && h < 5 ? -5 : 0)) + noise(6) + (Math.random() < 0.1 ? 6 : 0), 55, 118);
  return { takenAt, systolic: sys, diastolic: dia, heartRate: hr, source: "AfyaBand" };
}

/** dueDate implied by a persona's current week. */
export function dueDateFor(p, now = Date.now()) {
  return new Date(now + (40 - p.week) * 7 * DAY);
}

/* ------------------------------------------------------------------ */
/* Seed-style backfill (used by prisma/seed.mjs)                       */
/* ------------------------------------------------------------------ */

/**
 * ~2 readings/day for the last 10 days (dense Hourly + Daily series), then
 * ~1 reading every other day reaching 45 days back (deep Weekly series).
 */
export function backfillFor(p) {
  const readings = [];
  const now = Date.now();
  for (let d = 45; d >= 0; d--) {
    const visits = d <= 10 ? (Math.random() < 0.8 ? 2 : 1) : Math.random() < 0.5 ? 1 : 0;
    for (let v = 0; v < visits; v++) {
      const hour = [7, 9, 12, 15, 18, 20, 21][Math.floor(Math.random() * 7)] + (v === 1 ? Math.floor(Math.random() * 3) : 0);
      const mins = Math.floor(Math.random() * 60);
      const takenAt = new Date(now - d * DAY);
      takenAt.setUTCHours(hour - NAIROBI_UTC_OFFSET, mins, 0, 0);
      if (takenAt.getTime() > now) takenAt.setTime(now - 60_000 - Math.floor(Math.random() * 600_000));
      const weeksIn = Math.max(1, p.week - d / 7);
      readings.push(readingFor(p, takenAt, weeksIn));
    }
  }
  return readings;
}

/** 2–3 upcoming appointments so the CHW "visits today" stat is live. */
export function appointmentsFor(p, now = Date.now()) {
  const defs = [
    { offsetDays: 0, hour: 14, label: "ANC CHECK-IN", place: "Kibera Health Centre" },
    { offsetDays: 3, hour: 10, label: "NEXT ANC VISIT", place: "Kibera Health Centre" },
    { offsetDays: 9, hour: 9, label: "NEXT ANC VISIT", place: "Kianda Kagar Health Centre" },
  ];
  return defs.slice(0, p.week >= 36 ? 2 : 3).map((a) => {
    const scheduledAt = new Date(now + a.offsetDays * DAY);
    scheduledAt.setUTCHours(a.hour - NAIROBI_UTC_OFFSET, 30, 0, 0);
    return { label: a.label, place: a.place, scheduledAt };
  });
}

/** Historic CHW notes, one every couple of days. */
export function notesFor(p, now = Date.now()) {
  return p.notes.map((body, i) => ({
    author: "Grace Wanjiru",
    body,
    createdAt: new Date(now - (i + 1) * 2 * DAY + Math.floor(Math.random() * DAY)),
  }));
}

/** Shared persona-specific tick copy. */
export const TICK_NOTES = {
  "MW-1048": ["Follow-up on supplements taken — all good.", "AfyaBand strap adjusted during visit, readings clean."],
  "MW-2101": ["BP still above the line — reviewing next steps with the clinic.", "Reminded about reduced salt and left-side rest."],
  "MW-2102": ["Routine check — no issues, very active.", "Her mother bought her a mosquito net during today's visit."],
  "MW-2103": ["Watch list: two borderline readings this week, monitor daily.", "Blood sugar normal; BP trending borderline-high."],
  "MW-2104": ["Everything steady at the nutrition session.", "Discussed birth plan options with her aunt present."],
  "MW-2105": ["Ferrous sulfate course continuing; pulse still high.", "Ordered a second pack of folic acid tablets."],
};

/* ------------------------------------------------------------------ */
/* Bot actions (all Prisma — usable in server routes and plain Node)   */
/* ------------------------------------------------------------------ */

/** Create any missing test-mother account (idempotent, self-healing). */
export async function ensureAccounts(db) {
  let created = 0;
  for (const p of PERSONAS) {
    const found = await db.mother.findUnique({ where: { code: p.code }, select: { id: true } });
    if (found) continue;
    const now = new Date();
    const readings = backfillFor(p);
    await db.mother.create({
      data: {
        code: p.code,
        fullName: p.fullName,
        firstName: p.firstName,
        age: p.age,
        phone: p.phone,
        color: p.color,
        dueDate: dueDateFor(p),
        device: "AfyaBand",
        sizeNote: p.sizeNote,
        simulated: true,
        readings: { create: readings },
        appointments: { create: appointmentsFor(p) },
        notes: { create: notesFor(p) },
      },
    });
    created++;
  }
  return created;
}

/** One live bot step. Returns a small report for the endpoint to log. */
export async function tick(db, { forceSos = false, forceMother = undefined } = {}) {
  const accountsEnsured = await ensureAccounts(db);
  const now = new Date();
  const h = nairobiHour(now);
  const awake = h >= 6 && h < 23;

  const mothers = await db.mother.findMany({
    where: { simulated: true },
    include: { readings: { orderBy: { takenAt: "desc" }, take: 1 } },
  });
  const byCode = Object.fromEntries(mothers.map((m) => [m.code, m]));

  let readingsAdded = 0;
  const notesAdded = [];
  const emergenciesRaised = [];

  for (const p of PERSONAS) {
    const mother = byCode[p.code];
    if (!mother) continue;
    const last = mother.readings[0];
    const minutesSince = last ? (now.getTime() - last.takenAt.getTime()) / 60_000 : Infinity;

    if (awake && minutesSince >= 18 && Math.random() < 0.75) {
      const weeksIn = Math.max(1, p.week);
      await db.vitalReading.create({ data: { motherId: mother.id, ...readingFor(p, now, weeksIn) } });
      readingsAdded++;
    }

    if (Math.random() < 0.06 && TICK_NOTES[p.code]) {
      const body = TICK_NOTES[p.code][Math.floor(Math.random() * TICK_NOTES[p.code].length)];
      const note = await db.visitNote.create({ data: { motherId: mother.id, author: "Grace Wanjiru", body } });
      notesAdded.push(note.body);
    }
  }

  const active = await db.emergency.findFirst({ where: { status: "active" } });
  const sosRoll = forceSos ? 1 : 0.12;
  if (awake && !active && Math.random() < sosRoll) {
    const mother = byCode["MW-2101"] ?? mothers.find((m) => m.simulated);
    if (mother) {
      const kind = SOS_KINDS[Math.floor(Math.random() * SOS_KINDS.length)];
      const created = await db.emergency.create({ data: { motherId: mother.id, kind, status: "active" } });
      emergenciesRaised.push({ id: created.id, motherCode: mother.code, kind });
    }
  }

  if (readingsAdded === 0) {
    // heartbeats pass left nothing — nudge one persona so charts keep moving
    const mother = mothers[Math.floor(Math.random() * mothers.length)];
    if (mother) {
      const persona = PERSONAS.find((x) => x.code === mother.code) ?? {
        code: mother.code, base: { sys: 110, dia: 70, hr: 76 }, drift: 8,
      };
      await db.vitalReading.create({ data: { motherId: mother.id, ...readingFor(persona, now, persona.week ?? 25) } });
      readingsAdded++;
    }
  }

  // Test hook: guarantee a fresh reading for one specific mother.
  if (forceMother) {
    const mother = mothers.find((m) => m.code === forceMother);
    if (mother) {
      const persona = PERSONAS.find((x) => x.code === mother.code);
      await db.vitalReading.create({ data: { motherId: mother.id, ...readingFor(persona ?? { base: { sys: 112, dia: 72, hr: 76 }, drift: 8 }, now, persona?.week ?? 25) } });
      readingsAdded++;
    }
  }

  return { accountsEnsured, readingsAdded, notesAdded, emergenciesRaised };
}
