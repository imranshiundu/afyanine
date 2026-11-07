import { readFileSync } from "node:fs";
const ref = process.argv[2];
if (ref !== "xosqbyjzlhjnoscspvcc" || !process.argv.includes("--apply")) throw new Error("Explicit Imran project ref and --apply are required.");
if (!process.env.SUPABASE_ACCESS_TOKEN) throw new Error("Supply SUPABASE_ACCESS_TOKEN through the secure secrets wrapper.");
async function query(sql) {
  const response = await fetch(`https://api.supabase.com/v1/projects/${ref}/database/query`, { method: "POST", headers: { Authorization: `Bearer ${process.env.SUPABASE_ACCESS_TOKEN}`, "Content-Type": "application/json" }, body: JSON.stringify({ query: sql }) });
  if (!response.ok) throw new Error(`Database migration request failed (${response.status}); no credentials or result data logged.`);
  return response.json();
}
const before = await query(`SELECT to_regclass('public."CareOperator"') IS NOT NULL AS ready`);
if (!before[0]?.ready) await query(readFileSync("prisma/shared-live.sql", "utf8"));
const result = await query(`SELECT relrowsecurity AS rls, pg_get_userbyid(relowner)='afyanine_app' AS restricted_owner FROM pg_class WHERE oid='public."CareOperator"'::regclass`);
if (!result[0]?.rls || !result[0]?.restricted_owner) throw new Error("Operator table policy verification failed.");
console.log("Shared live migration verified: operator table protected, original data preserved.");
