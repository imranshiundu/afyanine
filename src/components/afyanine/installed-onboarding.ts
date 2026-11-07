export const ONBOARDING_KEY = "afyanine:onboarding:v1";
const COMPLETE_EVENT = "afyanine:onboarding-complete";
let completedThisSession = false;

export function getInstalledOnboardingSnapshot(): boolean {
  if (typeof window === "undefined" || completedThisSession) return false;
  const installed = window.matchMedia("(display-mode: standalone)").matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true;
  if (!installed) return false;
  try {
    return window.localStorage.getItem(ONBOARDING_KEY) !== "done";
  } catch {
    return true;
  }
}

export function getOnboardingServerSnapshot(): boolean {
  return false;
}

export function subscribeInstalledOnboarding(listener: () => void): () => void {
  const media = window.matchMedia("(display-mode: standalone)");
  media.addEventListener("change", listener);
  window.addEventListener("storage", listener);
  window.addEventListener(COMPLETE_EVENT, listener);
  return () => {
    media.removeEventListener("change", listener);
    window.removeEventListener("storage", listener);
    window.removeEventListener(COMPLETE_EVENT, listener);
  };
}

export function completeInstalledOnboarding(): void {
  completedThisSession = true;
  try {
    window.localStorage.setItem(ONBOARDING_KEY, "done");
  } catch {
    // Keep the current session usable when browser storage is blocked.
  }
  window.dispatchEvent(new Event(COMPLETE_EVENT));
}
