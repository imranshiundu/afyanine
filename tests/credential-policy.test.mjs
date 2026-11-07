import test from "node:test";
import assert from "node:assert/strict";
import { hashPassword, verifyPassword, normalizePhone, digestToken } from "../src/lib/credential-policy.ts";
test("Kenyan phone formats normalize to one connection identity", () => {
  for (const phone of ["0712 345 678", "712345678", "254712345678", "+254 (712) 345-678"]) assert.equal(normalizePhone(phone), "+254712345678");
  assert.throws(() => normalizePhone("1234"));
  assert.throws(() => normalizePhone("+254notaphone"));
});
test("password hashing is salted and verifies only correct password", () => {
  const password = "Fictional test password";
  const hash = hashPassword(password);
  assert.notEqual(hashPassword(password), hash);
  assert.equal(verifyPassword(password, hash), true);
  assert.equal(verifyPassword("wrong password", hash), false);
  assert.equal(verifyPassword(password, "invalid"), false);
});
test("session digest is stable and does not expose session token", () => {
  assert.equal(digestToken("fixture").length, 64);
  assert.equal(digestToken("fixture"), digestToken("fixture"));
  assert.notEqual(digestToken("fixture"), digestToken("other"));
});
