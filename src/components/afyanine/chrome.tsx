"use client";

import { useCallback, useSyncExternalStore, type ReactNode } from "react";
import { Icon } from "./Icon";
import {
  getThemeServerSnapshot,
  getThemeSnapshot,
  setTheme,
  subscribeTheme,
} from "./theme";
import type { Screen } from "./data";
import { useLanguage } from "./language";

/* ------------------------------------------------------------------ */
/* Theme toggle — flips the token sheet on <html> and persists it      */
/* ------------------------------------------------------------------ */

export function ThemeToggle({ className = "icon-button" }: { className?: string }) {
  const { t } = useLanguage();
  const dark = useSyncExternalStore(
    subscribeTheme,
    getThemeSnapshot,
    getThemeServerSnapshot,
  ) === "dark";

  const toggle = useCallback(() => {
    const root = document.documentElement;
    setTheme(getThemeSnapshot() === "dark" ? "light" : "dark");
    root.classList.remove("theme-pop");
    /* retrigger the switch animation */
    void root.offsetWidth;
    root.classList.add("theme-pop");
  }, []);

  return (
    <button
      type="button"
      className={className}
      onClick={toggle}
      aria-label={t(dark ? "Switch to light mode" : "Switch to dark mode")}
      aria-pressed={dark}
    >
      <Icon name={dark ? "sun" : "moon"} size={20} />
    </button>
  );
}

export function Header({
  title,
  onBack,
  dark = false,
  action,
}: {
  title: string;
  onBack?: () => void;
  dark?: boolean;
  action?: ReactNode;
}) {
  const { t } = useLanguage();
  return (
    <header className={`screen-header${dark ? " dark" : ""}`}>
      {onBack ? (
        <button type="button" className="icon-button" onClick={onBack} aria-label={t("Go back")}>
          <Icon name="back" />
        </button>
      ) : (
        <span className="header-spacer" />
      )}
      <h2>{t(title)}</h2>
      {action ?? <span className="header-spacer" />}
    </header>
  );
}

/* ------------------------------------------------------------------ */
/* Mother bottom navigation — centre SOS                               */
/* ------------------------------------------------------------------ */

export function BottomNav({
  active,
  navigate,
  onProfile,
  chw = false,
}: {
  active: Screen;
  navigate: (s: Screen) => void;
  onProfile: () => void;
  chw?: boolean;
}) {
  const { t } = useLanguage();
  if (chw) return <nav className="bottom-nav chw-profile-nav" aria-label="CHW">
    <button type="button" onClick={() => navigate("chw")}><Icon name="home" /><span>{t("Dashboard")}</span></button>
    <button type="button" className={active === "care" ? "active" : ""} onClick={() => navigate("care")} aria-current={active === "care" ? "page" : undefined}><Icon name="pin" /><span>{t("Care")}</span></button>
    <button type="button" className={active === "profile" ? "active" : ""} onClick={onProfile} aria-current={active === "profile" ? "page" : undefined}><Icon name="user" /><span>{t("Profile")}</span></button>
  </nav>;
  return (
    <nav className="bottom-nav" aria-label="Primary">
      <button
        type="button"
        className={active === "home" ? "active" : ""}
        onClick={() => navigate("home")}
        aria-current={active === "home" ? "page" : undefined}
      >
        <Icon name="home" />
        <span>{t("Home")}</span>
      </button>
      <button
        type="button"
        className={active === "care" ? "active" : ""}
        onClick={() => navigate("care")}
        aria-current={active === "care" ? "page" : undefined}
      >
        <Icon name="pin" />
        <span>{t("Care")}</span>
      </button>
      <button type="button" className="sos-nav" onClick={() => navigate("sos")} aria-label={t("Emergency SOS")}>
        <span>SOS</span>
      </button>
      <button
        type="button"
        className={active === "vitals" ? "active" : ""}
        onClick={() => navigate("vitals")}
        aria-current={active === "vitals" ? "page" : undefined}
      >
        <Icon name="activity" />
        <span>{t("Vitals")}</span>
      </button>
      <button type="button" className={active === "profile" ? "active" : ""} aria-current={active === "profile" ? "page" : undefined} onClick={onProfile}>
        <Icon name="user" />
        <span>{t("Profile")}</span>
      </button>
    </nav>
  );
}
