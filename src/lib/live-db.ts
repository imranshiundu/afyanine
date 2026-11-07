import { Client } from "pg";
import { readFileSync } from "node:fs";
import { join } from "node:path";

type Handler = (error?: boolean) => void;
type Hub = { client?: Client; connecting?: Promise<void>; listeners: Set<Handler> };
const globals = globalThis as unknown as { afyaLiveHub?: Hub };
const hub = globals.afyaLiveHub ??= { listeners: new Set() };

// LISTEN needs a direct or session-pool connection, NOT a transaction pool.
// One listener connection per server process, shared across browser streams.
async function connect() {
  if (hub.client) return;
  if (hub.connecting) return hub.connecting;
  hub.connecting = (async () => {
    const connectionString = process.env.SUPABASE_SESSION_DATABASE_URL ?? process.env.DATABASE_URL;
    if (!connectionString || new URL(connectionString).port === "6543") throw new Error("SESSION_CONNECTION_REQUIRED");
    const url = new URL(connectionString);
    const hosted = url.hostname.endsWith(".pooler.supabase.com");
    // Explicit CA + hostname verification, never rejectUnauthorized:false.
    if (hosted) url.searchParams.delete("sslmode");
    const client = new Client({
      connectionString: url.toString(), connectionTimeoutMillis: 8000, application_name: "afyanine-live",
      ...(hosted ? { ssl: { ca: readFileSync(join(process.cwd(), "certs/supabase-root-2021.crt"), "utf8"), rejectUnauthorized: true } } : {}),
    });
    try {
      await client.connect();
      client.on("notification", () => { for (const listener of hub.listeners) listener(); });
      client.on("error", () => {
        if (hub.client === client) hub.client = undefined;
        for (const listener of hub.listeners) listener(true);
        void client.end().catch(() => {});
      });
      await client.query("LISTEN afyanine_changes");
      hub.client = client;
    } catch {
      await client.end().catch(() => {});
      throw new Error("LIVE_UNAVAILABLE");
    }
  })().finally(() => { hub.connecting = undefined; });
  return hub.connecting;
}
export async function subscribeLive(handler: Handler) {
  hub.listeners.add(handler);
  try { await connect(); } catch (error) { hub.listeners.delete(handler); throw error; }
  return () => {
    hub.listeners.delete(handler);
    if (!hub.listeners.size && hub.client) {
      const client = hub.client;
      hub.client = undefined;
      void client.end().catch(() => {});
    }
  };
}
