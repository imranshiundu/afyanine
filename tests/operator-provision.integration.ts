import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { db } from "../src/lib/db";
import { hashPassword } from "../src/lib/credential-policy";

async function main() {
  const url = new URL(process.env.DATABASE_URL!);
  assert.ok(["localhost", "127.0.0.1"].includes(url.hostname) && url.pathname === "/afyanine", "Isolated local database only.");
  const suffix = randomUUID();
  const existing = `operator-existing-${suffix}@example.test`;
  const fresh = `operator-new-${suffix}@example.test`;
  // Deliberately test the same minimum accepted by public account registration.
  const currentPassword = randomUUID().replaceAll("-", "").slice(0, 10);
  const newPassword = randomUUID();
  const provision = (email: string, password: string) => spawnSync(process.execPath, ["--import", "tsx", "scripts/provision-operator.ts", email], {
    cwd: process.cwd(), env: { ...process.env, OPERATOR_PASSWORD: password }, stdio: "pipe", timeout: 30000,
  }).status;
  try {
    const identity = await db.accountIdentity.create({ data: { id: randomUUID(), email: existing, role: "CHW", displayName: "Fictional operator", passwordHash: hashPassword(currentPassword) } });
    assert.notEqual(provision(existing, randomUUID()), 0, "Email match alone must never promote an existing account.");
    assert.equal(await db.careOperator.count({ where: { identityId: identity.id } }), 0);
    assert.equal(provision(existing, currentPassword), 0);
    assert.equal((await db.careOperator.findUniqueOrThrow({ where: { identityId: identity.id } })).active, true);
    assert.notEqual(provision(fresh, currentPassword), 0, "A new operator must use at least12 characters.");
    assert.equal(await db.accountIdentity.count({ where: { email: fresh } }), 0);
    assert.equal(provision(fresh, newPassword), 0);
    console.log("PASS: operator promotion requires existing password; new operator password minimum enforced; no email-only privilege grant.");
  } finally {
    await db.accountIdentity.deleteMany({ where: { email: { in: [existing, fresh] } } });
    await db.$disconnect();
  }
}
main().catch(error => { console.error("Operator integration failed:", error.name); process.exitCode = 1; });
