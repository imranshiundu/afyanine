import { db } from "./db";
import { CareError, type CareActor } from "./care-policy";
import { z } from "zod";

export async function requireOperator(actor: CareActor) {
  if (actor.isDemo || !(await db.careOperator.findUnique({ where: { identityId: actor.id } }))?.active) throw new CareError(403, "Operations access required.");
}
// SOS explicitly shares emergency details. Ordinary telemetry needs separate consent.
export async function opsLive(actor: CareActor) {
  await requireOperator(actor);
  const [accounts, grants, alerts, visits, readings] = await Promise.all([
    db.careAccount.findMany({ where: { isDemo: false }, select: { id: true, role: true, createdAt: true } }),
    db.careAccess.count({ where: { isDemo: false, active: true, kind: "CHW" } }),
    db.careAlert.findMany({ where: { mother: { isDemo: false } }, include: { mother: { select: { displayName: true, phone: true } } }, orderBy: { createdAt: "desc" }, take: 200 }),
    db.careVisit.count({ where: { isDemo: false, status: "COMPLETED" } }),
    db.careVital.findMany({ where: { mother: { isDemo: false, opsConsent: true, storageScopes: { has: "VITALS" } } }, include: { mother: { select: { displayName: true } } }, orderBy: { measuredAt: "desc" }, take: 100 }),
  ]);
  const since = Date.now() - 86400000;
  const start = new Date();
  start.setUTCHours(0, 0, 0, 0);
  start.setUTCDate(start.getUTCDate() - (start.getUTCDay() + 6) % 7 - 77);
  const signupWeeks = Array.from({ length: 12 }, (_, n) => accounts.filter(a => a.role === "MOTHER" && +a.createdAt >= +start + n * 604800000 && +a.createdAt < +start + (n + 1) * 604800000).length);
  const acknowledged = alerts.filter(a => a.acknowledgedAt);
  return {
    accounts: { mothers: accounts.filter(a => a.role === "MOTHER").length, chws: accounts.filter(a => a.role === "CHW").length, connections: grants, completedVisits: visits },
    alerts: alerts.map(a => ({ id: a.id, motherId: a.motherId, kind: a.kind, active: a.active, status: a.status, createdAt: a.createdAt, acknowledgedAt: a.acknowledgedAt, resolvedAt: a.resolvedAt, motherName: a.mother.displayName, phone: a.active ? a.mother.phone : null })),
    readings: readings.map(v => ({ id: v.id, motherId: v.motherId, motherName: v.mother.displayName, systolic: v.systolic, diastolic: v.diastolic, heartRate: v.heartRate, measuredAt: v.measuredAt, source: v.source })),
    emergencies24h: alerts.filter(a => a.createdAt.getTime() >= since).length,
    signupWeeks,
    avgAcknowledgementSeconds: acknowledged.length ? Math.round(acknowledged.reduce((sum, a) => sum + (a.acknowledgedAt!.getTime() - a.createdAt.getTime()) / 1000, 0) / acknowledged.length) : null,
    at: new Date().toISOString(),
  };
}
export async function opsCommand(actor: CareActor, body: unknown) {
  await requireOperator(actor);
  const parsed = z.object({ action: z.enum(["ack", "resolve"]), alertId: z.string().min(1).max(100) }).safeParse(body);
  if (!parsed.success) throw new CareError(400, "INVALID_INPUT");
  const command = parsed.data;
  return db.$transaction(async tx => {
    const target = await tx.careAlert.findFirst({ where: { id: command.alertId, mother: { isDemo: false } }, select: { motherId: true } });
    if (!target) throw new CareError(404, "Emergency not found.");
    // Serialize with mother/CHW SOS and consent commands, not a separate lock.
    await tx.$queryRaw`SELECT 1 FROM pg_advisory_xact_lock(hashtext(${`care:${target.motherId}`}))`;
    const alert = await tx.careAlert.findFirst({ where: { id: command.alertId, mother: { isDemo: false } } });
    if (!alert) throw new CareError(404, "Emergency not found.");
    if (!alert.active) throw new CareError(409, "Emergency already resolved.");
    const updated = await tx.careAlert.update({ where: { id: alert.id }, data: command.action === "resolve" ? { active: false, status: "resolved", resolvedAt: new Date() } : { status: "ack", acknowledgedAt: alert.acknowledgedAt ?? new Date() } });
    await tx.careAudit.create({ data: { actorId: actor.id, motherId: alert.motherId, action: `OPS_${command.action.toUpperCase()}`, scopes: [] } });
    return { ok: true, status: updated.status };
  });
}
