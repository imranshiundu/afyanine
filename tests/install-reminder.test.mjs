import test from "node:test";
import assert from "node:assert/strict";
import {
  InstallReminderController, FIRST_REMINDER_MS, REMINDER_SNOOZE_MS,
  INSTALL_KEY, NEXT_REMINDER_KEY,
} from "../src/components/afyanine/install-reminder.ts";

class FakeClock {
  time = 1_000_000;
  nextId = 0;
  timers = new Map();
  now = () => this.time;
  setTimeout = (callback, delay) => {
    const id = ++this.nextId;
    this.timers.set(id, { callback, at: this.time + delay });
    return id;
  };
  clearTimeout = (id) => { this.timers.delete(id); };
  advance(ms) {
    const target = this.time + ms;
    for (;;) {
      const due = [...this.timers.entries()].filter(([, timer]) => timer.at <= target)
        .sort((a, b) => a[1].at - b[1].at)[0];
      if (!due) break;
      this.time = due[1].at;
      this.timers.delete(due[0]);
      due[1].callback();
    }
    this.time = target;
  }
}

function setup(t, { standalone = false, ios = false, blocked = false, storage = new Map() } = {}) {
  const browser = new EventTarget();
  const media = new EventTarget();
  media.matches = standalone;
  browser.matchMedia = () => media;
  browser.navigator = { standalone: ios, userAgent: ios ? "iPhone" : "Chrome", platform: "", maxTouchPoints: 0 };
  browser.document = new EventTarget();
  browser.document.visibilityState = "visible";
  browser.localStorage = {
    getItem: (key) => {
      if (blocked) throw new Error("Blocked");
      return storage.get(key) ?? null;
    },
    setItem: (key, value) => {
      if (blocked) throw new Error("Blocked");
      storage.set(key, value);
    },
  };
  const clock = new FakeClock();
  const controller = new InstallReminderController(browser, () => {}, clock);
  const stop = controller.start();
  t.after(stop);
  return { browser, media, clock, controller, storage, stop };
}

function promptEvent(outcome = "dismissed", error = false) {
  const event = new Event("beforeinstallprompt", { cancelable: true });
  let calls = 0;
  event.prompt = async () => {
    calls++;
    if (error) throw new Error("Prompt unavailable");
  };
  event.userChoice = Promise.resolve({ outcome });
  return { event, calls: () => calls };
}

test("reminder appears after delay and never auto-disappears", (t) => {
  const { controller, clock } = setup(t);
  clock.advance(FIRST_REMINDER_MS - 1);
  assert.equal(controller.getSnapshot().visible, false);
  clock.advance(1);
  assert.equal(controller.getSnapshot().visible, true);
  clock.advance(30 * 60_000);
  assert.equal(controller.getSnapshot().visible, true);
});

test("Not now re-prompts after ten minutes, not permanently", (t) => {
  const { controller, clock, storage } = setup(t);
  clock.advance(FIRST_REMINDER_MS);
  controller.snooze();
  assert.equal(controller.getSnapshot().visible, false);
  assert.equal(storage.get(INSTALL_KEY), undefined);
  clock.advance(REMINDER_SNOOZE_MS - 1);
  assert.equal(controller.getSnapshot().visible, false);
  clock.advance(1);
  assert.equal(controller.getSnapshot().visible, true);
});

test("a new visit respects the persisted snooze", (t) => {
  const storage = new Map([[NEXT_REMINDER_KEY, String(1_000_000 + 60_000)]]);
  const { controller, clock } = setup(t, { storage });
  clock.advance(FIRST_REMINDER_MS);
  assert.equal(controller.getSnapshot().visible, false);
  clock.advance(60_000 - FIRST_REMINDER_MS);
  assert.equal(controller.getSnapshot().visible, true);
});

test("native event is deferred, consumed once, and dismissal does not imply installed", async (t) => {
  const { controller, clock, browser, storage } = setup(t);
  const native = promptEvent();
  browser.dispatchEvent(native.event);
  assert.equal(native.event.defaultPrevented, true);
  assert.equal(native.calls(), 0);
  clock.advance(FIRST_REMINDER_MS);
  await controller.install();
  assert.equal(native.calls(), 1);
  assert.equal(controller.getSnapshot().canPrompt, false);
  assert.equal(storage.get(INSTALL_KEY), undefined);
  clock.advance(REMINDER_SNOOZE_MS);
  await controller.install();
  assert.equal(native.calls(), 1);
  assert.equal(controller.getSnapshot().instructions, true);
});

test("accepted native choice is not treated as proof of installation", async (t) => {
  const { controller, clock, browser, storage } = setup(t);
  browser.dispatchEvent(promptEvent("accepted").event);
  clock.advance(FIRST_REMINDER_MS);
  await controller.install();
  assert.equal(storage.get(INSTALL_KEY), undefined);
  clock.advance(REMINDER_SNOOZE_MS);
  assert.equal(controller.getSnapshot().visible, true);
});

test("a fresh native event can enable installation again after dismissal", async (t) => {
  const { controller, clock, browser } = setup(t);
  const first = promptEvent();
  browser.dispatchEvent(first.event);
  clock.advance(FIRST_REMINDER_MS);
  await controller.install();
  const second = promptEvent();
  browser.dispatchEvent(second.event);
  clock.advance(REMINDER_SNOOZE_MS);
  assert.equal(controller.getSnapshot().canPrompt, true);
  await controller.install();
  assert.equal(first.calls(), 1);
  assert.equal(second.calls(), 1);
});

test("appinstalled hides and suppresses further reminders", (t) => {
  const { controller, clock, browser, storage } = setup(t);
  clock.advance(FIRST_REMINDER_MS);
  browser.dispatchEvent(new Event("appinstalled"));
  assert.equal(storage.get(INSTALL_KEY), "yes");
  assert.equal(controller.getSnapshot().visible, false);
  clock.advance(60 * 60_000);
  assert.equal(controller.getSnapshot().visible, false);
});

for (const [name, options] of [
  ["standalone", { standalone: true }],
  ["iOS home screen", { ios: true }],
  ["remembered install", { storage: new Map([[INSTALL_KEY, "yes"]]) }],
]) {
  test(`${name} never shows the reminder`, (t) => {
    const { controller, clock } = setup(t, options);
    clock.advance(60 * 60_000);
    assert.equal(controller.getSnapshot().visible, false);
  });
}

test("hidden tabs and SOS suppression defer reminders until returning", (t) => {
  const { controller, clock, browser } = setup(t);
  browser.document.visibilityState = "hidden";
  browser.document.dispatchEvent(new Event("visibilitychange"));
  clock.advance(FIRST_REMINDER_MS);
  assert.equal(controller.getSnapshot().visible, false);
  browser.document.visibilityState = "visible";
  controller.setSuppressed(true);
  browser.document.dispatchEvent(new Event("visibilitychange"));
  assert.equal(controller.getSnapshot().visible, false);
  controller.setSuppressed(false);
  assert.equal(controller.getSnapshot().visible, true);
});

test("blocked storage still supports session cooldowns", (t) => {
  const { controller, clock } = setup(t, { blocked: true });
  clock.advance(FIRST_REMINDER_MS);
  controller.snooze();
  clock.advance(REMINDER_SNOOZE_MS);
  assert.equal(controller.getSnapshot().visible, true);
});

test("install/cooldown state syncs from another tab", (t) => {
  const { controller, clock, browser, storage } = setup(t);
  clock.advance(FIRST_REMINDER_MS);
  storage.set(NEXT_REMINDER_KEY, String(clock.now() + REMINDER_SNOOZE_MS));
  browser.dispatchEvent(new Event("storage"));
  assert.equal(controller.getSnapshot().visible, false);
  clock.advance(REMINDER_SNOOZE_MS);
  assert.equal(controller.getSnapshot().visible, true);
  storage.set(INSTALL_KEY, "yes");
  browser.dispatchEvent(new Event("storage"));
  assert.equal(controller.getSnapshot().visible, false);
});

test("failed native prompt falls back to instructions and is not reused", async (t) => {
  const { controller, clock, browser } = setup(t);
  const native = promptEvent("dismissed", true);
  browser.dispatchEvent(native.event);
  clock.advance(FIRST_REMINDER_MS);
  await controller.install();
  assert.equal(controller.getSnapshot().instructions, true);
  assert.equal(controller.getSnapshot().busy, false);
  assert.equal(native.calls(), 1);
});

test("stopping clears timers and detaches browser event listeners", (t) => {
  const { controller, clock, browser, stop } = setup(t);
  stop();
  clock.advance(60 * 60_000);
  assert.equal(controller.getSnapshot().visible, false);
  const native = promptEvent();
  browser.dispatchEvent(native.event);
  assert.equal(native.event.defaultPrevented, false);
  assert.equal(clock.timers.size, 0);
});
