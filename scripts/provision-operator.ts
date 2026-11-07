import { randomUUID } from "node:crypto";
import { db } from "../src/lib/db";
import { hashPassword, verifyPassword } from "../src/lib/credential-policy";
import { z } from "zod";
const email = z.email().parse(process.argv[2]).trim().toLowerCase();
const password = process.env.OPERATOR_PASSWORD ?? "";
if (!password || password.length < 12) throw new Error("Provide OPERATOR_PASSWORD securely (at least12 characters). It is never printed or stored in plaintext.");
async function main() {
try {
  await db.$transaction(async tx => {
    let identity = await tx.accountIdentity.findUnique({ where: { email } });
    // An unverified public signup must never be promoted just by matching email.
    if (identity && !verifyPassword(password, identity.passwordHash)) throw new Error("Existing account password does not authenticate. Refusing to promote it.");
    identity ??= await tx.accountIdentity.create({ data: { id: randomUUID(), email, displayName: "Operations", role: "CHW", passwordHash: hashPassword(password) } });
    await tx.careOperator.upsert({ where: { identityId: identity.id }, create: { identityId: identity.id }, update: { active: true } });
  });
  console.log("Operations grant provisioned. Sign in using the securely supplied password.");
} finally { await db.$disconnect(); }
}
main().catch(error => { console.error(error instanceof Error && error.message.startsWith("Existing account") ? error.message : "Operator provisioning failed; no secret values logged."); process.exitCode = 1; });
