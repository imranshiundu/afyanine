/**
 * AfyaNine server logic — turns Prisma rows into the exact shapes the
 * UI already renders (same field names as the static demo data).
 */
import { db } from "@/lib/db";
import type { RiskLevel } from "@/components/afyanine/data";

export const FLAGGED_CODE = "MW-1048";

/* ------------------------------------------------------------------ */
/* Pregnancy math                                                      */
/* ------------------------------------------------------------------ */

export function pregnancyOf(mother: { dueDate: Date }) {
  const msLeft = mother.dueDate.getTime() - Date.now();
  const daysLeft = Math.max(0, Math.round(msLeft / 86_400_000));
  const week = Math.min(40, Math.max(1, 40 - Math.ceil(daysLeft / 7)));
  const totalWeeks = 40;
  const trimester =
    week < 14 ? "First trimester" : week < 28 ? "Second trimester" : "Third trimester";
  return { week, totalWeeks, daysLeft, trimester };
}

export function riskOf(sys: number, dia: number): RiskLevel {
  if (sys >= 140 || dia >= 90) return "High Risk";
  if (sys >= 130 || dia >= 85) return "Watch";
  return "Normal";
}

export const initialsOf = (fullName: string) =>
  fullName
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

/* ------------------------------------------------------------------ */
/* Mother snapshot — home + vitals screens                             */
/* ------------------------------------------------------------------ */

export interface Series {
  labels: string[];
  systolic: number[];
  diastolic: number[];
  heart: number[];
  bpInsight: string;
  hrSummary: string;
}

const HOUR_LABELS = ["12 AM", "1 AM", "2 AM", "3 AM", "4 AM", "5 AM", "6 AM", "7 AM", "8 AM", "9 AM", "10 AM", "11 AM", "12 PM", "1 PM", "2 PM", "3 PM", "4 PM", "5 PM", "6 PM", "7 PM", "8 PM", "9 PM", "10 PM", "11 PM"];
const hourLabel = (d: Date) => HOUR_LABELS[d.getHours()];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

/** Bucket readings and take the last reading of each bucket. */
function bucketSeries(
  readings: Array<{ takenAt: Date; systolic: number; diastolic: number; heartRate: number }>,
  bucketOf: (d: Date) => string | null,
  limit: number,
  insight: (s: Series) => string,
): Series {
  const picked: Array<{ label: string; r: (typeof readings)[number] }> = [];
  for (const r of readings) {
    // readings come newest-first; first hit per bucket = latest of that bucket
    const label = bucketOf(r.takenAt);
    if (!label) continue;
    if (picked.some((p) => p.label === label)) continue;
    picked.push({ label, r });
    if (picked.length >= limit) break;
  }
  picked.reverse(); // chronological
  const series: Series = {
    labels: picked.map((p) => p.label),
    systolic: picked.map((p) => p.r.systolic),
    diastolic: picked.map((p) => p.r.diastolic),
    heart: picked.map((p) => p.r.heartRate),
    bpInsight: "",
    hrSummary: "",
  };
  series.bpInsight = insight(series);
  const lo = Math.min(...series.heart);
  const hi = Math.max(...series.heart);
  series.hrSummary = series.heart.length > 1 ? `Resting range ${lo}–${hi} bpm` : `Latest ${series.heart[0]} bpm`;
  return series;
}

export async function motherSnapshot(code: string) {
  const mother = await db.mother.findUnique({
    where: { code },
    include: { readings: { orderBy: { takenAt: "desc" }, take: 120 }, appointments: { orderBy: { scheduledAt: "asc" } } },
  });
  if (!mother?.simulated) return null;

  const preg = pregnancyOf(mother);
  const latest = mother.readings[0];
  if (!latest) return null;

  const today = new Date();
  const isToday = (d: Date) =>
    d.getFullYear() === today.getFullYear() && d.getMonth() === today.getMonth() && d.getDate() === today.getDate();

  const todays = mother.readings.filter((r) => isToday(r.takenAt));
  const peak = Math.max(...todays.map((r) => r.systolic), latest.systolic);

  const hourly = bucketSeries(
    todays.length ? todays : [latest],
    (d) => hourLabel(d),
    8,
    (s) => {
      const dip = peak - s.systolic[s.systolic.length - 1];
      if (dip > 2) return `Steady and healthy — ${dip} mmHg below today's peak of ${peak}.`;
      if (peak - 140 >= 0) return `Today's peak reached ${peak} — above the 140 danger line.`;
      return `Holding steady around ${s.systolic[s.systolic.length - 1]} today.`;
    },
  );

  const daily = bucketSeries(
    mother.readings,
    (d) => (isToday(d) ? "Today" : DAY_NAMES[d.getDay()]),
    7,
    (s) => {
      const avg = Math.round(s.systolic.reduce((a, b) => a + b, 0) / s.systolic.length);
      const avgDia = Math.round(s.diastolic.reduce((a, b) => a + b, 0) / s.diastolic.length);
      return `Averaging ${avg}/${avgDia} this week — ${avg < 130 ? "inside the healthy band." : "above the healthy band."}`;
    },
  );

  const weekly = bucketSeries(
    mother.readings,
    (d) => {
      const wk = Math.min(preg.week, Math.max(1, preg.week - Math.floor((Date.now() - d.getTime()) / (7 * 86_400_000))));
      return `W${wk}`;
    },
    6,
    (s) => {
      const first = s.systolic[0];
      const last = s.systolic[s.systolic.length - 1];
      const rise = last - first;
      if (rise > 6) return `A rise of ${rise} mmHg over six weeks — expected as baby grows.`;
      return "Mild, expected rise through the trimesters.";
    },
  );

  const nextAppointment = mother.appointments.find((a) => a.scheduledAt.getTime() >= Date.now() - 12 * 3_600_000) ?? null;

  const hrValues = mother.readings.slice(0, 14).map((r) => r.heartRate);

  return {
    mother: {
      code: mother.code,
      firstName: mother.firstName,
      fullName: mother.fullName,
      device: mother.device,
      sizeNote: mother.sizeNote,
      ...preg,
    },
    appointment: nextAppointment
      ? {
          label: nextAppointment.label,
          place: nextAppointment.place,
          scheduledAt: nextAppointment.scheduledAt.toISOString(),
        }
      : null,
    current: {
      systolic: latest.systolic,
      diastolic: latest.diastolic,
      heartRate: latest.heartRate,
      heartLow: Math.min(...hrValues),
      heartHigh: Math.max(...hrValues),
      device: mother.device,
      synced: Math.max(0, Math.floor((Date.now() - latest.takenAt.getTime()) / 60_000)) < 1
        ? "just now" : `${Math.max(0, Math.floor((Date.now() - latest.takenAt.getTime()) / 60_000))} min ago`,
      takenAt: latest.takenAt.toISOString(),
    },
    series: { Hourly: hourly, Daily: daily, Weekly: weekly },
  };
}

/* ------------------------------------------------------------------ */
/* CHW register                                                        */
/* ------------------------------------------------------------------ */

export async function patientsPayload() {
  const mothers = await db.mother.findMany({
    where: { simulated: true },
    include: { readings: { orderBy: { takenAt: "desc" }, take: 1 } },
    orderBy: { code: "asc" },
  });

  const patients = mothers
    .map((m) => {
      const r = m.readings[0];
      if (!r) return null;
      const preg = pregnancyOf(m);
      return {
        id: m.code,
        initials: initialsOf(m.fullName),
        name: m.fullName,
        week: `${preg.week} weeks`,
        age: m.age,
        bp: `${r.systolic}/${r.diastolic}`,
        systolic: r.systolic,
        diastolic: r.diastolic,
        risk: riskOf(r.systolic, r.diastolic),
        color: m.color,
      };
    })
    .filter(Boolean)
    // flag the teaching case first, then by risk, then by code
    .sort((a, b) => {
      const rank = (p: { id: string; risk: string }) =>
        (p.id === FLAGGED_CODE ? -10 : 0) +
        (p.risk === "High Risk" ? -3 : p.risk === "Watch" ? -2 : 0);
      return rank(a!) - rank(b!) || a!.id.localeCompare(b!.id);
    });

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);
  const visits = await db.appointment.count({
    where: { mother: { simulated: true }, scheduledAt: { gte: startOfToday, lt: new Date(startOfToday.getTime() + 86_400_000) } },
  });

  const emergency = await db.emergency.findFirst({
    where: { status: "active", mother: { simulated: true } },
    orderBy: { createdAt: "desc" },
    include: { mother: true },
  });

  return {
    patients,
    chw: {
      firstName: "Grace",
      stats: {
        patients: patients.length,
        attention: patients.filter((p) => p && p.risk !== "Normal").length,
        visits,
      },
    },
    emergency: emergency
      ? {
          kind: emergency.kind,
          who: `${emergency.mother.fullName} needs help`,
          where: "Kibera · Ambulance arriving in 8 min",
          motherCode: emergency.mother.code,
          createdAt: emergency.createdAt.toISOString(),
        }
      : null,
  };
}

/* ------------------------------------------------------------------ */
/* Patient detail + AI alert                                           */
/* ------------------------------------------------------------------ */

export async function patientDetail(code: string) {
  const mother = await db.mother.findUnique({
    where: { code },
    include: {
      readings: { orderBy: { takenAt: "desc" }, take: 30 },
      notes: { orderBy: { createdAt: "desc" }, take: 10 },
    },
  });
  if (!mother?.simulated) return null;

  const latest = mother.readings[0];
  if (!latest) return null;
  const preg = pregnancyOf(mother);

  /* Derive the AI alert from the readings themselves */
  const last3 = mother.readings.slice(0, 3);
  const rising = last3.length === 3 && last3[0].systolic >= last3[2].systolic;
  const allHigh = last3.length === 3 && last3.every((r) => r.systolic >= 140 || r.diastolic >= 90);
  const alert =
    allHigh && rising
      ? {
          label: `AFYANINE AI ALERT · TODAY, ${fmtTime(mother.readings[0].takenAt)}`,
          title: "High Risk: Possible Preeclampsia" as const,
          reason: `Blood pressure has remained above 140/90 for the past ${last3.length} readings, with a rising trend.`,
          latestBp: `${latest.systolic}/${latest.diastolic}`,
          trend: trendPct(mother.readings),
          trendLabel: "7-day increase",
        }
      : null;

  /* 7-day trend for the chart (last reading per day) */
  const days: Array<{ label: string; sys: number }> = [];
  for (const r of mother.readings) {
    const key = r.takenAt.toDateString();
    if (days.some((d) => d.label === key)) continue;
    days.push({ label: key, sys: r.systolic });
    if (days.length >= 7) break;
  }
  days.reverse();
  const axis = days.map((d, i) =>
    i === days.length - 1 ? "Today" : `${d.label.split(" ")[2]} ${d.label.split(" ")[1]}`,
  );

  const trendValues = days.map((d) => d.sys);
  const headline =
    Math.max(...trendValues) >= 140
      ? "Elevated and rising"
      : trendValues[trendValues.length - 1] - trendValues[0] > 4
        ? "Creeping upward"
        : "Stable this week";

  return {
    patient: {
      id: mother.code,
      initials: initialsOf(mother.fullName),
      name: mother.fullName,
      week: `${preg.week} weeks`,
      age: mother.age,
      bp: `${latest.systolic}/${latest.diastolic}`,
      systolic: latest.systolic,
      diastolic: latest.diastolic,
      risk: riskOf(latest.systolic, latest.diastolic),
      color: mother.color,
    },
    alert,
    trend: {
      axis,
      series: trendValues,
      threshold: 140,
      headline,
      status: riskOf(latest.systolic, latest.diastolic) === "High Risk" ? "High" : riskOf(latest.systolic, latest.diastolic),
      labels: days.map((d, i) => (i === days.length - 1 ? "Today" : `${d.label.split(" ")[2]} ${d.label.split(" ")[1]}`)),
    },
    notes: mother.notes.map((n) => ({
      id: n.id,
      author: n.author,
      body: n.body,
      createdAt: n.createdAt.toISOString(),
    })),
  };
}

function trendPct(readings: Array<{ takenAt: Date; systolic: number }>) {
  const last = readings[0].systolic;
  const weekAgo = readings.filter((r) => Date.now() - r.takenAt.getTime() <= 8 * 86_400_000);
  const first = weekAgo[weekAgo.length - 1]?.systolic ?? last;
  const pct = Math.round(((last - first) / first) * 100);
  return `${pct >= 0 ? "+" : ""}${pct}%`;
}

export const fmtTime = (d: Date) =>
  d.toLocaleTimeString("en-KE", { hour: "numeric", minute: "2-digit", hour12: true }).toUpperCase();
