import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";
import { authenticateAccount, accountIdentity, sameOrigin, secureCookie, SESSION_COOKIE, SESSION_SECONDS, sessionToken, sessionUser } from "@/lib/account-auth";
import { digestToken } from "@/lib/credential-policy";
import { careHttpError } from "@/lib/care-workspace";
import { CareError } from "@/lib/care-policy";

export const dynamic = "force-dynamic";
const fields = z.object({
  mode: z.enum(["signup", "signin"]), email: z.email().max(254), phone: z.string().min(9).max(25).optional(),
  password: z.string().min(10).max(128), name: z.string().trim().min(2).max(80).optional(),
  role: z.enum(["MOTHER", "CHW"]).optional(),
});
export async function GET(request: Request) {
  try { return NextResponse.json({ user: sessionUser(await accountIdentity(request)) }, { headers: { "Cache-Control": "no-store" } }); }
  catch (error) { return careHttpError(error); }
}
export async function POST(request: Request) {
  try {
    sameOrigin(request);
    const text = await request.text();
    if (text.length > 2048) throw new CareError(413, "INVALID_INPUT");
    let body;
    try { body = JSON.parse(text); } catch { throw new CareError(400, "INVALID_INPUT"); }
    const input = fields.safeParse(body);
    if (!input.success || input.data.mode === "signup" && (!input.data.name || !input.data.role || !input.data.phone)) throw new CareError(400, "Enter a valid email and password of at least 10 characters. Registration also requires your name and phone.");
    const result = await authenticateAccount(input.data);
    const response = NextResponse.json({ user: result.user }, { headers: { "Cache-Control": "no-store" } });
    response.cookies.set(SESSION_COOKIE, result.token, { httpOnly: true, secure: secureCookie(request), sameSite: "lax", path: "/", maxAge: SESSION_SECONDS });
    return response;
  } catch (error) { return careHttpError(error); }
}
export async function DELETE(request: Request) {
  try {
    sameOrigin(request);
    await db.accountSession.deleteMany({ where: { tokenHash: digestToken(sessionToken(request)) } });
    const response = NextResponse.json({ ok: true }, { headers: { "Cache-Control": "no-store" } });
    response.cookies.set(SESSION_COOKIE, "", { httpOnly: true, sameSite: "lax", secure: secureCookie(request), path: "/", maxAge: 0 });
    return response;
  } catch (error) { return careHttpError(error); }
}
