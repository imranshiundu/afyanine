export const INSTALL_KEY = "afyanine:installed:v1";
export const NEXT_REMINDER_KEY = "afyanine:install-reminder-next:v1";
export const FIRST_REMINDER_MS = 5_000;
export const REMINDER_SNOOZE_MS = 10 * 60_000;

interface InstallPromptEvent extends Event {
  prompt(): Promise<unknown>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export interface ReminderState {
  visible: boolean;
  canPrompt: boolean;
  busy: boolean;
  instructions: boolean;
  ios: boolean;
}

export const INITIAL_REMINDER_STATE: ReminderState = {
  visible: false, canPrompt: false, busy: false, instructions: false, ios: false,
};

interface Clock {
  now(): number;
  setTimeout(callback: () => void, delay: number): number;
  clearTimeout(id: number): void;
}

/** Timers and browser events live outside React so cooldowns are testable. */
export class InstallReminderController {
  private state: ReminderState = { ...INITIAL_REMINDER_STATE };
  private timer: number | null = null;
  private pendingPrompt: InstallPromptEvent | null = null;
  private running = false;
  private installed = false;
  private suppressed = false;
  private nextEligible: number;
  private media: MediaQueryList;
  private clock: Clock;
  private browser: Window;
  private notify: (state: ReminderState) => void;

  constructor(
    browser: Window,
    notify: (state: ReminderState) => void,
    clock?: Clock,
  ) {
    this.browser = browser;
    this.notify = notify;
    this.clock = clock ?? {
      now: () => Date.now(),
      setTimeout: (callback, delay) => browser.setTimeout(callback, delay),
      clearTimeout: (id) => browser.clearTimeout(id),
    };
    this.media = browser.matchMedia("(display-mode: standalone)");
    this.nextEligible = Math.max(this.clock.now() + FIRST_REMINDER_MS, this.readNext());
    this.state.ios = /iPhone|iPad|iPod/.test(browser.navigator.userAgent) ||
      (browser.navigator.platform === "MacIntel" && browser.navigator.maxTouchPoints > 1);
  }

  getSnapshot(): ReminderState { return this.state; }

  start(): () => void {
    this.running = true;
    this.browser.addEventListener("beforeinstallprompt", this.onPrompt);
    this.browser.addEventListener("appinstalled", this.onInstalled);
    this.browser.addEventListener("storage", this.onStorage);
    this.browser.addEventListener("focus", this.evaluate);
    this.browser.document.addEventListener("visibilitychange", this.evaluate);
    this.media.addEventListener("change", this.evaluate);
    this.evaluate();
    return () => {
      this.running = false;
      this.clearTimer();
      this.browser.removeEventListener("beforeinstallprompt", this.onPrompt);
      this.browser.removeEventListener("appinstalled", this.onInstalled);
      this.browser.removeEventListener("storage", this.onStorage);
      this.browser.removeEventListener("focus", this.evaluate);
      this.browser.document.removeEventListener("visibilitychange", this.evaluate);
      this.media.removeEventListener("change", this.evaluate);
      this.pendingPrompt = null;
    };
  }

  setSuppressed(suppressed: boolean): void {
    this.suppressed = suppressed;
    if (this.running) this.evaluate();
  }

  snooze = (): void => {
    this.nextEligible = this.clock.now() + REMINDER_SNOOZE_MS;
    this.write(NEXT_REMINDER_KEY, String(this.nextEligible));
    this.update({ visible: false, instructions: false });
    this.evaluate();
  };

  install = async (): Promise<void> => {
    if (!this.running || this.installed || this.state.busy) return;
    const event = this.pendingPrompt;
    if (!event) {
      this.update({ instructions: !this.state.instructions });
      return;
    }
    // A beforeinstallprompt event can be consumed only once, from this click.
    this.pendingPrompt = null;
    this.update({ canPrompt: false, busy: true });
    try {
      await event.prompt();
      await event.userChoice;
      if (this.running && !this.installed) this.snooze();
    } catch {
      if (this.running && !this.installed) this.update({ instructions: true });
    } finally {
      this.update({ busy: false });
    }
  };

  private onPrompt = (rawEvent: Event): void => {
    const event = rawEvent as InstallPromptEvent;
    if (this.installed || typeof event.prompt !== "function") return;
    event.preventDefault();
    this.pendingPrompt = event;
    this.update({ canPrompt: true });
    this.evaluate();
  };

  private onInstalled = (): void => {
    this.installed = true;
    this.pendingPrompt = null;
    this.clearTimer();
    this.write(INSTALL_KEY, "yes");
    this.update({ visible: false, instructions: false, canPrompt: false, busy: false });
  };

  private onStorage = (): void => {
    this.nextEligible = Math.max(this.nextEligible, this.readNext());
    this.evaluate();
  };

  private evaluate = (): void => {
    this.clearTimer();
    if (!this.running) return;
    const iosStandalone = (this.browser.navigator as Navigator & { standalone?: boolean }).standalone;
    if (this.installed || this.media.matches || iosStandalone === true || this.read(INSTALL_KEY) === "yes") {
      this.onInstalled();
      return;
    }
    if (this.suppressed || this.browser.document.visibilityState === "hidden") {
      this.update({ visible: false });
      return;
    }
    const delay = this.nextEligible - this.clock.now();
    if (delay <= 0) {
      this.update({ visible: true });
    } else {
      this.update({ visible: false });
      this.timer = this.clock.setTimeout(this.evaluate, delay);
    }
  };

  private update(patch: Partial<ReminderState>): void {
    if (!this.running) return;
    this.state = { ...this.state, ...patch };
    this.notify(this.state);
  }

  private read(key: string): string | null {
    try { return this.browser.localStorage.getItem(key); } catch { return null; }
  }

  private write(key: string, value: string): void {
    try { this.browser.localStorage.setItem(key, value); } catch { /* Session-only fallback. */ }
  }

  private readNext(): number {
    const value = Number(this.read(NEXT_REMINDER_KEY));
    // Ignore corrupted/unreasonably distant deadlines rather than silencing reminders.
    return Number.isFinite(value) && value <= this.clock.now() + REMINDER_SNOOZE_MS
      ? Math.max(0, value) : 0;
  }

  private clearTimer(): void {
    if (this.timer !== null) this.clock.clearTimeout(this.timer);
    this.timer = null;
  }
}
