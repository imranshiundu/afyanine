"use client";

import { useState, type KeyboardEvent } from "react";
import { Icon } from "../Icon";
import { Logo } from "../Logo";
import { ThemeToggle } from "../chrome";
import { BRAND, LOGIN_COPY, type Role } from "../data";
import { TestWard } from "./TestWard";
import { stagger } from "../useMotion";
import { requestJson, sessionChanged } from "../account-live";

export function Login({ onEnter }: { onEnter: (role: Role, code?: string) => Promise<void> }) {
  const [role, setRole] = useState<Role>("mother");
  const [language, setLanguage] = useState<"EN" | "SW">("EN");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [signup, setSignup] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [shake, setShake] = useState(false);
  const [mode, setMode] = useState<"signin" | "testward">("signin");
  const t = LOGIN_COPY[language];

  const digits = phone.replace(/\s/g, "");
  const valid = digits.length >= 9;
  const ready = email.includes("@") && password.length >= (signup ? 10 : 1) && (!signup || (valid && name.trim().length >= 2)) && !busy;

  const changeTab = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
    event.preventDefault();
    const next = event.key === "Home" ? "signin" : event.key === "End" ? "testward" : mode === "signin" ? "testward" : "signin";
    setMode(next);
    document.getElementById(`login-tab-${next}`)?.focus();
  };

  const submit = async () => {
    if (!ready) {
      setShake(true);
      window.setTimeout(() => setShake(false), 500);
      return;
    }
    setBusy(true); setError("");
    try {
      await requestJson("/api/account", "POST", { mode: signup ? "signup" : "signin", email, password, ...(signup ? { name, phone: digits.startsWith("0") ? digits : `+254${digits}`, role: role === "chw" ? "CHW" : "MOTHER" } : {}) });
      sessionChanged();
    } catch (e) { setError((e as Error).message); }
    finally { setBusy(false); }
  };

  return (
    <main className={`screen login-screen${mode === "testward" ? " ward-mode" : ""}`}>
      {/* Ambient art — soft lime shapes drifting behind the content */}
      <div className="login-art" aria-hidden="true">
        <span className="blob blob-a" />
        <span className="blob blob-b" />
        <span className="dotty" />
        <Icon name="sparkles" className="floaty floaty-1" size={18} />
        <Icon name="heart" className="floaty floaty-2" size={15} />
      </div>

      <div className="login-top stagger">
        <div className="login-top-row" style={stagger(0)}>
          <Logo />
          <div className="login-top-actions">
            <ThemeToggle className="theme-toggle" />
            <div className="language-toggle" role="group" aria-label="Language">
            {(["EN", "SW"] as const).map((l) => (
              <button
                key={l}
                type="button"
                onClick={() => setLanguage(l)}
                className={language === l ? "active" : ""}
                aria-pressed={language === l}
              >
                {l}
              </button>
            ))}
            <span
              className="lang-thumb"
              aria-hidden="true"
              data-pos={language === "EN" ? 0 : 1}
            />
            </div>
          </div>
        </div>
        <p className="brand-tagline" style={stagger(1)}>
          {BRAND.tagline}
        </p>
        <div className="mode-tabs" role="tablist" aria-label="Sign-in options">
          {(["signin", "testward"] as const).map((tab) => (
            <button
              key={tab}
              id={`login-tab-${tab}`}
              type="button"
              role="tab"
              aria-selected={mode === tab}
              aria-controls={`login-panel-${tab}`}
              tabIndex={mode === tab ? 0 : -1}
              className={mode === tab ? "active" : ""}
              onClick={() => setMode(tab)}
              onKeyDown={changeTab}
            >
              <Icon name={tab === "signin" ? "user" : "people"} size={16} />
              {tab === "signin" ? t.tabSignIn : t.tabTest}
            </button>
          ))}
          <span className="mode-thumb" aria-hidden="true" data-pos={mode === "signin" ? 0 : 1} />
        </div>
        {mode === "signin" && (
          <>
            <p className="eyebrow" style={stagger(2)}>
              {t.eyebrow}
            </p>
            <h1 style={stagger(3)}>{t.welcome}</h1>
            <p className="lead" style={stagger(4)}>
              {t.lead}
            </p>
          </>
        )}
      </div>

      <section
        id="login-panel-testward"
        role="tabpanel"
        aria-labelledby="login-tab-testward"
        hidden={mode !== "testward"}
      >
        {mode === "testward" && <TestWard language={language} onEnter={onEnter} />}
      </section>
      <section
        className="stagger"
        id="login-panel-signin"
        role="tabpanel"
        aria-labelledby="login-tab-signin"
        hidden={mode !== "signin"}
      >
        <label className="field-label" id="role-label" style={stagger(5)}>
          {t.signInAs}
        </label>
        <div className="role-grid" role="radiogroup" aria-labelledby="role-label" style={stagger(6)}>
          <button
            type="button"
            role="radio"
            aria-checked={role === "mother"}
            className={`role-card${role === "mother" ? " selected" : ""}`}
            onClick={() => setRole("mother")}
          >
            <span className="role-icon">
              <Icon name="mother" size={28} />
            </span>
            <span className="role-copy">
              <b>{t.mother}</b>
              <small>{t.motherSub}</small>
            </span>
            {role === "mother" && (
              <i aria-hidden="true">
                <Icon name="check" size={15} strokeWidth={3} />
              </i>
            )}
          </button>
          <button
            type="button"
            role="radio"
            aria-checked={role === "chw"}
            className={`role-card${role === "chw" ? " selected" : ""}`}
            onClick={() => setRole("chw")}
          >
            <span className="role-icon">
              <Icon name="people" size={28} />
            </span>
            <span className="role-copy">
              <b>{t.chw}</b>
              <small>{t.chwSub}</small>
            </span>
            {role === "chw" && (
              <i aria-hidden="true">
                <Icon name="check" size={15} strokeWidth={3} />
              </i>
            )}
          </button>
        </div>

        {signup && <><label className="field-label" htmlFor="account-name">Full name</label><div className="phone-field"><input id="account-name" autoComplete="name" value={name} onChange={e => setName(e.target.value)} required maxLength={80} /></div></>}
        <label className="field-label" htmlFor="account-email">Email</label>
        <div className="phone-field"><input id="account-email" type="email" autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} required /></div>
        <label className="field-label" htmlFor="account-password">Password</label>
        <div className="phone-field"><input id="account-password" type="password" autoComplete={signup ? "new-password" : "current-password"} value={password} onChange={e => setPassword(e.target.value)} required minLength={signup ? 10 : 1} onKeyDown={e => { if (e.key === "Enter") void submit(); }} /></div>
        {signup && <><label className="field-label" htmlFor="phone" style={stagger(8)}>
          {t.phone}
        </label>
        <div
          className={`phone-field${shake ? " shake" : ""}${digits && !valid ? " invalid" : ""}`}
          style={stagger(9)}
        >
          <span>+254</span>
          <input
            id="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^\d\s]/g, "").slice(0, 11))}
            placeholder="712 345 678"
          />
          {valid && (
            <span className="field-ok" aria-hidden="true">
              <Icon name="check" size={15} strokeWidth={3} />
            </span>
          )}
        </div>
        </>}
        <p className="phone-hint">{signup ? "Use at least 10 characters. No PIN or OTP is required. Email ownership is not yet verified." : "Sign in with your email and password."}</p>
        {error && <p role="alert" className="red-text">{error}</p>}
        <button
          type="button"
          className={`primary-button${ready ? "" : " disabled"}`}
          style={stagger(11)}
          onClick={submit}
          disabled={!ready}
        >
          {busy ? "Please wait…" : signup ? "Create account" : "Sign in"} <Icon name="arrow" />
        </button>
        <button type="button" className="account-switch" onClick={() => { setSignup(!signup); setError(""); }}>{signup ? "Already registered? Sign in" : "Create an account"}</button>
        <p className="privacy" style={stagger(12)}>
          {t.privacy}
        </p>
      </section>
    </main>
  );
}
