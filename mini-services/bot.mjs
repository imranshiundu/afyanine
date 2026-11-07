#!/usr/bin/env node
/**
 * AfyaNine mini-bot runner — keeps simulated live stats moving.
 *   npm run bot            (defaults below)
 *   BOT_TICK_URL=.. BOT_INTERVAL_MS=.. node mini-services/bot.mjs
 *
 * Every interval it posts one tick to /api/bot/tick; motion ±15% keeps the
 * ward alive without looking robotic.
 */
const candidates = process.env.BOT_TICK_URL
  ? [process.env.BOT_TICK_URL]
  : ["http://localhost:3000/api/bot/tick", "http://localhost:3001/api/bot/tick"];
const interval = Number(process.env.BOT_INTERVAL_MS ?? 45_000);

const log = (msg) => console.log(`[bot ${new Date().toISOString()}] ${msg}`);

let url = candidates[0];
let tried = 0;

async function tickOnce(i) {
  if (!process.env.BOT_TICK_URL) {
    // keep talking to the port that worked last (3000 here is risky: it may
    // belong to a different project and answer 404 for /api/bot/tick)
    candidates.sort((a, b) => (a === url ? -1 : b === url ? 1 : 0));
  }
  for (const candidate of candidates) {
    try {
      const forceSos = process.argv.includes("--force-sos") && i % 3 === 1;
      const res = await fetch(candidate, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(forceSos ? { forceSos: true } : {}),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      if (candidate !== url) {
        url = candidate;
        log(`talking to ${candidate}`);
      }
      log(
        `readings +${data.readingsAdded} · notes +${data.notesAdded.length} · SOS +${data.emergenciesRaised.length} · accounts ensured ${data.accountsEnsured}`
      );
      return;
    } catch (err) {
      tried++;
      log(`tick failed on ${candidate}: ${err.message}`);
    }
  }
  if (tried >= 4 * candidates.length) {
    log("no server responding on any port — is `npm run dev` up?");
  }
}

let i = 0;
log(`runner up → POST ${candidates.join(" | ")} every ~${Math.round(interval / 1000)}s`);
await tickOnce(i++);
setInterval(() => void tickOnce(i++), interval);
