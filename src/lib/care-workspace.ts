import { z } from "zod";
import { type CareAccount, type Prisma } from "@prisma/client";
import { db } from "./db";
import { CareError, requireCare, normalizeEmail, sharedScopes, SCOPES, type CareActor, type Scope } from "./care-policy";

const scopes = z.array(z.enum(SCOPES)).max(5)
  .refine(value => !value.includes("NOTES") || value.includes("VISITS"))
  .transform(value => [...new Set(value)]);
const id = z.string().min(1).max(100);
const phone = z.string().trim().max(40).regex(/^[+\d\s()\-]*$/);
const commands = z.discriminatedUnion("action", [
  z.object({ action: z.literal("profile"), displayName: z.string().trim().min(2).max(80), phone: phone.optional(), locale: z.enum(["EN", "SW"]), role: z.enum(["MOTHER", "CHW", "PARTNER"]), institutionName: z.string().trim().max(150).optional(), registrationNumber: z.string().trim().max(80).optional(), institutionContact: z.string().trim().max(120).optional() }),
  z.object({ action: z.literal("invite"), email: z.email().max(254), kind: z.enum(["CHW", "PARTNER"]), scopes }),
  z.object({ action: z.literal("respond"), inviteId: id, accept: z.boolean(), scopes }),
  z.object({ action: z.literal("revoke"), accessId: id }),
  z.object({ action: z.literal("consent"), scopes, confirmDelete: z.boolean().default(false) }),
  z.object({ action: z.literal("purge"), confirmDelete: z.literal(true) }),
  z.object({ action: z.literal("pregnancy"), dueDate: z.iso.date() }),
  z.object({ action: z.literal("vital"), systolic: z.number().int().min(50).max(300), diastolic: z.number().int().min(20).max(200), heartRate: z.number().int().min(30).max(250) }),
  z.object({ action: z.literal("contact"), name: z.string().trim().min(2).max(80), relationship: z.string().trim().min(1).max(50), phone: phone.min(5), email: z.union([z.email().max(254), z.literal("")]).optional() }),
  z.object({ action: z.literal("schedule"), motherId: id, startsAt: z.iso.datetime(), endsAt: z.iso.datetime(), place: z.string().trim().min(2).max(160) }),
  z.object({ action: z.literal("visitStatus"), visitId: id, status: z.enum(["COMPLETED", "CANCELLED"]) }),
  z.object({ action: z.literal("note"), visitId: id, body: z.string().trim().min(1).max(4000) }),
]);
type Tx = Prisma.TransactionClient;
const publicProfile = (account: CareAccount) => ({
  id: account.id, displayName: account.displayName, role: account.role,
  institutionName: account.institutionName, registrationNumber: account.registrationNumber,
  institutionContact: account.institutionContact, verifiedAt: account.verifiedAt, createdAt: account.createdAt,
});
function enabled(actor: CareActor) { return actor.isDemo || process.env.CARE_RECORDS_ENABLED === "true"; }
async function account(actor: CareActor, tx: Tx = db) {
  const me = await tx.careAccount.findFirst({ where: { id: actor.id, isDemo: actor.isDemo } });
  requireCare(me, "SET_UP_PROFILE", 409);
  return me;
}
async function mother(actor: CareActor, motherId: string, tx: Tx = db) {
  const owner = await tx.careAccount.findFirst({ where: { id: motherId, role: "MOTHER", isDemo: actor.isDemo } });
  requireCare(owner, "NOT_FOUND", 404);
  const viewer = await account(actor, tx);
  const grants = owner.id === actor.id ? SCOPES : (await tx.careAccess.findMany({
    where: { motherId, viewerId: actor.id, active: true, isDemo: actor.isDemo },
  })).filter(item => item.kind !== "CHW" || viewer.role === "CHW").flatMap(item => item.scopes);
  const allowed = enabled(actor) ? sharedScopes(owner.storageScopes, grants) : [];
  requireCare(owner.id === actor.id || grants.length > 0);
  return { owner, allowed, viewer };
}
async function requireCategory(actor: CareActor, motherId: string, category: Scope, tx: Tx = db, write = false) {
  requireCare(enabled(actor), "CLINICAL_STORAGE_DISABLED", 503);
  const access = await mother(actor, motherId, tx);
  requireCare(access.allowed.includes(category), "CATEGORY_NOT_SHARED");
  if (write && motherId !== actor.id) {
    requireCare(access.viewer.role === "CHW", "CHW_ACCOUNT_REQUIRED");
    const grant = await tx.careAccess.findFirst({ where: { motherId, viewerId: actor.id, kind: "CHW", active: true, isDemo: actor.isDemo, scopes: { has: category } } });
    requireCare(grant);
  }
  return access;
}
function audit(tx: Tx, actor: CareActor, action: string, motherId?: string, categories: Scope[] = []) {
  return tx.careAudit.create({ data: { actorId: actor.id, motherId, action, scopes: categories, isDemo: actor.isDemo } });
}
async function locks(tx: Tx, keys: string[]) {
  for (const key of [...new Set(keys)].sort()) await tx.$queryRaw`SELECT 1 AS acquired FROM pg_advisory_xact_lock(hashtext(${`care:${key}`}))`;
}

export async function careRecord(actor: CareActor, motherId: string) {
  const { owner, allowed } = await mother(actor, motherId);
  const visits = allowed.includes("VISITS") ? await db.careVisit.findMany({
    where: { motherId, isDemo: actor.isDemo }, orderBy: { startsAt: "desc" }, take: 50,
    include: { chw: { select: { displayName: true } } },
  }) : [];
  const notes = allowed.includes("NOTES") && visits.length ? await db.careNote.findMany({
    where: { visitId: { in: visits.map(visit => visit.id) } },
    include: { author: { select: { displayName: true } } }, orderBy: { createdAt: "asc" }, take: 250,
  }) : [];
  return {
    mother: { id: owner.id, displayName: owner.displayName, ...(allowed.includes("CONTACTS") ? { phone: owner.phone, email: owner.email } : {}), ...(allowed.includes("PREGNANCY") ? { dueDate: owner.dueDate } : {}) },
    scopes: allowed,
    vitals: allowed.includes("VITALS") ? await db.careVital.findMany({ where: { motherId }, orderBy: { measuredAt: "desc" }, take: 50 }) : [],
    contacts: allowed.includes("CONTACTS") ? await db.careContact.findMany({ where: { motherId }, take: 30 }) : [],
    visits: visits.map(visit => ({ ...visit, notes: notes.filter(note => note.visitId === visit.id) })),
  };
}

export async function careWorkspace(actor: CareActor) {
  const me = await db.careAccount.findFirst({ where: { id: actor.id, isDemo: actor.isDemo } });
  if (!me) return { me: null, admin: actor.admin, clinicalEnabled: enabled(actor) };
  // Refresh contact identity from Auth; never use a stale profile email to bind.
  if (me.email !== actor.email) await db.careAccount.update({ where: { id: me.id }, data: { email: actor.email } });
  const incoming = await db.careInvite.findMany({ where: { targetEmail: actor.email, isDemo: actor.isDemo, status: "PENDING", expiresAt: { gt: new Date() } }, include: { requester: true }, orderBy: { createdAt: "desc" }, take: 50 });
  const allAccess = await db.careAccess.findMany({
    where: { isDemo: actor.isDemo, OR: [{ motherId: me.id }, { viewerId: me.id }] },
    include: { mother: true, viewer: true }, orderBy: [{ active: "desc" }, { createdAt: "desc" }], take: 100,
  });
  const access = allAccess.filter(item => item.motherId === me.id ||
    (item.viewerId === me.id && item.active && item.scopes.length > 0 && (item.kind !== "CHW" || me.role === "CHW")));
  const visitMothers = enabled(actor) ? [...new Set([
    ...(me.role === "MOTHER" && me.storageScopes.includes("VISITS") ? [me.id] : []),
    ...access.filter(item => item.viewerId === me.id && item.active && item.scopes.includes("VISITS") && item.mother.storageScopes.includes("VISITS")).map(item => item.motherId),
  ])] : [];
  return {
    me: { ...me, email: actor.email }, admin: actor.admin, clinicalEnabled: enabled(actor),
    incoming: incoming.map(item => ({ id: item.id, kind: item.kind, scopes: item.scopes, requester: publicProfile(item.requester), createdAt: item.createdAt })),
    sent: await db.careInvite.findMany({ where: { requesterId: me.id, isDemo: actor.isDemo }, select: { id: true, targetEmail: true, kind: true, status: true, expiresAt: true }, orderBy: { createdAt: "desc" }, take: 30 }),
    access: access.map(item => ({ id: item.id, motherId: item.motherId, viewerId: item.viewerId, kind: item.kind, scopes: item.scopes, active: item.active, createdAt: item.createdAt, mother: { id: item.mother.id, displayName: item.mother.displayName }, viewer: publicProfile(item.viewer) })),
    visits: await db.careVisit.findMany({ where: { isDemo: actor.isDemo, motherId: { in: visitMothers } }, select: { id: true, motherId: true, chwId: true, startsAt: true, endsAt: true, status: true, place: true, mother: { select: { displayName: true } }, chw: { select: { displayName: true } } }, orderBy: { startsAt: "desc" }, take: 100 }),
    stats: me.role === "CHW" ? {
      activeMothers: await db.careAccess.count({ where: { viewerId: me.id, kind: "CHW", active: true, scopes: { isEmpty: false }, isDemo: actor.isDemo } }),
      completedVisits: await db.careVisit.count({ where: { chwId: me.id, isDemo: actor.isDemo, status: "COMPLETED" } }),
      scheduledVisits: await db.careVisit.count({ where: { chwId: me.id, isDemo: actor.isDemo, status: "SCHEDULED", startsAt: { gte: new Date() } } }),
    } : null,
    audit: await db.careAudit.findMany({ where: { isDemo: actor.isDemo, OR: [{ actorId: me.id }, ...(me.role === "MOTHER" ? [{ motherId: me.id }] : [])] }, select: { id: true, action: true, scopes: true, createdAt: true }, orderBy: { createdAt: "desc" }, take: 30 }),
  };
}

export async function careCommand(actor: CareActor, raw: unknown) {
  const parsed = commands.safeParse(raw);
  requireCare(parsed.success, "INVALID_INPUT", 400);
  const command = parsed.data;
  // All writes lock affected profiles. Revocation and consent changes serialize
  // against clinical writes, preventing check-then-write permission races.
  return db.$transaction(async tx => {
    let extra: string[] = [];
    if ("motherId" in command) extra.push(command.motherId);
    if ("inviteId" in command) {
      const invite = await tx.careInvite.findFirst({ where: { id: command.inviteId, isDemo: actor.isDemo } });
      if (invite) extra.push(invite.requesterId, ...(invite.motherId ? [invite.motherId] : []));
    }
    if ("accessId" in command) {
      const grant = await tx.careAccess.findFirst({ where: { id: command.accessId, isDemo: actor.isDemo } });
      if (grant) extra.push(grant.motherId, grant.viewerId);
    }
    if ("visitId" in command) {
      const visit = await tx.careVisit.findFirst({ where: { id: command.visitId, isDemo: actor.isDemo } });
      if (visit) extra.push(visit.motherId, visit.chwId);
    }
    await locks(tx, [actor.id, ...extra]);
    if (command.action === "profile") {
      const prior = await tx.careAccount.findUnique({ where: { id: actor.id } });
      requireCare(!prior || prior.isDemo === actor.isDemo);
      requireCare(!prior || prior.role === command.role, "ROLE_CHANGE_REQUIRES_ADMIN");
      if (command.role === "CHW") requireCare(command.institutionName && command.registrationNumber && command.institutionContact, "INSTITUTION_REQUIRED", 400);
      const changedInstitution = prior && (prior.displayName !== command.displayName || prior.institutionName !== (command.institutionName || null) || prior.registrationNumber !== (command.registrationNumber || null) || prior.institutionContact !== (command.institutionContact || null));
      const data = { displayName: command.displayName, phone: command.phone || null, locale: command.locale, institutionName: command.role === "CHW" ? command.institutionName : null, registrationNumber: command.role === "CHW" ? command.registrationNumber : null, institutionContact: command.role === "CHW" ? command.institutionContact : null };
      await tx.careAccount.upsert({ where: { id: actor.id }, create: { id: actor.id, email: actor.email, role: command.role, isDemo: actor.isDemo, ...data }, update: { ...data, ...(changedInstitution ? { verifiedAt: null, verifiedBy: null } : {}) } });
      if (changedInstitution && prior?.role === "CHW") {
        const priorGrants = await tx.careAccess.findMany({ where: { viewerId: actor.id, kind: "CHW", active: true, isDemo: actor.isDemo } });
        for (const grant of priorGrants) {
          await tx.careAccess.update({ where: { id: grant.id }, data: { active: false, revokedAt: new Date() } });
          await audit(tx, actor, "CONNECTION_REVOKED", grant.motherId, grant.scopes);
        }
        await tx.careVisit.updateMany({ where: { chwId: actor.id, isDemo: actor.isDemo, status: "SCHEDULED" }, data: { status: "CANCELLED" } });
        await tx.careInvite.updateMany({ where: { requesterId: actor.id, kind: "CHW", status: "PENDING", isDemo: actor.isDemo }, data: { status: "CANCELLED", respondedAt: new Date() } });
      }
      await audit(tx, actor, "PROFILE_UPDATED");
      return { ok: true };
    }
    const me = await account(actor, tx);
    if (command.action === "invite") {
      const targetEmail = normalizeEmail(command.email);
      requireCare(targetEmail !== actor.email, "CANNOT_INVITE_SELF", 400);
      requireCare(command.scopes.length > 0, "CHOOSE_CATEGORIES", 400);
      requireCare(command.kind === "CHW" ? me.role === "CHW" : me.role === "MOTHER", "CHW_ACCOUNT_REQUIRED");
      if (command.kind === "PARTNER") requireCare(command.scopes.every(scope => me.storageScopes.includes(scope)), "CONSENT_REQUIRED");
      const count = await tx.careInvite.count({ where: { requesterId: actor.id, createdAt: { gt: new Date(Date.now() - 86400000) } } });
      requireCare(count < 10, "INVITE_LIMIT", 429);
      const prior = await tx.careInvite.findFirst({ where: { requesterId: actor.id, targetEmail, kind: command.kind, isDemo: actor.isDemo }, include: { access: { select: { active: true, revokedAt: true } } }, orderBy: { createdAt: "desc" } });
      if (prior?.status === "PENDING" && prior.expiresAt > new Date()) return { ok: true };
      if (prior?.access?.active) return { ok: true };
      const changedAt = prior ? Math.max(+prior.createdAt, +(prior.respondedAt ?? 0), +(prior.access?.revokedAt ?? 0)) : 0;
      requireCare(changedAt < Date.now() - 7 * 86400000, "INVITE_COOLDOWN", 429);
      await tx.careInvite.create({ data: { requesterId: actor.id, motherId: command.kind === "PARTNER" ? actor.id : null, targetEmail, kind: command.kind, scopes: command.scopes, isDemo: actor.isDemo, expiresAt: new Date(Date.now() + 14 * 86400000) } });
      await audit(tx, actor, "INVITATION_SENT", me.role === "MOTHER" ? me.id : undefined, command.scopes);
    } else if (command.action === "respond") {
      const invite = await tx.careInvite.findFirst({ where: { id: command.inviteId, targetEmail: actor.email, isDemo: actor.isDemo, status: "PENDING", expiresAt: { gt: new Date() } } });
      requireCare(invite, "NOT_FOUND", 404);
      if (command.accept) {
        const ownerId = invite.kind === "CHW" ? actor.id : invite.motherId;
        const viewerId = invite.kind === "CHW" ? invite.requesterId : actor.id;
        requireCare(ownerId && (invite.kind !== "CHW" || me.role === "MOTHER"));
        requireCare(ownerId !== viewerId, "CANNOT_INVITE_SELF", 400);
        const owner = await tx.careAccount.findFirst({ where: { id: ownerId, role: "MOTHER", isDemo: actor.isDemo } });
        requireCare(owner);
        const viewer = await tx.careAccount.findFirst({ where: { id: viewerId, isDemo: actor.isDemo } });
        requireCare(viewer && (invite.kind !== "CHW" || viewer.role === "CHW"), "CHW_ACCOUNT_REQUIRED");
        const selected = invite.kind === "PARTNER" ? invite.scopes : command.scopes;
        requireCare(selected.length > 0 && selected.every(scope => invite.scopes.includes(scope) && owner.storageScopes.includes(scope)), "CONSENT_REQUIRED");
        requireCare(!await tx.careAccess.findFirst({ where: { motherId: ownerId, viewerId, kind: invite.kind, active: true, isDemo: actor.isDemo } }), "ALREADY_CONNECTED", 409);
        await tx.careAccess.create({ data: { motherId: ownerId, viewerId, kind: invite.kind, scopes: selected, inviteId: invite.id, isDemo: actor.isDemo } });
        await audit(tx, actor, "CONNECTION_ACCEPTED", ownerId, selected);
      } else await audit(tx, actor, "INVITATION_DECLINED", invite.motherId ?? (me.role === "MOTHER" ? me.id : undefined));
      await tx.careInvite.update({ where: { id: invite.id }, data: { status: command.accept ? "ACCEPTED" : "DECLINED", respondedAt: new Date() } });
    } else if (command.action === "revoke") {
      const grant = await tx.careAccess.findFirst({ where: { id: command.accessId, motherId: actor.id, isDemo: actor.isDemo, active: true } });
      requireCare(grant, "NOT_FOUND", 404);
      await tx.careAccess.update({ where: { id: grant.id }, data: { active: false, revokedAt: new Date() } });
      if (grant.kind === "CHW") await tx.careVisit.updateMany({ where: { motherId: actor.id, chwId: grant.viewerId, isDemo: actor.isDemo, status: "SCHEDULED" }, data: { status: "CANCELLED" } });
      await audit(tx, actor, "CONNECTION_REVOKED", actor.id, grant.scopes);
    } else if (command.action === "consent" || command.action === "purge") {
      requireCare(me.role === "MOTHER");
      const next = command.action === "purge" ? [] : command.scopes;
      const removed = me.storageScopes.filter(scope => !next.includes(scope));
      requireCare(!removed.length || command.confirmDelete, "CONFIRM_DELETION", 409);
      if (removed.includes("VITALS")) await tx.careVital.deleteMany({ where: { motherId: actor.id } });
      if (removed.includes("CONTACTS")) await tx.careContact.deleteMany({ where: { motherId: actor.id } });
      if (removed.includes("NOTES")) await tx.careNote.deleteMany({ where: { visit: { motherId: actor.id } } });
      if (removed.includes("VISITS")) await tx.careVisit.deleteMany({ where: { motherId: actor.id } });
      if (removed.length || command.action === "purge") await tx.careInvite.updateMany({
        where: { isDemo: actor.isDemo, status: "PENDING", OR: [{ motherId: actor.id }, { targetEmail: actor.email, kind: "CHW" }] },
        data: { status: "CANCELLED", respondedAt: new Date() },
      });
      await tx.careAccount.update({ where: { id: me.id }, data: { storageScopes: next, ...(removed.includes("PREGNANCY") ? { dueDate: null } : {}) } });
      // Old grants cannot revive silently after a category is opted into again.
      const grants = await tx.careAccess.findMany({ where: { motherId: actor.id, active: true, isDemo: actor.isDemo } });
      for (const grant of grants) await tx.careAccess.update({ where: { id: grant.id }, data: { scopes: grant.scopes.filter(scope => next.includes(scope)), ...(command.action === "purge" ? { active: false, revokedAt: new Date() } : {}) } });
      await audit(tx, actor, command.action === "purge" ? "CARE_RECORD_PURGED" : "STORAGE_CONSENT_UPDATED", me.id, next);
    } else if (command.action === "pregnancy") {
      await requireCategory(actor, actor.id, "PREGNANCY", tx);
      requireCare(me.role === "MOTHER");
      await tx.careAccount.update({ where: { id: me.id }, data: { dueDate: new Date(command.dueDate + "T00:00:00Z") } });
      await audit(tx, actor, "PREGNANCY_UPDATED", me.id, ["PREGNANCY"]);
    } else if (command.action === "vital") {
      await requireCategory(actor, actor.id, "VITALS", tx);
      requireCare(me.role === "MOTHER" && command.systolic > command.diastolic, "INVALID_READING", 400);
      await tx.careVital.create({ data: { motherId: me.id, systolic: command.systolic, diastolic: command.diastolic, heartRate: command.heartRate } });
      await audit(tx, actor, "MANUAL_READING_ADDED", me.id, ["VITALS"]);
    } else if (command.action === "contact") {
      await requireCategory(actor, actor.id, "CONTACTS", tx);
      requireCare(me.role === "MOTHER");
      requireCare(await tx.careContact.count({ where: { motherId: me.id } }) < 20, "CONTACT_LIMIT", 409);
      await tx.careContact.create({ data: { motherId: me.id, name: command.name, relationship: command.relationship, phone: command.phone, email: command.email || null } });
      await audit(tx, actor, "CONTACT_ADDED", me.id, ["CONTACTS"]);
    } else if (command.action === "schedule") {
      const permitted = await requireCategory(actor, command.motherId, "VISITS", tx, true);
      requireCare(me.role === "CHW" && permitted.owner.id !== actor.id, "CHW_ACCOUNT_REQUIRED");
      const start = new Date(command.startsAt), end = new Date(command.endsAt), minutes = (+end - +start) / 60000;
      requireCare(start > new Date() && minutes >= 15 && minutes <= 180, "INVALID_VISIT_TIME", 400);
      const conflict = await tx.careVisit.findFirst({ where: { isDemo: actor.isDemo, status: "SCHEDULED", OR: [{ chwId: me.id }, { motherId: command.motherId }], startsAt: { lt: end }, endsAt: { gt: start } } });
      requireCare(!conflict, "VISIT_CONFLICT", 409);
      await tx.careVisit.create({ data: { motherId: command.motherId, chwId: me.id, startsAt: start, endsAt: end, place: command.place, isDemo: actor.isDemo } });
      await audit(tx, actor, "VISIT_SCHEDULED", command.motherId, ["VISITS"]);
    } else if (command.action === "visitStatus" || command.action === "note") {
      const visit = await tx.careVisit.findFirst({ where: { id: command.visitId, isDemo: actor.isDemo } });
      requireCare(visit, "NOT_FOUND", 404);
      const ownerCancelling = command.action === "visitStatus" && command.status === "CANCELLED" && me.id === visit.motherId;
      await requireCategory(actor, visit.motherId, "VISITS", tx, !ownerCancelling);
      requireCare(ownerCancelling || visit.chwId === me.id);
      if (command.action === "note") {
        await requireCategory(actor, visit.motherId, "NOTES", tx, true);
        requireCare(visit.status !== "CANCELLED", "VISIT_CANCELLED", 409);
        await tx.careNote.create({ data: { visitId: visit.id, authorId: me.id, body: command.body } });
        await audit(tx, actor, "VISIT_NOTE_ADDED", visit.motherId, ["NOTES"]);
      } else {
        requireCare(visit.status === "SCHEDULED", "VISIT_ALREADY_CLOSED", 409);
        requireCare(command.status !== "COMPLETED" || visit.startsAt <= new Date(), "VISIT_NOT_STARTED", 409);
        await tx.careVisit.update({ where: { id: visit.id }, data: { status: command.status } });
        await audit(tx, actor, `VISIT_${command.status}`, visit.motherId, ["VISITS"]);
      }
    }
    return { ok: true };
  }, { timeout: 10000 });
}

export async function careHttpError(error: unknown) {
  if (error instanceof CareError) return Response.json({ error: error.code }, { status: error.status, headers: { "Cache-Control": "no-store" } });
  // No database errors, request fields or auth tokens are returned/logged.
  return Response.json({ error: "WORKSPACE_UNAVAILABLE" }, { status: 503, headers: { "Cache-Control": "no-store" } });
}
