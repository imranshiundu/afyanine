/**
 * Theme store — the DOM's data-theme attribute as an external store,
 * so components can read/observe it without setState-in-effect.
 */

type Theme = "light" | "dark";

const listeners = new Set<() => void>();
let cached: Theme | null = null;

function readDom(): Theme {
  return document.documentElement.dataset.theme === "dark" ? "dark" : "light";
}

export function subscribeTheme(onChange: () => void) {
  listeners.add(onChange);
  /* Observe the attribute so toggles from anywhere update every consumer */
  const observer = new MutationObserver(() => {
    cached = null;
    onChange();
  });
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ["data-theme"],
  });
  return () => {
    listeners.delete(onChange);
    observer.disconnect();
  };
}

export function getThemeSnapshot(): Theme {
  if (cached === null) cached = readDom();
  return cached;
}

export const getThemeServerSnapshot = (): Theme => "light";

export function setTheme(next: Theme) {
  cached = next;
  document.documentElement.dataset.theme = next;
  try {
    localStorage.setItem("afyanine-theme", next);
  } catch {
    /* private mode — theme just won't persist */
  }
  const meta = document.querySelector('meta[name="theme-color"]');
  if (meta) meta.setAttribute("content", next === "dark" ? "#161613" : "#FAFAF7");
}
