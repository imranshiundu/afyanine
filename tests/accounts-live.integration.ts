import assert from "node:assert/strict";
import { randomBytes, randomInt, randomUUID } from "node:crypto";
import { db } from "../src/lib/db";
import { authenticateAccount, accountIdentity, SESSION_COOKIE, sameOrigin, secureCookie } from "../src/lib/account-auth";
import { digestToken } from "../src/lib/credential-policy";
import { careCommand, careRecord, careWorkspace } from "../src/lib/care-workspace";
import { careActor } from "../src/lib/care-auth";
import { GET as live } from "../src/app/api/live/route";
import { CareError } from "../src/lib/care-policy";

const url = new URL(process.env.DATABASE_URL ?? "");
assert(url.hostname === "localhost" && url.pathname === "/afyanine", "Local fixtures only");
process.env.CARE_RECORDS_ENABLED = "true";
const prefix = `live-${randomUUID()}`;
const password = randomBytes(18).toString("hex");
const phone = `+2547${randomInt(10000000, 99999999)}`;
const ids: string[] = [];
const emails = ["mother", "chw", "other"].map(role => `${prefix}-${role}@example.test`);
const controller = new AbortController();
let reader: ReadableStreamDefaultReader<Uint8Array> | undefined;
const denied = async (promise: Promise<unknown>, status = 403) => assert.rejects(promise, (e: unknown) => e instanceof CareError && e.status === status);
async function main() {
try {
  const register = async (n: number, role: "MOTHER" | "CHW") => {
    const result = await authenticateAccount({ mode: "signup", email: emails[n], phone: n === 0 ? phone : `+2547${randomInt(10000000, 99999999)}`, password, name: `Fictional live ${role} ${n}`, role });
    ids.push(result.user.id);
    const request = new Request("http://localhost/api/live", { headers: { Cookie: `${SESSION_COOKIE}=${result.token}` }, signal: controller.signal });
    return { result, request, actor: await careActor(request) };
  };
  const mother = await register(0, "MOTHER"), chw = await register(1, "CHW"), other = await register(2, "CHW");
  await authenticateAccount({ mode: "signin", email: emails[0].toUpperCase(), password }); // NO phone required.
  const stored = await db.accountIdentity.findUniqueOrThrow({ where: { id: ids[0] } });
  assert(stored.passwordHash !== password);
  assert.throws(() => sameOrigin(new Request("http://localhost/api/account", { headers: { Origin: "https://evil.example" } })));
  const proxied = new Request("http://0.0.0.0:3000/api/account", { headers: { Host: "afya.example.test", Origin: "https://afya.example.test", "X-Forwarded-Proto": "https" } });
  sameOrigin(proxied);
  assert.equal(secureCookie(proxied), true);
  await denied(accountIdentity(new Request("http://localhost/api/live")), 401);
  await careCommand(mother.actor, { action: "profile", displayName: "Fictional live mother", role: "MOTHER", locale: "EN", phone });
  for (const person of [chw, other]) await careCommand(person.actor, { action: "profile", displayName: "Fictional live CHW", role: "CHW", locale: "EN", institutionName: "Fictional clinic", registrationNumber: "TEST-NOT-A-LICENSE", institutionContact: "Fictional contact" });
  await denied(careCommand(mother.actor, { action: "profile", displayName: "Wrong role", role: "CHW", locale: "EN" }));
  await careCommand(mother.actor, { action: "consent", scopes: ["VITALS"] });
  await careCommand(chw.actor, { action: "invite", phone: phone.replace("+254", "0"), kind: "CHW", scopes: ["VITALS"] });
  await denied(careRecord(chw.actor, mother.actor.id));
  const invite = (await careWorkspace(mother.actor)).incoming![0];
  await denied(careCommand(other.actor, { action: "respond", inviteId: invite.id, accept: true, scopes: ["VITALS"] }), 404);
  await careCommand(mother.actor, { action: "respond", inviteId: invite.id, accept: true, scopes: ["VITALS"] });
  assert.deepEqual((await careRecord(chw.actor, mother.actor.id)).scopes, ["VITALS"]);
  // Open the actual SSE route with a CHW session, not a public demo actor.
  const response = await live(chw.request);
  assert.equal(response.headers.get("content-type"), "text/event-stream");
  reader = response.body!.getReader();
  let events = "";
  const readUntil = async (fragment: string) => {
    const timeout = setTimeout(() => controller.abort(), 10000);
    try {
      while (!events.includes(fragment)) {
        const part = await reader!.read();
        assert(!part.done, "Stream unexpectedly closed");
        events += new TextDecoder().decode(part.value);
      }
    } finally { clearTimeout(timeout); }
  };
  await readUntil("event: workspace");
  assert(!events.includes("passwordHash") && !events.includes(password));
  events = "";
  await careCommand(mother.actor, { action: "sos", kind: "Urgent help" });
  await readUntil("Urgent help");
  assert.equal((await careWorkspace(other.actor)).alerts!.length, 0, "Unconnected CHW must not see alert");
  assert.equal((await careWorkspace(chw.actor)).alerts!.length, 1);
  await careCommand(mother.actor, { action: "sos", kind: "Bleeding" });
  assert.equal(await db.careAlert.count({ where: { motherId: mother.actor.id, active: true } }), 1);
  const initial = await db.careVital.count({ where: { motherId: mother.actor.id } });
  await db.$queryRaw`SELECT public.afyanine_simulate_bands()`;
  assert.equal(await db.careVital.count({ where: { motherId: mother.actor.id } }), initial, "No band => no synthetic readings");
  await careCommand(mother.actor, { action: "bindBand", serial: `SIM-${prefix.slice(0, 32).toUpperCase()}` });
  await db.$queryRaw`SELECT public.afyanine_simulate_bands()`;
  await db.$queryRaw`SELECT public.afyanine_simulate_bands()`;
  const record = await careRecord(chw.actor, mother.actor.id);
  assert.equal(record.vitals.length, initial + 1);
  assert.equal(record.vitals[0].source, "SIMULATED_BAND");
  assert(record.band);
  await careCommand(mother.actor, { action: "unbindBand" });
  await db.$queryRaw`SELECT public.afyanine_simulate_bands()`;
  assert.equal(await db.careVital.count({ where: { motherId: mother.actor.id } }), initial + 1);
  const grant = (await careWorkspace(mother.actor)).access![0];
  events = "";
  await careCommand(mother.actor, { action: "revoke", accessId: grant.id });
  await readUntil('"alerts":[]');
  await denied(careRecord(chw.actor, mother.actor.id));
  await denied(careCommand(chw.actor, { action: "resolveAlert", alertId: (await careWorkspace(mother.actor)).alerts![0].id }));
  await db.accountSession.updateMany({ where: { identityId: mother.actor.id }, data: { expiresAt: new Date(0) } });
  await denied(accountIdentity(mother.request), 401);
  await db.accountSession.deleteMany({ where: { identityId: chw.actor.id } });
  await denied(accountIdentity(chw.request), 401);
  for (let n = 0; n < 5; n++) await denied(authenticateAccount({ mode: "signin", email: emails[2], password: "intentionally incorrect" }), 401);
  await denied(authenticateAccount({ mode: "signin", email: emails[2], password }), 429);
  console.log("PASS: email/password sign-in without phone, salted credentials, cookie session expiry/revocation, CSRF rejection, persistent throttling, phone invitation approval, private cross-client SSE SOS, access revocation, bound-only labeled band simulation and unbind");
} finally {
  controller.abort();
  await reader?.cancel().catch(() => {});
  await db.careAlert.deleteMany({ where: { motherId: { in: ids } } });
  await db.careBand.deleteMany({ where: { motherId: { in: ids } } });
  await db.careVital.deleteMany({ where: { motherId: { in: ids } } });
  await db.careAccess.deleteMany({ where: { OR: [{ motherId: { in: ids } }, { viewerId: { in: ids } }] } });
  await db.careInvite.deleteMany({ where: { requesterId: { in: ids } } });
  await db.careAudit.deleteMany({ where: { actorId: { in: ids } } });
  await db.careAccount.deleteMany({ where: { id: { in: ids } } });
  await db.accountIdentity.deleteMany({ where: { id: { in: ids } } });
  await db.authThrottle.deleteMany({ where: { key: { in: emails.map(email => digestToken(`account:${email}`)) } } });
  await db.$disconnect();
}
}
main().catch(error => {
  console.error("FAIL:", error instanceof CareError ? error.code : error.name);
  console.error(String(error.stack).split("\n").filter(line => /^\s+at /.test(line)).join("\n"));
  process.exitCode = 1;
});
