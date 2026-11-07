import assert from "node:assert/strict";
import { randomBytes, randomInt, randomUUID } from "node:crypto";
import { spawn } from "node:child_process";
import { performance } from "node:perf_hooks";
import { io, type Socket } from "socket.io-client";
import { db } from "../src/lib/db";
import { authenticateAccount } from "../src/lib/account-auth";
import { digestToken } from "../src/lib/credential-policy";
import { signTicket } from "../src/lib/socket-auth";
import { careCommand, careWorkspace } from "../src/lib/care-workspace";
import { opsLive, opsCommand } from "../src/lib/ops-live";
import type { CareActor } from "../src/lib/care-policy";
const url = new URL(process.env.DATABASE_URL ?? "");
assert(url.hostname === "localhost" && url.pathname === "/afyanine", "Local fictional fixtures only.");
process.env.CARE_RECORDS_ENABLED = "true";
process.env.SOCKET_TICKET_SECRET = randomBytes(32).toString("hex");
const origin = "http://socket-fixture.example.test";
const prefix = `sockets-${randomUUID()}`, password = randomBytes(20).toString("hex");
const ids: string[] = [], emails: string[] = [], sockets: Socket[] = [];
const worker = spawn(process.execPath, ["--import", "tsx", "mini-services/realtime.ts"], { env: { ...process.env, REALTIME_PORT: "3013", REALTIME_ALLOWED_ORIGINS: origin }, stdio: ["ignore", "pipe", "pipe"] });
const nextSnapshot = (socket: Socket, predicate: (value: any) => boolean = () => true) => new Promise<any>((resolve, reject) => {
  const timer = setTimeout(() => { socket.off("snapshot", handler); reject(new Error("Timed out waiting for a scoped database snapshot.")); }, 12000);
  const handler = (value: any) => { if (predicate(value)) { clearTimeout(timer); socket.off("snapshot", handler); resolve(value); } };
  socket.on("snapshot", handler);
});
async function main() {
  try {
    await new Promise<void>((resolve, reject) => { const timer = setTimeout(() => reject(new Error("Gateway did not start.")), 10000); worker.stdout!.on("data", chunk => { if (String(chunk).includes("gateway ready")) { clearTimeout(timer); resolve(); } }); worker.on("exit", () => reject(new Error("Gateway exited."))); });
    const register = async (role: "MOTHER" | "CHW", label: string) => {
      const email = `${prefix}-${label}@example.test`; emails.push(email);
      const result = await authenticateAccount({ mode: "signup", email, password, name: `Fictional ${label}`, phone: `+2547${randomInt(10000000, 99999999)}`, role });
      ids.push(result.user.id);
      return { result, actor: { id: result.user.id, email, role, isDemo: false, admin: false } satisfies CareActor };
    };
    const mother = await register("MOTHER", "mother"), chw = await register("CHW", "chw"), operator = await register("CHW", "operator"), stranger = await register("CHW", "stranger");
    await assert.rejects(opsLive(stranger.actor));
    await db.careOperator.create({ data: { identityId: operator.actor.id } });
    await careCommand(mother.actor, { action: "consent", scopes: ["VITALS", "VISITS", "NOTES", "CONTACTS"] });
    await careCommand(chw.actor, { action: "invite", email: mother.actor.email, kind: "CHW", scopes: ["VITALS", "VISITS", "NOTES", "CONTACTS"] });
    const invite = (await careWorkspace(mother.actor)).incoming![0];
    await careCommand(mother.actor, { action: "respond", inviteId: invite.id, accept: true, scopes: invite.scopes });
    const connect = async (token: string, ops = false) => {
      const socket = io("http://127.0.0.1:3013", { transports: ["websocket"], reconnection: false, forceNew: true, extraHeaders: { Origin: origin }, auth: { ticket: signTicket(digestToken(token), ops) } });
      sockets.push(socket); const first = await nextSnapshot(socket); return { socket, first };
    };
    const motherClient = await connect(mother.result.token), chwClient = await connect(chw.result.token), opsClient = await connect(operator.result.token, true), strangerClient = await connect(stranger.result.token);
    assert(chwClient.first.records[mother.actor.id]); assert.equal(Object.keys(strangerClient.first.records).length, 0);
    assert.equal(opsClient.first.readings.filter((r: any) => r.motherId === mother.actor.id).length, 0);
    await careCommand(mother.actor, { action: "opsConsent", enabled: true });
    await nextSnapshot(opsClient.socket);
    const timings: number[] = [];
    for (let n = 0; n < 10; n++) {
      const sys = 111 + n;
      const updated = nextSnapshot(chwClient.socket, data => data.records[mother.actor.id]?.vitals[0]?.systolic === sys);
      const t0 = performance.now();
      await db.careVital.create({ data: { motherId: mother.actor.id, systolic: sys, diastolic: 74, heartRate: 78 } });
      await updated; timings.push(performance.now() - t0);
    }
    const sorted = [...timings].sort((a, b) => a - b);
    const percentile = (q: number) => Math.round(sorted[Math.ceil(q * sorted.length) - 1]);
    console.log(`LOCAL DB write-to-CHW-Socket.IO snapshot latency: n=${timings.length}, p50=${percentile(.5)}ms, p95=${percentile(.95)}ms, max=${percentile(1)}ms. This is not production network latency.`);
    const sos = nextSnapshot(chwClient.socket, data => data.workspace.alerts?.length > 0);
    const opsSos = nextSnapshot(opsClient.socket, data => data.alerts?.some((a: any) => a.motherId === mother.actor.id && a.active));
    await careCommand(mother.actor, { action: "sos", kind: "Fictional test SOS" });
    const [sosData] = await Promise.all([sos, opsSos]);
    const alertId = sosData.workspace.alerts[0].id;
    const acknowledged = nextSnapshot(motherClient.socket, data => data.workspace.alerts?.some((a: any) => a.id === alertId && a.status === "ack"));
    await new Promise<void>((resolve, reject) => opsClient.socket.emit("command", { action: "ack", alertId }, (result: any) => result.error ? reject(new Error(result.error)) : resolve()));
    await acknowledged;
    await Promise.allSettled([
      careCommand(chw.actor, { action: "resolveAlert", alertId }),
      opsCommand(operator.actor, { action: "ack", alertId }),
    ]);
    const closed = await db.careAlert.findUniqueOrThrow({ where: { id: alertId } });
    assert.equal(closed.active, false);
    assert.equal(closed.status, "resolved", "A racing acknowledgement must never reopen a resolved case.");
    const noOpsReadings = nextSnapshot(opsClient.socket, data => !data.readings.some((r: any) => r.motherId === mother.actor.id));
    await careCommand(mother.actor, { action: "opsConsent", enabled: false }); await noOpsReadings;
    const revoked = nextSnapshot(chwClient.socket, data => !data.records[mother.actor.id]);
    const access = (await careWorkspace(mother.actor)).access!.find(g => g.active)!;
    await careCommand(mother.actor, { action: "revoke", accessId: access.id }); await revoked;
    const erased = new Promise<void>(resolve => strangerClient.socket.once("access:revoked", () => resolve()));
    await db.accountSession.deleteMany({ where: { identityId: stranger.actor.id } }); await erased;
    console.log("PASS: authenticated mother/CHW/ops sockets, email approval before access, real cross-role SOS + persisted ack, separate operations consent, revocation and session-logout invalidation.");
  } finally {
    for (const socket of sockets) socket.disconnect();
    worker.kill("SIGTERM");
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
    await db.$disconnect();
  }
}
main().catch((error) => { console.error("Shared socket integration failed:", error.name, error instanceof assert.AssertionError ? error.message : error.code ?? "unknown"); process.exitCode = 1; });
