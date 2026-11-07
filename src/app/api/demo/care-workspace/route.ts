import { DEMO_CARE, demoCareActor } from "@/lib/care-demo";
import { careCommand, careHttpError, careRecord, careWorkspace } from "@/lib/care-workspace";
import { CareError, normalizeEmail } from "@/lib/care-policy";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const actor = await demoCareActor(url.searchParams.get("actor"));
    return Response.json(url.searchParams.has("mother") ? await careRecord(actor, url.searchParams.get("mother")!) : await careWorkspace(actor), { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return careHttpError(error); }
}
export async function POST(request: Request) {
  try {
    const actor = await demoCareActor(new URL(request.url).searchParams.get("actor"));
    if (!request.headers.get("content-type")?.includes("application/json")) throw new CareError(400, "INVALID_INPUT");
    const text = await request.text();
    if (text.length > 24000) throw new CareError(413, "INVALID_INPUT");
    let body; try { body = JSON.parse(text); } catch { throw new CareError(400, "INVALID_INPUT"); }
    if (body && typeof body === "object" && body.action === "invite" &&
        !Object.values(DEMO_CARE).some(entry => entry.email === normalizeEmail(typeof body.email === "string" ? body.email : ""))) {
      throw new CareError(400, "INVALID_DEMO_EMAIL");
    }
    return Response.json(await careCommand(actor, body), { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return careHttpError(error); }
}
