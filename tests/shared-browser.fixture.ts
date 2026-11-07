// Private local-only credentials are written to a chmod600 file, never logged.
import { writeFileSync, readFileSync } from "node:fs";
import { randomBytes, randomUUID, randomInt } from "node:crypto";
import { db } from "../src/lib/db";
import { hashPassword, digestToken } from "../src/lib/credential-policy";
const url = new URL(process.env.DATABASE_URL ?? "");
if (url.hostname !== "localhost" || url.pathname !== "/afyanine") throw new Error("Local browser fixture only.");
const path = "/tmp/afyanine-browser-fixture.json";
async function main() {
try {
  if (process.argv.includes("--cleanup")) {
    const fixture = JSON.parse(readFileSync(path, "utf8"));
    const emails = Object.values(fixture).map((a: any) => a.email);
    const identities = await db.accountIdentity.findMany({ where: { email: { in: emails } }, select: { id: true } });
    const ids = identities.map(i => i.id);
    await db.careAudit.deleteMany({ where: { OR: [{ actorId: { in: ids } }, { motherId: { in: ids } }] } });
    await db.careBand.deleteMany({ where: { motherId: { in: ids } } });
    await db.careAlert.deleteMany({ where: { motherId: { in: ids } } });
    await db.careVital.deleteMany({ where: { motherId: { in: ids } } });
    await db.careContact.deleteMany({ where: { motherId: { in: ids } } });
    const visits = await db.careVisit.findMany({ where: { OR: [{ motherId: { in: ids } }, { chwId: { in: ids } }] }, select: { id: true } });
    await db.careNote.deleteMany({ where: { visitId: { in: visits.map(v => v.id) } } });
    await db.careVisit.deleteMany({ where: { id: { in: visits.map(v => v.id) } } });
    await db.careAccess.deleteMany({ where: { OR: [{ motherId: { in: ids } }, { viewerId: { in: ids } }] } });
    await db.careInvite.deleteMany({ where: { requesterId: { in: ids } } });
    await db.careAccount.deleteMany({ where: { id: { in: ids } } });
    await db.accountIdentity.deleteMany({ where: { id: { in: ids } } });
    await db.authThrottle.deleteMany({ where: { key: { in: emails.map(email => digestToken(`account:${email}`)) } } });
    console.log("Local fictional browser fixtures removed.");
  } else {
    const suffix = randomUUID().slice(0, 8);
    const fixture = Object.fromEntries(["mother", "chw", "operator"].map(role => [role, { email: `browser-${suffix}-${role}@example.test`, password: randomBytes(20).toString("hex"), phone: `+2547${randomInt(10000000,99999999)}`, name: `Fictional ${role} ${suffix}` }]));
    const identity = await db.accountIdentity.create({ data: { id: randomUUID(), email: fixture.operator.email, passwordHash: hashPassword(fixture.operator.password), displayName: "Fictional operations fixture", role: "CHW", operator: { create: { active: true } } } });
    writeFileSync(path, JSON.stringify(fixture), { mode: 0o600 });
    console.log("Private local-only browser fixture ready. Only the operator is pre-created; register the mother/CHW through the UI.");
  }
} finally { await db.$disconnect(); }
}
main().catch(() => { console.error("Local browser fixture failed; no credential values logged."); process.exitCode = 1; });
