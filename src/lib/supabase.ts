import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser identity + optional fictional-ward realtime. Missing configuration
 * disables account actions; it never authenticates a user into a demo persona.
 */
let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (typeof window === "undefined") return null;
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  client = createClient(url, key, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: false, flowType: "pkce" },
    realtime: { params: { eventsPerSecond: 5 } },
  });
  return client;
}

export const REALTIME_CHANNEL = "afyanine-live";

export const isAuthConfigured = () => Boolean(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);

let codeExchange: { code: string; request: ReturnType<SupabaseClient["auth"]["exchangeCodeForSession"]> } | null = null;
export function exchangeAuthCode(code: string) {
  const sb = getSupabase();
  if (!sb) throw new Error("Authentication is not configured.");
  // Strict Mode can mount the callback twice; consume a one-use code once.
  if (codeExchange?.code !== code) codeExchange = { code, request: sb.auth.exchangeCodeForSession(code) };
  return codeExchange.request;
}
