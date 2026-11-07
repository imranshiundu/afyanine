"use client";

import { useState, type KeyboardEvent } from "react";
import { Icon } from "../Icon";
import { Logo } from "../Logo";
import { ThemeToggle } from "../chrome";
import { BRAND, LOGIN_COPY, type Role } from "../data";
import { TestWard } from "./TestWard";
import { AccountForm } from "../AccountForm";
import { useLanguage } from "../language";
import Link from "next/link";

export function Login({ onEnter }: { onEnter: (role: Role, code?: string) => Promise<void> }) {
  const { language, setLanguage, t: tr } = useLanguage();
  const [mode, setMode] = useState<"signin" | "testward">("signin");
  const t = LOGIN_COPY[language];
  const changeTab = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === "Home" ? "signin" : event.key === "End" ? "testward" : mode === "signin" ? "testward" : "signin";
    setMode(next);
    document.getElementById(`login-tab-${next}`)?.focus();
  };
  return (
    <main className={`screen login-screen${mode === "testward" ? " ward-mode" : ""}`}>
      <div className="login-art" aria-hidden="true"><span className="blob blob-a" /><span className="blob blob-b" /><span className="dotty" /></div>
      <div className="login-top">
        <div className="login-top-row">
          <Logo />
          <div className="login-top-actions">
            <ThemeToggle className="theme-toggle" />
            <div className="language-toggle" role="group" aria-label="Language">
              {(["EN", "SW"] as const).map(l => <button key={l} type="button" onClick={() => setLanguage(l)} className={language === l ? "active" : ""} aria-pressed={language === l}>{l}</button>)}
              <span className="lang-thumb" aria-hidden="true" data-pos={language === "EN" ? 0 : 1} />
            </div>
          </div>
        </div>
        <p className="brand-tagline">{BRAND.tagline}</p>
        <div className="mode-tabs" role="tablist" aria-label="Sign-in options">
          {(["signin", "testward"] as const).map(tab => <button key={tab} id={`login-tab-${tab}`} type="button" role="tab" aria-selected={mode === tab} aria-controls={`login-panel-${tab}`} tabIndex={mode === tab ? 0 : -1} className={mode === tab ? "active" : ""} onClick={() => setMode(tab)} onKeyDown={changeTab}><Icon name={tab === "signin" ? "user" : "people"} size={16} />{tab === "signin" ? t.tabSignIn : t.tabTest}</button>)}
          <span className="mode-thumb" aria-hidden="true" data-pos={mode === "signin" ? 0 : 1} />
        </div>
        {mode === "signin" && <><p className="eyebrow">{t.eyebrow}</p><h1>{t.welcome}</h1><p className="lead">{t.lead}</p></>}
      </div>
      <section id="login-panel-testward" role="tabpanel" aria-labelledby="login-tab-testward" hidden={mode !== "testward"}>
        {mode === "testward" && <Link href="/care-team-demo" className="primary-button">{tr("Open care-team demo")}<Icon name="people" /></Link>}
        {mode === "testward" && <><TestWard language={language} onEnter={onEnter} /><Link className="secondary-button" href="/care-team-demo?actor=chw">{tr("Open fictional CHW dashboard")}</Link></>}
      </section>
      <section id="login-panel-signin" role="tabpanel" aria-labelledby="login-tab-signin" hidden={mode !== "signin"}>
        <AccountForm language={language} />
      </section>
    </main>
  );
}
