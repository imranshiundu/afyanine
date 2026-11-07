import test from "node:test";
import assert from "node:assert/strict";
let moduleId = 0;
async function fixture(t, blocked = false) {
  const old = globalThis.window;
  const browser = new EventTarget();
  const data = new Map();
  browser.sessionStorage = {
    getItem: key => { if (blocked) throw Error("Blocked"); return data.get(key) ?? null; },
    setItem: (key, value) => { if (blocked) throw Error("Blocked"); data.set(key, value); },
    removeItem: key => { if (blocked) throw Error("Blocked"); data.delete(key); },
  };
  globalThis.window = browser;
  t.after(() => { if (old === undefined) delete globalThis.window; else globalThis.window = old; });
  const load = () => import(`../src/components/afyanine/account-session.ts?test=${++moduleId}`);
  return { api: await load(), browser, data, load };
}
test("only well-formed fictional persona selections can restore", async t => {
  const { api } = await fixture(t);
  assert.equal(api.parseDemoSession(null), null);
  for (const value of ["{", '{"role":"admin","code":"MW-2105"}', '{"role":"mother","code":"bad"}', '{"role":"mother"}']) assert.equal(api.parseDemoSession(value), null);
});
test("reload retains Faith in this tab, not an arbitrary default mother", async t => {
  const { api, load } = await fixture(t);
  api.writeDemoSession({ role: "mother", code: "MW-2105" });
  const fresh = await load();
  assert.deepEqual(fresh.parseDemoSession(fresh.readDemoSession()), { role: "mother", code: "MW-2105" });
});
test("ending the session clears persistent selection and notifies listeners", async t => {
  const { api, data } = await fixture(t);
  let updates = 0;
  const stop = api.subscribeDemoSession(() => updates++);
  api.writeDemoSession({ role: "chw", code: "MW-1048" });
  api.writeDemoSession(null);
  assert.equal(api.readDemoSession(), null);
  assert.equal(data.size, 0);
  assert.equal(updates, 2);
  stop();
  api.writeDemoSession(null);
  assert.equal(updates, 2);
});
test("blocked storage supports a session without claiming persistence", async t => {
  const { api } = await fixture(t, true);
  api.writeDemoSession({ role: "mother", code: "MW-2105" });
  assert.equal(api.parseDemoSession(api.readDemoSession()).code, "MW-2105");
  api.writeDemoSession(null);
  assert.equal(api.readDemoSession(), null);
});
