import test from "node:test";
import assert from "node:assert/strict";

let moduleId = 0;
async function setup(t, { standalone = false, ios = false, stored = null, blocked = false } = {}) {
  const oldWindow = globalThis.window;
  const media = new EventTarget();
  media.matches = standalone;
  const storage = new Map();
  if (stored) storage.set("afyanine:onboarding:v1", stored);
  const browser = new EventTarget();
  browser.navigator = { standalone: ios };
  browser.matchMedia = () => media;
  browser.localStorage = {
    getItem: (key) => {
      if (blocked) throw new Error("Storage blocked");
      return storage.get(key) ?? null;
    },
    setItem: (key, value) => {
      if (blocked) throw new Error("Storage blocked");
      storage.set(key, value);
    },
  };
  globalThis.window = browser;
  t.after(() => {
    if (oldWindow === undefined) delete globalThis.window;
    else globalThis.window = oldWindow;
  });
  const api = await import(`../src/components/afyanine/installed-onboarding.ts?test=${++moduleId}`);
  return { api, browser, media, storage };
}

test("ordinary browser keeps the original sign-in entry", async (t) => {
  const { api } = await setup(t);
  assert.equal(api.getInstalledOnboardingSnapshot(), false);
  assert.equal(api.getOnboardingServerSnapshot(), false);
});

test("first standalone launch shows onboarding", async (t) => {
  const { api } = await setup(t, { standalone: true });
  assert.equal(api.getInstalledOnboardingSnapshot(), true);
});

test("iOS home-screen launch shows onboarding", async (t) => {
  const { api } = await setup(t, { ios: true });
  assert.equal(api.getInstalledOnboardingSnapshot(), true);
});

test("returning installed launch skips onboarding", async (t) => {
  const { api } = await setup(t, { standalone: true, stored: "done" });
  assert.equal(api.getInstalledOnboardingSnapshot(), false);
});

test("completion persists only the versioned flag and notifies subscribers", async (t) => {
  const { api, media, browser, storage } = await setup(t, { standalone: true });
  let changes = 0;
  const unsubscribe = api.subscribeInstalledOnboarding(() => { changes++; });
  media.dispatchEvent(new Event("change"));
  browser.dispatchEvent(new Event("storage"));
  api.completeInstalledOnboarding();
  assert.equal(changes, 3);
  assert.deepEqual([...storage.entries()], [[api.ONBOARDING_KEY, "done"]]);
  assert.equal(api.getInstalledOnboardingSnapshot(), false);
  unsubscribe();
  browser.dispatchEvent(new Event("storage"));
  media.dispatchEvent(new Event("change"));
  assert.equal(changes, 3);
});

test("blocked storage still allows completing onboarding for this session", async (t) => {
  const { api } = await setup(t, { standalone: true, blocked: true });
  assert.equal(api.getInstalledOnboardingSnapshot(), true);
  api.completeInstalledOnboarding();
  assert.equal(api.getInstalledOnboardingSnapshot(), false);
});
