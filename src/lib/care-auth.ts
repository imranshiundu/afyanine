import { accountIdentity } from "./account-auth";
import type { CareActor } from "./care-policy";

export async function careActor(request: Request): Promise<CareActor> {
  const identity = await accountIdentity(request);
  return { id: identity.id, email: identity.email, phone: identity.phone ?? undefined, role: identity.role, isDemo: false, admin: false };
}
