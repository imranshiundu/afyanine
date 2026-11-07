import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/**
 * Browser-only Supabase client used for realtime `postgres_changes`.
 * Returns null on the server (route handlers never need it) and when the
 * public keys are absent — the app silently poll-freezes to demo data.
 */
let client: SupabaseClient | null = null;

export function getSupabase(): SupabaseClient | null {
  if (typeof window === "undefined") return null;
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  client = createClient(url, key, {
    realtime: { params: { eventsPerSecond: 5 } },
  });
  return client;
}

export const REALTIME_CHANNEL = "afyanine-live";
