/**
 * AfyaNine seed — idempotent, dates relative to "now" so the demo
 * always shows a live-looking register (week 28, rising BP, an active
 * emergency, today's visits...).
 *
 * Run: bun prisma/seed.ts
 */
import { PrismaClient } from "@prisma/client";

const db = new PrismaClient();

const DAY = 86_400_000;
const now = new Date();
const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());

const at = (dayOffset: number, hour: number, minute = 0) =>
  new Date(startOfToday.getTime() + dayOffset * DAY + hour * 3_600_000 + minute * 60_000);

interface SeedMother {
  code: string;
  fullName: string;
  firstName: string;
  age: number;
  phone: string;
  color: string;
  weeksPregnant: number;
  /** readings: [dayOffset, hour, sys, dia, hr] */
  readings: Array<[number, number, number, number, number]>;
  appointment?: { label: string; place: string; when: Date } | null;
  note?: { author: string; body: string; daysAgo: number };
}

/** Wanjiku — the flagged preeclampsia case. Hourly curve for today,
 *  daily anchors for the past week, weekly anchors for the pregnancy. */
const WANJIKU_READINGS: Array<[number, number, number, number, number]> = [
  // weekly anchors (W23 → W27 of pregnancy)
  [-35, 9, 108, 64, 74],
  [-28, 9, 110, 66, 75],
  [-21, 9, 112, 68, 77],
  [-14, 9, 114, 70, 78],
  [-7, 9, 116, 72, 80],
  // daily trend, 12 Jun → 17 Jun equivalents
  [-6, 9, 132, 84, 78],
  [-5, 10, 134, 85, 79],
  [-4, 9, 136, 86, 80],
  [-3, 11, 135, 86, 77],
  [-2, 9, 141, 88, 81],
  [-1, 10, 145, 90, 83],
  // today, hourly 6 AM → NOW — the preeclampsia curve, ending at 148/96
  [0, 6, 138, 88, 78],
  [0, 8, 141, 89, 80],
  [0, 10, 143, 90, 79],
  [0, 12, 144, 90, 84],
  [0, 14, 146, 91, 79],
  [0, 15, 148, 96, 82],
];

const MOTHERS: SeedMother[] = [
  {
    code: "MW-1048",
    fullName: "Wanjiku Gathoni",
    firstName: "Wanjiku",
    age: 29,
    phone: "712 345 678",
    color: "#B98F70",
    weeksPregnant: 28,
    readings: WANJIKU_READINGS,
    appointment: { label: "NEXT ANC VISIT", place: "Kibera Health Centre", when: nextWeekday(2, 10, 30) },
    note: {
      author: "Grace Wanjiru",
      body: "Discussed salt reduction and resting on her left side. Recheck BP on Friday during home visit.",
      daysAgo: 2,
    },
  },
  {
    code: "MW-1032",
    fullName: "Amina Mohamed",
    firstName: "Amina",
    age: 26,
    phone: "722 410 552",
    color: "#7A9084",
    weeksPregnant: 34,
    readings: [[0, 8, 122, 78, 80], [-3, 9, 119, 76, 78], [-7, 9, 121, 77, 79]],
    appointment: { label: "ANC CHECK", place: "Ushirika Medical Clinic", when: at(0, 14, 0) },
  },
  {
    code: "MW-1051",
    fullName: "Njeri Otieno",
    firstName: "Njeri",
    age: 31,
    phone: "733 210 884",
    color: "#A78471",
    weeksPregnant: 22,
    readings: [[0, 7, 116, 74, 75], [-4, 9, 114, 73, 76]],
    appointment: { label: "ANC CHECK", place: "Kibera Health Centre", when: at(0, 9, 30) },
  },
  {
    code: "MW-0987",
    fullName: "Faith Kamau",
    firstName: "Faith",
    age: 24,
    phone: "745 908 331",
    color: "#8A7775",
    weeksPregnant: 37,
    readings: [[0, 8, 139, 89, 84], [-2, 9, 137, 88, 82], [-6, 9, 134, 86, 80]],
    appointment: { label: "ANC CHECK", place: "Mbagathi Hospital", when: at(0, 11, 0) },
  },
  {
    code: "MW-1102",
    fullName: "Sarah Achieng",
    firstName: "Sarah",
    age: 27,
    phone: "701 552 490",
    color: "#A0926C",
    weeksPregnant: 18,
    readings: [[0, 9, 118, 76, 77], [-5, 9, 116, 74, 75]],
  },
  ...extraMothers(),
];

/** Two more "needs attention" patients + the rest of the register. */
function extraMothers(): SeedMother[] {
  const rest: Array<[string, string, number, number, string, number, number, number]> = [
    // code, name, age, week, color, sys, dia, hr  (latest reading)
    ["MW-1077", "Halima Yusuf", 33, 31, "#8F9A6C", 142, 92, 88],
    ["MW-1019", "Mercy Wafula", 22, 26, "#B37D6B", 138, 87, 81],
    ["MW-0964", "Joy Njoki", 28, 20, "#7D8FA3", 121, 79, 78],
    ["MW-1088", "Esther Mumbi", 35, 32, "#9A8B58", 115, 72, 74],
    ["MW-1055", "Zawadi Njeri", 24, 15, "#A3707F", 110, 70, 72],
    ["MW-1121", "Beatrice Wairimu", 30, 36, "#6F8F7A", 126, 80, 79],
    ["MW-0999", "Nafula Awuor", 26, 24, "#A98F62", 118, 75, 76],
    ["MW-1043", "Kanini Muthoni", 31, 29, "#8B7D93", 112, 71, 73],
    ["MW-1110", "Sharon Chebet", 23, 17, "#77937F", 117, 74, 75],
    ["MW-0971", "Purity Nyambura", 29, 33, "#9F7A5E", 124, 78, 77],
    ["MW-1132", "Diana Kemunto", 27, 21, "#7A8C99", 119, 76, 78],
    ["MW-1085", "Lydia Atieno", 34, 38, "#B0895F", 128, 82, 80],
    ["MW-1026", "Gloria Ndanu", 25, 16, "#87966B", 113, 70, 71],
    ["MW-1094", "Winnie Osewe", 32, 27, "#98706E", 122, 77, 76],
    ["MW-1008", "Caroline Muthoka", 28, 19, "#6E8E83", 111, 69, 72],
    ["MW-1067", "Rehema Juma", 30, 30, "#A5836F", 120, 75, 74],
    ["MW-1119", "Millicent Awino", 21, 14, "#8F7C63", 116, 73, 75],
    ["MW-0958", "Teresia Kariuki", 36, 35, "#7B8E70", 130, 83, 79],
    ["MW-1140", "Faith Chelangat", 24, 23, "#977F86", 114, 71, 73],
  ];
  return rest.map(([code, fullName, age, week, color, sys, dia, hr]) => ({
    code,
    fullName,
    firstName: fullName.split(" ")[0],
    age,
    phone: `7${String(hash(code) % 900 + 100).slice(0, 3)} ${String(hash(code + "a") % 900 + 100).slice(0, 3)} ${String(hash(code + "b") % 900 + 100).slice(0, 3)}`,
    color,
    weeksPregnant: week,
    readings: [
      [0, 8, sys, dia, hr],
      [-3, 9, Math.max(95, sys - 3), Math.max(60, dia - 2), hr - 1],
      [-8, 9, Math.max(95, sys - 5), Math.max(60, dia - 4), hr - 2],
    ] as Array<[number, number, number, number, number]>,
    appointment:
      hash(code) % 3 === 0
        ? { label: "ANC CHECK", place: "Kibera Health Centre", when: at(0, 8 + (hash(code) % 6)) }
        : null,
  }));
}

function hash(s: string) {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) >>> 0;
  return h;
}

/** Next given weekday (0=Sun … 2=Tue), anchored in the future. */
function nextWeekday(weekday: number, hour: number, minute: number) {
  const d = new Date(startOfToday);
  const delta = (weekday - d.getDay() + 7) % 7 || 7;
  d.setDate(d.getDate() + delta);
  d.setHours(hour, minute, 0, 0);
  return d;
}

async function main() {
  for (const m of MOTHERS) {
    const dueDate = new Date(startOfToday.getTime() + (40 - m.weeksPregnant) * 7 * DAY);

    const mother = await db.mother.upsert({
      where: { code: m.code },
      create: {
        code: m.code,
        fullName: m.fullName,
        firstName: m.firstName,
        age: m.age,
        phone: m.phone,
        color: m.color,
        dueDate,
      },
      update: { dueDate, color: m.color, firstName: m.firstName, age: m.age },
    });

    // Re-seed readings only if this mother has none (keeps user-made data).
    const existing = await db.vitalReading.count({ where: { motherId: mother.id } });
    if (existing === 0) {
      await db.vitalReading.createMany({
        data: m.readings.map(([d, h, sys, dia, hr]) => ({
          motherId: mother.id,
          takenAt: at(d, h),
          systolic: sys,
          diastolic: dia,
          heartRate: hr,
        })),
      });
    }

    if (m.appointment) {
      const has = await db.appointment.count({
        where: { motherId: mother.id, place: m.appointment.place },
      });
      if (has === 0) {
        await db.appointment.create({
          data: {
            motherId: mother.id,
            label: m.appointment.label,
            place: m.appointment.place,
            scheduledAt: m.appointment.when,
          },
        });
      }
    }

    if (m.note) {
      const has = await db.visitNote.count({ where: { motherId: mother.id, body: m.note.body } });
      if (has === 0) {
        await db.visitNote.create({
          data: {
            motherId: mother.id,
            author: m.note.author,
            body: m.note.body,
            createdAt: at(-m.note.daysAgo, 12),
          },
        });
      }
    }
  }

  // One active emergency so the CHW banner is alive on first load.
  const wanjiku = await db.mother.findUniqueOrThrow({ where: { code: "MW-1048" } });
  const activeEmergency = await db.emergency.findFirst({
    where: { motherId: wanjiku.id, status: "active" },
  });
  if (!activeEmergency) {
    await db.emergency.create({
      data: {
        motherId: wanjiku.id,
        kind: "Baby not moving",
        status: "active",
        createdAt: new Date(now.getTime() - 4 * 60_000),
      },
    });
  }

  const counts = {
    mothers: await db.mother.count(),
    readings: await db.vitalReading.count(),
    appointments: await db.appointment.count(),
    notes: await db.visitNote.count(),
    emergencies: await db.emergency.count({ where: { status: "active" } }),
  };
  console.log("Seed complete:", counts);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
