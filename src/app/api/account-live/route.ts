import { careActor } from "@/lib/care-auth";
import { careLive } from "@/lib/care-live";
import { careHttpError } from "@/lib/care-workspace";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try { return Response.json(await careLive(await careActor(request)), { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { return careHttpError(error); }
}
