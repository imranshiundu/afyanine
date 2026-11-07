import { createClient } from "@supabase/supabase-js";
import { CareError, normalizeEmail, trustedAdmin, type CareActor } from "./care-policy";

export async function careActor(request: Request): Promise<CareActor> {
  const match = /^Bearer ([^\s]+)$/.exec(request.headers.get("authorization") ?? "");
  if (!match || match[1].length > 8192) throw new CareError(401, "SIGN_IN_REQUIRED");
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) throw new CareError(503, "AUTH_NOT_CONFIGURED");
  const client = createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: { fetch: (input, init) => fetch(input, { ...init, signal: AbortSignal.timeout(8000) }) },
  });
  const { data, error } = await client.auth.getUser(match[1]);
  if (error || !data.user) throw new CareError(401, "SIGN_IN_REQUIRED");
  if (!data.user.email || !data.user.email_confirmed_at) throw new CareError(403, "CONFIRM_EMAIL");
  return { id: data.user.id, email: normalizeEmail(data.user.email), isDemo: false, admin: trustedAdmin(data.user) };
}
