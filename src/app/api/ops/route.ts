import { careActor } from "@/lib/care-auth";
import { opsLive, opsCommand } from "@/lib/ops-live";
import { careHttpError } from "@/lib/care-workspace";
import { sameOrigin } from "@/lib/account-auth";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try { return Response.json(await opsLive(await careActor(request)), { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { return careHttpError(error); }
}
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const text = await request.text();
    if (text.length > 2048) return Response.json({ error: "Request too large." }, { status: 413 });
    return Response.json(await opsCommand(await careActor(request), JSON.parse(text)));
  } catch (error) { return careHttpError(error); }
}
