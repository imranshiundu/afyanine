"use client";

import type { ReactNode } from "react";
import { Icon } from "./Icon";
import type { Screen } from "./data";

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
  return (
    <header className={`screen-header${dark ? " dark" : ""}`}>
      {onBack ? (
        <button type="button" className="icon-button" onClick={onBack} aria-label="Go back">
          <Icon name="back" />
        </button>
      ) : (
        <span className="header-spacer" />
      )}
      <h2>{title}</h2>
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
}: {
  active: Screen;
  navigate: (s: Screen) => void;
  onProfile: () => void;
}) {
  const items: Array<{ key: Screen; icon: "home" | "pin" | "activity" | "user"; label: string }> = [
    { key: "home", icon: "home", label: "Home" },
    { key: "care", icon: "pin", label: "Care" },
    { key: "vitals", icon: "activity", label: "Vitals" },
    { key: "login", icon: "user", label: "Profile" },
  ];
  return (
    <nav className="bottom-nav" aria-label="Primary">
      <button
        type="button"
        className={active === "home" ? "active" : ""}
        onClick={() => navigate("home")}
        aria-current={active === "home" ? "page" : undefined}
      >
        <Icon name="home" />
        <span>Home</span>
      </button>
      <button
        type="button"
        className={active === "care" ? "active" : ""}
        onClick={() => navigate("care")}
        aria-current={active === "care" ? "page" : undefined}
      >
        <Icon name="pin" />
        <span>Care</span>
      </button>
      <button type="button" className="sos-nav" onClick={() => navigate("sos")} aria-label="Emergency SOS">
        <span>SOS</span>
      </button>
      <button
        type="button"
        className={active === "vitals" ? "active" : ""}
        onClick={() => navigate("vitals")}
        aria-current={active === "vitals" ? "page" : undefined}
      >
        <Icon name="activity" />
        <span>Vitals</span>
      </button>
      <button type="button" onClick={onProfile}>
        <Icon name="user" />
        <span>Profile</span>
      </button>
    </nav>
  );
}
