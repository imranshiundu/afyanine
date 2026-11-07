import { readFileSync, existsSync } from "node:fs";
import { parseEnv } from "node:util";
import { spawn } from "node:child_process";
const target = process.argv[2] ?? "web";
const env = { ...process.env, CARE_RECORDS_ENABLED: "true", ...parseEnv(readFileSync(".env.shared.local", "utf8")) };
if (process.argv.includes("--hosted")) {
  if (!existsSync(".env.supabase.local")) throw new Error("Configure private Supabase runtime credentials first.");
  Object.assign(env, parseEnv(readFileSync(".env.supabase.local", "utf8")));
}
const args = target === "gateway" ? ["--import", "tsx", "mini-services/realtime.ts"]
  : target === "operator" ? ["--import", "tsx", "scripts/provision-operator.ts", ...process.argv.slice(3).filter(a => a !== "--hosted")]
  : target === "simulator" ? ["mini-services/band-simulator.mjs"]
  : ["node_modules/next/dist/bin/next", "dev", "--webpack", "-H", "0.0.0.0", "-p", "3000"];
const child = spawn(process.execPath, args, { env, stdio: "inherit" });
for (const signal of ["SIGTERM", "SIGINT"]) process.on(signal, () => child.kill(signal));
child.on("exit", code => process.exit(code ?? 0));
