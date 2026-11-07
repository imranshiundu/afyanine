export const SCOPES = ["VITALS", "PREGNANCY", "VISITS", "NOTES", "CONTACTS"] as const;
export type Scope = typeof SCOPES[number];
export type CareActor = { id: string; email: string; phone?: string; role?: "MOTHER" | "CHW" | "PARTNER"; isDemo: boolean; admin: boolean };
export function normalizeEmail(email: string) { return email.trim().toLowerCase(); }
export function trustedAdmin(user: { app_metadata?: Record<string, unknown> }) {
  return user.app_metadata?.afyanine_admin === true;
}
export function sharedScopes(storage: readonly Scope[], grants: readonly Scope[]) {
  return SCOPES.filter(scope => storage.includes(scope) && grants.includes(scope));
}
export function overlaps(a: Date, b: Date, start: Date, end: Date) { return a < end && b > start; }
export class CareError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string) { super(code); this.status = status; this.code = code; }
}
export function requireCare(condition: unknown, code = "ACCESS_DENIED", status = 403): asserts condition {
  if (!condition) throw new CareError(status, code);
}
