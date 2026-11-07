import { sessionToken } from "@/lib/account-auth";
import { digestToken } from "@/lib/credential-policy";
import { signTicket, socketActor } from "@/lib/socket-auth";
import { careHttpError } from "@/lib/care-workspace";
export const dynamic = "force-dynamic";
export async function GET(request: Request) {
  try {
    const sid = digestToken(sessionToken(request));
    const ops = new URL(request.url).searchParams.get("ops") === "1";
    await socketActor({ sid, ops });
    return Response.json({ ticket: signTicket(sid, ops), url: process.env.REALTIME_PUBLIC_URL ?? null }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) { return careHttpError(error); }
}
