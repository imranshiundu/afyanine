// Only synthetic fixtures in the isolated local database; no Auth emails sent.
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { db } from "../src/lib/db";
import { careCommand, careRecord, careWorkspace } from "../src/lib/care-workspace";
import { CareError, SCOPES, type CareActor } from "../src/lib/care-policy";

const url = new URL(process.env.DATABASE_URL ?? "");
assert(["localhost", "127.0.0.1"].includes(url.hostname) && url.pathname === "/afyanine", "Local isolated afyanine DB required");
const prefix = `care-test-${randomUUID()}`;
const actor = (name: string, admin = false, isDemo = true): CareActor => ({ id: `${prefix}-${name}`, email: `${prefix}-${name}@example.test`, admin, isDemo });
const mother = actor("mother"), chw = actor("chw"), partner = actor("partner"), other = actor("other"), admin = actor("admin", true), privateMother = actor("private", false, false);
const privateChw = actor("private-chw", false, false);
const actors = [mother, chw, partner, other, admin, privateMother, privateChw], ids = actors.map(a => a.id);
async function denied(action: Promise<unknown>, status = 403) { await assert.rejects(action, (e: unknown) => e instanceof CareError && e.status === status); }
const profile = (a: CareActor, role: "MOTHER" | "CHW" | "PARTNER") => careCommand(a, { action: "profile", role, displayName: `Fictional fixture ${role}`, locale: "EN", ...(role === "CHW" ? { institutionName: "Fictional institution", registrationNumber: "NOT-A-REAL-LICENSE", institutionContact: "Fictional office" } : {}) });
async function main() {
try {
  for (const [a, role] of [[mother, "MOTHER"], [chw, "CHW"], [partner, "PARTNER"], [other, "MOTHER"], [admin, "PARTNER"], [privateMother, "MOTHER"]] as const) await profile(a, role);
  if (process.env.CARE_RECORDS_ENABLED !== "true") {
    await profile(privateChw, "CHW");
    await careCommand(privateMother, { action: "consent", scopes: ["VITALS"] });
    await careCommand(privateChw, { action: "invite", kind: "CHW", email: privateMother.email, scopes: ["VITALS"] });
    await denied(careRecord(privateChw, privateMother.id));
    const request = (await careWorkspace(privateMother)).incoming![0];
    await careCommand(privateMother, { action: "respond", inviteId: request.id, accept: true, scopes: ["VITALS"] });
    assert.equal((await careWorkspace(privateChw)).stats!.activeMothers, 1);
    assert.deepEqual((await careRecord(privateChw, privateMother.id)).scopes, []);
    await denied(careCommand(privateMother, { action: "vital", systolic: 120, diastolic: 80, heartRate: 72 }), 503);
  }
  await careCommand(chw, { action: "invite", kind: "CHW", email: mother.email, scopes: SCOPES });
  await denied(careRecord(chw, mother.id)); // Registration/request alone must not grant access.
  await denied(careCommand(chw, { action: "profile", role: "MOTHER", displayName: "Fictional changed role", locale: "EN" }));
  await denied(careCommand(partner, { action: "verify", accountId: chw.id, verified: true }), 400);
  await careCommand(chw, { action: "profile", role: "CHW", displayName: "Fictional fixture CHW", locale: "SW", institutionName: "Fictional institution", registrationNumber: "NOT-A-REAL-LICENSE", institutionContact: "Fictional office" });
  const savedProfile = await db.careAccount.findUniqueOrThrow({ where: { id: chw.id } });
  assert.equal(savedProfile.locale, "SW"); assert.equal(savedProfile.verifiedAt, null, "Self-registration must not fabricate independent verification");
  await denied(careRecord(chw, mother.id));
  await denied(careRecord(chw, privateMother.id), 404);
  await denied(careCommand(admin, { action: "verify", accountId: privateMother.id, verified: true }), 400);
  await careCommand(mother, { action: "consent", scopes: SCOPES });
  await careCommand(mother, { action: "vital", systolic: 120, diastolic: 80, heartRate: 72 });
  await careCommand(mother, { action: "pregnancy", dueDate: "2027-03-01" });
  await careCommand(mother, { action: "contact", name: "Fictional contact", relationship: "Fictional family", phone: "000000000" });
  await careCommand(chw, { action: "invite", kind: "CHW", email: mother.email.toUpperCase(), scopes: SCOPES });
  let inbox = await careWorkspace(mother);
  const invitation = inbox.incoming![0];
  await denied(careCommand(other, { action: "respond", inviteId: invitation.id, accept: true, scopes: SCOPES }), 404);
  await careCommand(mother, { action: "respond", inviteId: invitation.id, accept: true, scopes: ["VITALS", "VISITS", "NOTES"] });
  const record = await careRecord(chw, mother.id);
  assert.equal(record.vitals.length, 1);
  assert(!("dueDate" in record.mother) && !("phone" in record.mother));
  assert.equal(record.contacts.length, 0);
  await careCommand(mother, { action: "invite", kind: "PARTNER", email: partner.email, scopes: ["VITALS"] });
  inbox = await careWorkspace(partner);
  await careCommand(partner, { action: "respond", inviteId: inbox.incoming![0].id, accept: true, scopes: [] });
  assert.deepEqual((await careRecord(partner, mother.id)).scopes, ["VITALS"]);
  const start = new Date(Date.now() + 86400000), end = new Date(+start + 3600000);
  const schedule = { action: "schedule", motherId: mother.id, startsAt: start.toISOString(), endsAt: end.toISOString(), place: "Fictional test clinic" };
  await denied(careCommand(partner, schedule));
  const simultaneous = await Promise.allSettled([careCommand(chw, schedule), careCommand(chw, schedule)]);
  assert.equal(simultaneous.filter(x => x.status === "fulfilled").length, 1, "Overlapping concurrent visits must not both commit");
  const visit = (await careRecord(chw, mother.id)).visits[0];
  assert.deepEqual((await careRecord(chw, mother.id, visit.id)).visits.map(row => row.id), [visit.id]);
  assert.deepEqual((await careRecord(chw, mother.id, "not-this-mothers-visit")).visits, []);
  assert.deepEqual((await careRecord(partner, mother.id, visit.id)).visits, [], "A vitals-only family grant must not reveal a selected visit");
  const oldVisits = Array.from({ length: 50 }, (_, index) => ({ id: `${prefix}-old-${index}`, motherId: mother.id, chwId: chw.id, startsAt: new Date(Date.UTC(2020, 0, index + 1, 8)), endsAt: new Date(Date.UTC(2020, 0, index + 1, 9)), place: "Historical fictional fixture", status: "CANCELLED" as const, isDemo: true }));
  await db.careVisit.createMany({ data: oldVisits });
  assert(!(await careRecord(chw, mother.id)).visits.some(row => row.id === oldVisits[0].id));
  assert.equal((await careRecord(chw, mother.id, oldVisits[0].id)).visits[0].id, oldVisits[0].id, "Selected authorized visits must work outside the recent50 window");
  await denied(careCommand(partner, { action: "note", visitId: visit.id, body: "Must not save" }));
  await denied(careCommand(chw, { action: "visitStatus", visitId: visit.id, status: "COMPLETED" }), 409);
  await careCommand(chw, { action: "note", visitId: visit.id, body: "Clearly fictional follow-up note." });
  assert.equal((await careRecord(chw, mother.id)).visits[0].notes[0].authorId, chw.id);
  await db.careVisit.update({ where: { id: visit.id }, data: { startsAt: new Date(Date.now() - 3600000), endsAt: new Date(Date.now() - 1800000) } });
  await careCommand(chw, { action: "visitStatus", visitId: visit.id, status: "COMPLETED" });
  assert.equal((await careWorkspace(chw)).stats!.completedVisits, 1);
  const grant = (await careWorkspace(mother)).access!.find(x => x.viewerId === chw.id)!;
  await careCommand(mother, { action: "revoke", accessId: grant.id });
  await denied(careRecord(chw, mother.id));
  await denied(careCommand(chw, { action: "note", visitId: visit.id, body: "Must not save after revoke" }));
  await denied(careCommand(mother, { action: "consent", scopes: ["VISITS", "NOTES", "CONTACTS", "PREGNANCY"] }), 409);
  assert.equal(await db.careVital.count({ where: { motherId: mother.id } }), 1);
  await careCommand(mother, { action: "consent", scopes: ["VISITS", "NOTES", "CONTACTS", "PREGNANCY"], confirmDelete: true });
  assert.equal(await db.careVital.count({ where: { motherId: mother.id } }), 0);
  await denied(careRecord(partner, mother.id));
  await careCommand(mother, { action: "purge", confirmDelete: true });
  assert.equal(await db.careContact.count({ where: { motherId: mother.id } }), 0);
  assert.equal(await db.careVisit.count({ where: { motherId: mother.id } }), 0);
  assert.equal((await db.careAccount.findUniqueOrThrow({ where: { id: mother.id } })).dueDate, null);
  await careCommand(other, { action: "consent", scopes: ["VISITS"] });
  await careCommand(chw, { action: "invite", kind: "CHW", email: other.email, scopes: ["VISITS"] });
  const nextInvite = (await careWorkspace(other)).incoming![0];
  await careCommand(other, { action: "respond", inviteId: nextInvite.id, accept: true, scopes: ["VISITS"] });
  assert.deepEqual((await careRecord(chw, other.id)).scopes, ["VISITS"]);
  await careCommand(chw, { action: "profile", role: "CHW", displayName: "Fictional fixture CHW", locale: "SW", institutionName: "Different fictional institution", registrationNumber: "NOT-A-REAL-LICENSE", institutionContact: "Fictional office" });
  assert.equal((await db.careAccount.findUniqueOrThrow({ where: { id: chw.id } })).verifiedAt, null);
  await denied(careRecord(chw, other.id)); // Profile changes cannot revive old maternal consent.
  await careCommand(other, { action: "invite", kind: "PARTNER", email: chw.email, scopes: ["VISITS"] });
  const familyInvite = (await careWorkspace(chw)).incoming![0];
  await careCommand(chw, { action: "respond", inviteId: familyInvite.id, accept: true, scopes: [] });
  assert.deepEqual((await careRecord(chw, other.id)).scopes, ["VISITS"]);
  await denied(careCommand(chw, { ...schedule, motherId: other.id })); // A verified CHW's partner grant is still read-only.
  const events = await db.careAudit.findMany({ where: { actorId: { in: ids } } });
  assert(events.length > 10);
  const serialized = JSON.stringify(events);
  assert(!serialized.includes("example.test") && !serialized.includes("Clearly fictional follow-up note.") && !serialized.includes("000000000"));
  console.log("PASS: self-registered CHW + mother approval, immutable roles, scoped/redacted partner/CHW reads, demo/account isolation, conflict locking, authored notes, visit completion, immediate revocation, consent deletion, purge and PHI-free audit");
} finally {
  await db.careNote.deleteMany({ where: { authorId: { in: ids } } });
  await db.careVisit.deleteMany({ where: { motherId: { in: ids } } });
  await db.careAccess.deleteMany({ where: { motherId: { in: ids } } });
  await db.careInvite.deleteMany({ where: { requesterId: { in: ids } } });
  await db.careContact.deleteMany({ where: { motherId: { in: ids } } });
  await db.careVital.deleteMany({ where: { motherId: { in: ids } } });
  await db.careAudit.deleteMany({ where: { actorId: { in: ids } } });
  await db.careAccount.deleteMany({ where: { id: { in: ids } } });
  await db.$disconnect();
}
}
main().catch(error => { console.error(error instanceof CareError ? error.code : error instanceof assert.AssertionError ? error.message : error.name); process.exitCode = 1; });
