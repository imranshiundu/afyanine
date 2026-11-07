import { careActor } from "@/lib/care-auth";
import { careCommand, careHttpError, careRecord, careWorkspace } from "@/lib/care-workspace";
import { CareError } from "@/lib/care-policy";

export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const actor = await careActor(request);
    const mother = new URL(request.url).searchParams.get("mother");
    return Response.json(mother ? await careRecord(actor, mother) : await careWorkspace(actor), { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) { return careHttpError(error); }
}
export async function POST(request: Request) {
  try {
    const actor = await careActor(request);
    if (!request.headers.get("content-type")?.includes("application/json")) throw new CareError(400, "INVALID_INPUT");
    const text = await request.text();
    if (text.length > 24000) throw new CareError(413, "INVALID_INPUT");
    let body; try { body = JSON.parse(text); } catch { throw new CareError(400, "INVALID_INPUT"); }
    return Response.json(await careCommand(actor, body), { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return careHttpError(error); }
}
