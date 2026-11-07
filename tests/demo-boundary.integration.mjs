// Requires the isolated local Postgres + running dev app. Never runs on cloud DBs.
import { PrismaClient } from "@prisma/client";
import assert from "node:assert/strict";
const database = new URL(process.env.DATABASE_URL ?? "postgresql://invalid/");
const base = new URL(process.env.BASE_URL ?? "http://localhost:3000");
assert.ok(["localhost", "127.0.0.1"].includes(database.hostname) && database.pathname === "/afyanine", "Refusing to write fixtures outside isolated local afyanine DB.");
assert.ok(["localhost", "127.0.0.1"].includes(base.hostname), "Integration URL must be local.");
const db = new PrismaClient();
let id;
try {
  let code;
  for (let n = 9900; n <= 9999; n++) {
    const candidate = `MW-${n}`;
    if (!await db.mother.findUnique({ where: { code: candidate } })) { code = candidate; break; }
  }
  assert.ok(code, "No unused fixture code.");
  const mother = await db.mother.create({ data: {
    code, fullName: "Access Boundary Fixture — not a person", firstName: "Fixture", age: 0,
    phone: "000000000", color: "#aaa", dueDate: new Date(), simulated: false,
    readings: { create: { takenAt: new Date(), systolic: 110, diastolic: 70, heartRate: 75 } },
    emergencies: { create: { kind: "ACCESS TEST ONLY", status: "active" } },
  }, include: { emergencies: true } });
  id = mother.id;
  const emergencyId = mother.emergencies[0].id;
  const request = (path, body) => fetch(new URL(path, base), body === undefined ? {} : {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
  });
  for (const path of [`/api/mother?code=${code}`, `/api/patients/${code}`]) assert.equal((await request(path)).status, 404);
  const mothers = await (await request("/api/mothers")).json();
  assert.equal(mothers.mothers.some(m => m.code === code), false);
  const patients = await (await request("/api/patients")).json();
  assert.equal(patients.patients.some(p => p.id === code), false);
  assert.notEqual(patients.emergency?.motherCode, code);
  for (const [path, body] of [
    ["/api/demo/reading", { code }],
    ["/api/emergencies", { motherCode: code, kind: "Blocked test" }],
    ["/api/emergencies/resolve", { id: emergencyId }],
    [`/api/patients/${code}/notes`, { body: "Blocked fixture note" }],
  ]) assert.equal((await request(path, body)).status, 404, path);
  assert.equal(await db.vitalReading.count({ where: { motherId: id } }), 1);
  assert.equal(await db.visitNote.count({ where: { motherId: id } }), 0);
  assert.equal((await db.emergency.findUnique({ where: { id: emergencyId } })).status, "active");
  console.log("PASS: non-simulated fixture excluded from lists, reads, notes, simulation and emergency mutations.");
} finally {
  if (id) await db.mother.delete({ where: { id } });
  await db.$disconnect();
}
