import test from "node:test";
import assert from "node:assert/strict";
import { initialEntryRole, rememberEntryRole } from "../src/components/afyanine/entry-role.ts";

test("entry selection is an optional role hint, not an administrator claim", () => {
  const values = new Map();
  globalThis.window = { sessionStorage: { setItem: (key,value) => values.set(key,value), getItem: key => values.get(key) ?? null } };
  try {
    rememberEntryRole("chw"); assert.equal(initialEntryRole(), "CHW");
    rememberEntryRole("mother"); assert.equal(initialEntryRole(), "MOTHER");
    assert.equal(initialEntryRole({afyanine_role:"CHW"}), "CHW");
    assert.equal(initialEntryRole({afyanine_role:"ADMIN"}), "MOTHER");
  } finally { delete globalThis.window; }
});
test("role metadata survives email confirmation on another device; invalid or blocked hints fail closed", () => {
  assert.equal(initialEntryRole({afyanine_role:"CHW"}), "CHW");
  assert.equal(initialEntryRole({afyanine_role:"MOTHER"}), "MOTHER");
  assert.equal(initialEntryRole({afyanine_role:"ADMIN"}), "MOTHER");
  globalThis.window = { get sessionStorage() { throw new Error("blocked"); } };
  try { rememberEntryRole("chw"); assert.equal(initialEntryRole(), "MOTHER"); }
  finally { delete globalThis.window; }
});
