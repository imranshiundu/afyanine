import { db } from "./db";
import { requireCare, type CareActor } from "./care-policy";

export const DEMO_CARE = {
  mother: { id: "care-demo-mother", email: "mother@care.example.test", displayName: "Amina · fictional mother", role: "MOTHER" as const },
  chw: { id: "care-demo-chw", email: "chw@care.example.test", displayName: "Grace · fictional CHW", role: "CHW" as const },
  partner: { id: "care-demo-partner", email: "partner@care.example.test", displayName: "Daniel · fictional partner", role: "PARTNER" as const },
  admin: { id: "care-demo-admin", email: "admin@care.example.test", displayName: "Fictional verifier", role: "PARTNER" as const },
};
export async function demoCareActor(value: string | null): Promise<CareActor> {
  requireCare(value && Object.hasOwn(DEMO_CARE, value), "INVALID_DEMO_ACTOR", 400);
  const entry = DEMO_CARE[value as keyof typeof DEMO_CARE];
  const prior = await db.careAccount.findUnique({ where: { id: entry.id } });
  requireCare(!prior || prior.isDemo, "DEMO_COLLISION");
  if (!prior) await db.careAccount.upsert({
    where: { id: entry.id }, update: {},
    create: { ...entry, isDemo: true, ...(entry.role === "CHW" ? { institutionName: "Fictional Community Clinic", registrationNumber: "DEMO-NOT-A-LICENSE", institutionContact: "Fictional ward desk" } : {}) },
  });
  return { id: entry.id, email: entry.email, admin: value === "admin", isDemo: true };
}
