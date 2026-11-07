import { createHmac, timingSafeEqual } from "node:crypto";
import { db } from "./db";
import { CareError, type CareActor } from "./care-policy";
type Claims = { sid: string; ops: boolean; exp: number };
function secret() {
  const value = process.env.SOCKET_TICKET_SECRET;
  if (!value || value.length < 32) throw new CareError(503, "Realtime is not configured.");
  return value;
}
export function signTicket(sid: string, ops: boolean) {
  const body = Buffer.from(JSON.stringify({ sid, ops, exp: Date.now() + 60000 })).toString("base64url");
  return `${body}.${createHmac("sha256", secret()).update(body).digest("base64url")}`;
}
export function verifyTicket(ticket: string): Claims {
  if (typeof ticket !== "string" || ticket.length > 2048) throw new CareError(401, "SIGN_IN_REQUIRED");
  const [body, sig] = ticket.split(".");
  const expected = createHmac("sha256", secret()).update(body ?? "").digest("base64url");
  if (!sig || sig.length !== expected.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) throw new CareError(401, "SIGN_IN_REQUIRED");
  let value;
  try { value = JSON.parse(Buffer.from(body, "base64url").toString()); } catch { throw new CareError(401, "SIGN_IN_REQUIRED"); }
  if (!/^[a-f0-9]{64}$/.test(value.sid) || typeof value.ops !== "boolean" || typeof value.exp !== "number" || value.exp <= Date.now()) throw new CareError(401, "SIGN_IN_REQUIRED");
  return value;
}
export async function socketActor(claims: Pick<Claims, "sid" | "ops">): Promise<CareActor> {
  const session = await db.accountSession.findUnique({ where: { tokenHash: claims.sid }, include: { identity: { include: { operator: true } } } });
  if (!session || session.expiresAt <= new Date()) throw new CareError(401, "SIGN_IN_REQUIRED");
  if (claims.ops && !session.identity.operator?.active) throw new CareError(403, "Operations access required.");
  return { id: session.identityId, email: session.identity.email, phone: session.identity.phone ?? undefined, role: session.identity.role, isDemo: false, admin: claims.ops };
}
