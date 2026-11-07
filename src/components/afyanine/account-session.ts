import type { Role } from "./data";

export const DEMO_SESSION_KEY = "afyanine:demo-session:v1";
const EVENT = "afyanine:demo-session-change";
export interface DemoSession { role: Role; code: string }
export function parseDemoSession(raw: string | null): DemoSession | null {
  try {
    const value = JSON.parse(raw ?? "null");
    return value && (value.role === "mother" || value.role === "chw") &&
      /^MW-\d{4}$/.test(value.code) ? { role: value.role, code: value.code } : null;
  } catch { return null; }
}
let memory: string | null = null;
export function readDemoSession(): string | null {
  try { return window.sessionStorage.getItem(DEMO_SESSION_KEY) ?? memory; } catch { return memory; }
}
export const emptyDemoSession = () => null;
export function writeDemoSession(value: DemoSession | null): void {
  memory = value ? JSON.stringify(value) : null;
  try {
    if (memory) window.sessionStorage.setItem(DEMO_SESSION_KEY, memory);
    else window.sessionStorage.removeItem(DEMO_SESSION_KEY);
  } catch { /* A blocked store keeps the current tab usable. */ }
  window.dispatchEvent(new Event(EVENT));
}
export function subscribeDemoSession(listener: () => void) {
  window.addEventListener(EVENT, listener);
  window.addEventListener("storage", listener);
  return () => {
    window.removeEventListener(EVENT, listener);
    window.removeEventListener("storage", listener);
  };
}
