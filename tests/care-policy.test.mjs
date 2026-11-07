import test from "node:test";
import assert from "node:assert/strict";
import { normalizeEmail, trustedAdmin, sharedScopes, overlaps } from "../src/lib/care-policy.ts";
test("user-editable metadata cannot grant administrator privileges", () => {
  assert.equal(trustedAdmin({user_metadata:{afyanine_admin:true}}), false);
  assert.equal(trustedAdmin({app_metadata:{afyanine_admin:"true"}}), false);
  assert.equal(trustedAdmin({app_metadata:{afyanine_admin:true}}), true);
});
test("email discovery normalizes; categories require both storage and sharing consent", () => {
  assert.equal(normalizeEmail(" A@EXAMPLE.TEST "), "a@example.test");
  assert.deepEqual(sharedScopes(["VITALS", "CONTACTS"], ["VITALS", "NOTES"]), ["VITALS"]);
  assert.deepEqual(sharedScopes([], ["VITALS"]), []);
});
test("adjacent visits may touch; overlapping intervals conflict", () => {
  const d = n => new Date(n);
  assert.equal(overlaps(d(1),d(2),d(2),d(3)), false);
  assert.equal(overlaps(d(1),d(3),d(2),d(4)), true);
});
