import { randomBytes, randomUUID } from "node:crypto";
import { db } from "./db";
import { CareError, normalizeEmail } from "./care-policy";
import { digestToken, hashPassword, normalizePhone, verifyPassword } from "./credential-policy";
import type { AccountIdentity } from "@prisma/client";

export const SESSION_COOKIE = "afyanine_session";
export const SESSION_SECONDS = 60 * 60 * 12;
const DUMMY_HASH = hashPassword(randomBytes(32).toString("hex"));
export const sessionUser = (identity: AccountIdentity) => ({
  id: identity.id, email: identity.email,
  user_metadata: { display_name: identity.displayName, afyanine_role: identity.role, phone: identity.phone ?? "" },
});
export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (origin) {
    let host: string;
    try {
      const parsed = new URL(origin);
      if (!["https:", "http:"].includes(parsed.protocol)) throw new Error();
      host = parsed.host;
    } catch { throw new CareError(403, "ACCESS_DENIED"); }
    // Reverse proxies terminate HTTPS before Next's internal HTTP listener.
    // Browser Origin must match the actual Host, not that internal URL/scheme.
    if (host !== (request.headers.get("host") ?? new URL(request.url).host)) throw new CareError(403, "ACCESS_DENIED");
  }
  if (request.headers.get("sec-fetch-site") === "cross-site") throw new CareError(403, "ACCESS_DENIED");
}
export const secureCookie = (request: Request) => new URL(request.url).protocol === "https:" || request.headers.get("x-forwarded-proto")?.split(",")[0].trim() === "https";
export function sessionToken(request: Request) {
  return request.headers.get("cookie")?.split(";").map(x => x.trim()).find(x => x.startsWith(`${SESSION_COOKIE}=`))?.slice(SESSION_COOKIE.length + 1) ?? "";
}
export async function accountIdentity(request: Request) {
  const token = sessionToken(request);
  if (!/^[a-f0-9]{64}$/.test(token)) throw new CareError(401, "SIGN_IN_REQUIRED");
  const session = await db.accountSession.findUnique({ where: { tokenHash: digestToken(token) }, include: { identity: true } });
  if (!session || session.expiresAt <= new Date()) throw new CareError(401, "SIGN_IN_REQUIRED");
  return session.identity;
}
export async function authenticateAccount(raw: { email: string; password: string; phone?: string; name?: string; role?: "MOTHER" | "CHW"; mode: "signin" | "signup" }) {
  const email = normalizeEmail(raw.email);
  const key = digestToken(`account:${email}`);
  const allowed = await db.$transaction(async tx => {
    await tx.$queryRaw`SELECT 1 AS locked FROM pg_advisory_xact_lock(hashtext(${key}))`;
    const prior = await tx.authThrottle.findUnique({ where: { key } });
    const expired = !prior || prior.resetAt <= new Date();
    if (!expired && prior.attempts >= 5) return false;
    await tx.authThrottle.upsert({ where: { key }, create: { key, attempts: 1, resetAt: new Date(Date.now() + 15 * 60000) }, update: expired ? { attempts: 1, resetAt: new Date(Date.now() + 15 * 60000) } : { attempts: { increment: 1 } } });
    return true;
  });
  if (!allowed) throw new CareError(429, "Too many attempts. Try again in 15 minutes.");
  let identity = await db.accountIdentity.findUnique({ where: { email } });
  if (raw.mode === "signup") {
    let phone: string;
    try { phone = normalizePhone(raw.phone ?? ""); } catch { throw new CareError(400, "INVALID_PHONE"); }
    if (identity || await db.accountIdentity.findUnique({ where: { phone } })) throw new CareError(409, "Account could not be created. Sign in or contact your clinic.");
    try {
      const id = randomUUID();
      const role = raw.role ?? "MOTHER";
      identity = await db.$transaction(async tx => {
        const result = await tx.accountIdentity.create({ data: { id, email, phone, passwordHash: hashPassword(raw.password), role, displayName: raw.name!.trim() } });
        await tx.careAccount.create({ data: { id, email, phone, displayName: raw.name!.trim(), role } });
        return result;
      });
    } catch { throw new CareError(409, "Account could not be created. Sign in or contact your clinic."); }
  } else {
    const correct = verifyPassword(raw.password, identity?.passwordHash ?? DUMMY_HASH);
    if (!identity || !correct || identity.lockedUntil && identity.lockedUntil > new Date()) {
      if (identity) await db.accountIdentity.update({ where: { id: identity.id }, data: { failures: { increment: 1 }, ...(identity.failures >= 4 ? { lockedUntil: new Date(Date.now() + 15 * 60000) } : {}) } });
      throw new CareError(401, "Check your email and password.");
    }
  }
  await db.accountIdentity.update({ where: { id: identity.id }, data: { failures: 0, lockedUntil: null } });
  await db.authThrottle.deleteMany({ where: { key } });
  const token = randomBytes(32).toString("hex");
  await db.$transaction([
    db.accountSession.deleteMany({ where: { identityId: identity.id, expiresAt: { lt: new Date() } } }),
    db.accountSession.create({ data: { tokenHash: digestToken(token), identityId: identity.id, expiresAt: new Date(Date.now() + SESSION_SECONDS * 1000) } }),
  ]);
  return { token, user: sessionUser(identity) };
}
