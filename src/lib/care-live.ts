import { careWorkspace, careRecord } from "./care-workspace";
import type { CareActor } from "./care-policy";
export async function careLive(actor: CareActor) {
  const workspace = await careWorkspace(actor);
  const ids = [...new Set([
    ...(workspace.me?.role === "MOTHER" ? [actor.id] : []),
    ...(workspace.access ?? []).filter(grant => grant.active && grant.viewerId === actor.id).map(grant => grant.motherId),
  ])];
  const records = Object.fromEntries(await Promise.all(ids.map(async id => {
    try { return [id, await careRecord(actor, id)]; }
    catch { return [id, null]; }
  })));
  return { workspace, records };
}
