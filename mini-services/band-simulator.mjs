// Standalone fallback for installations without pg_cron.
// Run one or more workers safely: the database serializes generation.
import { PrismaClient } from "@prisma/client";
import { join } from "node:path";
const url = new URL(process.env.DATABASE_URL);
if (url.hostname.endsWith(".pooler.supabase.com")) {
  url.searchParams.set("sslmode", "require");
  url.searchParams.set("sslaccept", "strict");
  url.searchParams.set("sslcert", join(process.cwd(), "certs/supabase-root-2021.crt"));
}
const db = new PrismaClient({ log: [], datasourceUrl: url.toString() });
let stopping = false;
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => { stopping = true; });
while (!stopping) {
  try { await db.$queryRaw`SELECT public.afyanine_simulate_bands()`; }
  catch { console.error("Band simulator database unavailable; retrying. No credentials logged."); }
  await new Promise(resolve => setTimeout(resolve, 10000));
}
await db.$disconnect();
