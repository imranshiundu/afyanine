export type EntryRole = "MOTHER" | "CHW";
const KEY = "afyanine:entry-role";
export function rememberEntryRole(role: "mother" | "chw") {
  try { window.sessionStorage.setItem(KEY, role === "chw" ? "CHW" : "MOTHER"); } catch { /* optional hint only */ }
}
export function initialEntryRole(metadata?: Record<string, unknown>): EntryRole {
  // A hint for first profile creation, never a privilege or stored-role override.
  if (metadata?.afyanine_role === "CHW" || metadata?.afyanine_role === "MOTHER") return metadata.afyanine_role;
  try { return window.sessionStorage.getItem(KEY) === "CHW" ? "CHW" : "MOTHER"; } catch { return "MOTHER"; }
}
