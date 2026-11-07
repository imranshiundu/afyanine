/**
 * AfyaNine test-ward seeder — creates the teaching case + five bot-simulated
 * mothers with realistic, individually-personalised vitals history.
 * All realism logic lives in src/lib/bot-sim.mjs (single source of truth).
 *
 *   npm run db:seed      (DATABASE_URL from .env — Supabase Postgres)
 */
import { PrismaClient } from "@prisma/client";
import { PERSONAS, backfillFor, dueDateFor, appointmentsFor, notesFor } from "../src/lib/bot-sim.mjs";

const db = new PrismaClient();

async function main() {
  let readingsAdded = 0;
  let appointmentsAdded = 0;
  for (const p of PERSONAS) {
    const existing = await db.mother.findUnique({ where: { code: p.code }, select: { id: true } });
    if (existing) {
      console.log(`• ${p.code} already exists — skipping (idempotent)`);
      continue;
    }
    const readings = backfillFor(p);
    const appts = appointmentsFor(p);
    const notes = notesFor(p);
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
        appointments: { create: appts },
        notes: { create: notes },
      },
    });
    readingsAdded += readings.length;
    appointmentsAdded += appts.length;
    console.log(`✓ ${p.code} ${p.fullName} — ${readings.length} readings, ${appts.length} appointments, ${notes.length} notes`);
  }
  console.log(`\nSeeded. readings=${readingsAdded} appointments=${appointmentsAdded}`);
}

main()
  .then(() => db.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await db.$disconnect();
    process.exit(1);
  });
