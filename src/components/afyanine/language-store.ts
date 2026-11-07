export type Language = "EN" | "SW";
export const LANGUAGE_KEY = "afyanine:language:v1";
const EVENT = "afyanine:language";
let memory: Language = "EN";
let chosen = false;
export function hasLanguagePreference() {
  try { const value = window.localStorage.getItem(LANGUAGE_KEY); return value === "EN" || value === "SW" || chosen; }
  catch { return chosen; }
}
export function languageSnapshot(): Language {
  try { const value = window.localStorage.getItem(LANGUAGE_KEY); return value === "SW" ? "SW" : value === "EN" ? "EN" : memory; }
  catch { return memory; }
}
export const languageServerSnapshot = (): Language => "EN";
export function setLanguage(language: Language) {
  memory = language; chosen = true;
  try { window.localStorage.setItem(LANGUAGE_KEY, language); } catch { /* Device preference still works in memory. */ }
  if (typeof document !== "undefined") document.documentElement.lang = language === "SW" ? "sw" : "en";
  if (typeof window !== "undefined") window.dispatchEvent(new Event(EVENT));
}
export function subscribeLanguage(listener: () => void) {
  const storage = (event: StorageEvent) => {
    if (event.key === LANGUAGE_KEY || event.key === null) { memory = event.newValue === "SW" ? "SW" : "EN"; chosen = event.newValue === "EN" || event.newValue === "SW"; listener(); }
  };
  window.addEventListener(EVENT, listener); window.addEventListener("storage", storage);
  return () => { window.removeEventListener(EVENT, listener); window.removeEventListener("storage", storage); };
}
