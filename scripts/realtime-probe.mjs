#!/usr/bin/env node
/**
 * Realtime smoke test — listens on the afyanine-live channel from Node.
 *   node scripts/realtime-probe.mjs            (Ctrl+C stops)
 *   node scripts/realtime-probe.mjs --once     (exit after first event or 90s)
 *
 * Expect postgres_changes INSERT/UPDATE events from any open session or the
 * bot: VitalReading / Emergency / VisitNote rows changing.
 */
import { createClient } from "@supabase/supabase-js";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(new URL("../.env", import.meta.url), "utf8")
    .split("\n")
    .filter((l) => l.trim() && !l.trim().startsWith("#"))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, "")];
    })
);

const url = env.NEXT_PUBLIC_SUPABASE_URL;
const key = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
if (!url || !key) {
  console.error("missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY in .env");
  process.exit(1);
}

const once = process.argv.includes("--once");
const sb = createClient(url, key);
let saw = false;

const onEvent = (label) => (payload) => {
  saw = true;
  const detail = label === "VisitNote"
    ? payload.new?.body?.slice(0, 48)
    : payload.new?.systolic ??
      payload.new?.kind ??
      payload.old?.status;
  console.log(`[${label}] ${payload.eventType}${detail ? ` · ${detail}` : ""}`);
  if (once) finish();
};

let done = false;
function finish(msg = "first event received ✓", code = 0) {
  if (done) return;
  done = true;
  console.log(msg);
  void sb.removeChannel(channel);
  process.exit(code);
}

console.log(`listening on channel afyanine-live → ${url}`);
const channel = sb
  .channel("afyanine-live")
  .on("postgres_changes", { event: "*", schema: "public", table: "VitalReading" }, onEvent("VitalReading"))
  .on("postgres_changes", { event: "*", schema: "public", table: "Emergency" }, onEvent("Emergency"))
  .on("postgres_changes", { event: "*", schema: "public", table: "VisitNote" }, onEvent("VisitNote"))
  .subscribe((status) => {
    if (status === "SUBSCRIBED") console.log("subscribed ✓ — trigger /api/bot/tick or an SOS to see events");
    else console.log("status:", status);
  });

setTimeout(() => {
  if (once) finish("timed out after 90s — no realtime events received", 1);
}, 90_000);
