// Explicit operator setup, never run by build/dev scripts.
// SUPABASE_ACCESS_TOKEN must be injected with the secrets tool, not pasted.
import { readFile, writeFile } from "node:fs/promises";
import { randomBytes } from "node:crypto";
const ref = process.argv[2];
if (!ref || !process.argv.includes("--apply")) throw new Error("Pass project ref and --apply.");
const token = process.env.SUPABASE_ACCESS_TOKEN;
if (!token) throw new Error("SUPABASE_ACCESS_TOKEN is required.");
async function api(path, body) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${ref}${path}`, {
    method: body ? "POST" : "GET",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  // Never print SQL, request/response bodies, passwords or connection strings.
  if (!response.ok) {
    const text = await response.text();
    const parsed = (() => { try { return JSON.parse(text); } catch { return {}; } })();
    const reason = String(parsed.message ?? "").match(/ERROR:\s*[A-Z0-9]{5}:\s*([^\n]+)/)?.[1];
    const safeReason = reason?.replace(/'[^']*'/g, "'[redacted]'").replace(/\b[a-f0-9]{40,}\b/gi, "[redacted]");
    throw new Error(`Supabase operation failed (HTTP ${response.status})${safeReason ? `: ${safeReason}` : "; response withheld."}`);
  }
  return response.json();
}
const sql = query => api("/database/query", { query });
const project = await api("");
if (project.name.toLowerCase() !== "imran") throw new Error("Only the user-approved Imran project is allowed.");
const inventory = await sql(`SELECT table_name FROM information_schema.tables WHERE table_schema='public'`);
if (inventory.some(row => row.table_name === "CareAccount" || row.table_name === "AccountIdentity")) throw new Error("Account schema already exists. No changes made; review before re-running.");
const roles = await sql(`SELECT rolname FROM pg_roles WHERE rolname='afyanine_app'`);
if (roles.length) throw new Error("Runtime role already exists. No credentials rotated.");
const poolers = await api("/config/database/pooler");
const pooler = poolers.find(row => row.database_type === "PRIMARY");
if (!pooler?.db_host) throw new Error("No primary pooler host was returned.");
const password = randomBytes(32).toString("hex");
const files = ["care-team.sql", "password-accounts.sql", "live-bands.sql"];
const migrations = await Promise.all(files.map(file => readFile(`prisma/${file}`, "utf8")));
const tables = ["CareAccount","CareInvite","CareAccess","CareVisit","CareNote","CareVital","CareContact","CareAudit","AccountIdentity","AccountSession","AuthThrottle","CareAlert","CareBand"];
const body = migrations.map(content => content.replace(/^BEGIN;\s*$/gm, "").replace(/^COMMIT;\s*$/gm, "")).join("\n");
await sql(`BEGIN;
${body}
CREATE ROLE afyanine_app LOGIN PASSWORD '${password}' NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT;
GRANT afyanine_app TO CURRENT_USER;
GRANT CONNECT ON DATABASE postgres TO afyanine_app;
GRANT USAGE, CREATE ON SCHEMA public TO afyanine_app;
${tables.map(table => `ALTER TABLE public."${table}" OWNER TO afyanine_app;`).join("\n")}
ALTER FUNCTION public.afyanine_notify_change() OWNER TO afyanine_app;
ALTER FUNCTION public.afyanine_simulate_bands() OWNER TO afyanine_app;
REVOKE CREATE ON SCHEMA public FROM afyanine_app;
COMMIT;`);
const session = new URL(`postgresql://${pooler.db_host}:5432/postgres`);
session.username = `afyanine_app.${ref}`; session.password = password;
session.searchParams.set("sslmode", "verify-full");
const database = new URL(session);
database.port = "6543"; database.searchParams.set("sslmode", "require"); database.searchParams.set("pgbouncer", "true");
// Ignored, mode600, server-only. Do not print or attach this file.
await writeFile(".env.supabase.local", `DATABASE_URL=${JSON.stringify(database.toString())}\nSUPABASE_SESSION_DATABASE_URL=${JSON.stringify(session.toString())}\n`, { mode: 0o600 });
console.log("PASS: Imran additive schema installed; original tables preserved. Restricted runtime role created; connection settings saved privately.");
// A DB scheduler keeps simulated bound-band data flowing when no page is open.
// Installing this extension/job does not create any bindings/readings.
await sql(`CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;`);
await sql(`SELECT cron.schedule('afyanine-bound-band-simulation', '10 seconds', 'SELECT public.afyanine_simulate_bands()');`);
console.log("PASS: bound-band simulator scheduled every10seconds. Only opt-in, bound simulated bands generate readings.");
