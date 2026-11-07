import { accountIdentity, sameOrigin } from "@/lib/account-auth";
import { normalizePhone } from "@/lib/credential-policy";
import { db } from "@/lib/db";
import { z } from "zod";
import { careHttpError } from "@/lib/care-workspace";
export async function PATCH(request: Request) {
  try {
    sameOrigin(request);
    const identity = await accountIdentity(request);
    const text = await request.text();
    if (text.length > 2048) return Response.json({ error: "Invalid profile." }, { status: 400 });
    const result = z.object({ name: z.string().trim().min(2).max(80), phone: z.string().min(9).max(25) }).safeParse(JSON.parse(text));
    if (!result.success) return Response.json({ error: "Enter your name and phone number." }, { status: 400 });
    let phone: string;
    try { phone = normalizePhone(result.data.phone); }
    catch { return Response.json({ error: "Enter a valid phone number." }, { status: 400 }); }
    await db.$transaction(async tx => {
      await tx.accountIdentity.update({ where: { id: identity.id }, data: { displayName: result.data.name, phone } });
      await tx.careAccount.update({ where: { id: identity.id }, data: { displayName: result.data.name, phone } });
    });
    return Response.json({ ok: true });
  } catch (error) {
    if ((error as { code?: string }).code === "P2002") return Response.json({ error: "Phone number is already registered." }, { status: 409 });
    return careHttpError(error);
  }
}
