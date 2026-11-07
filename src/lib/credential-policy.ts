import { randomBytes, scryptSync, timingSafeEqual, createHash } from "node:crypto";

export function normalizePhone(raw: string) {
  let phone = raw.replace(/[\s()\-]/g, "");
  if (/^0[17]\d{8}$/.test(phone)) phone = `+254${phone.slice(1)}`;
  if (/^[17]\d{8}$/.test(phone)) phone = `+254${phone}`;
  if (/^254[17]\d{8}$/.test(phone)) phone = `+${phone}`;
  if (!/^\+[1-9]\d{8,14}$/.test(phone)) throw new Error("INVALID_PHONE");
  return phone;
}
export function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  return `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
}
export function verifyPassword(password: string, stored: string) {
  const [salt, digest] = stored.split(":");
  if (!salt || !digest || digest.length !== 128) return false;
  return timingSafeEqual(scryptSync(password, salt, 64), Buffer.from(digest, "hex"));
}
export const digestToken = (token: string) => createHash("sha256").update(token).digest("hex");
