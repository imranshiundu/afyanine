"use client";

import { useEffect, useState } from "react";
import { Icon } from "../Icon";
import { Logo } from "../Logo";
import { ThemeToggle } from "../chrome";
import { BRAND, LOGIN_COPY, type Role } from "../data";
import { api, type MotherAccount } from "../api";
import { stagger } from "../useMotion";

export function Login({ onEnter }: { onEnter: (role: Role, code?: string) => void }) {
  const [role, setRole] = useState<Role>("mother");
  const [language, setLanguage] = useState<"EN" | "SW">("EN");
  const [phone, setPhone] = useState("");
  const [account, setAccount] = useState<string>("MW-1048");
  const [mothers, setMothers] = useState<MotherAccount[] | null>(null);
  const [shake, setShake] = useState(false);
  const t = LOGIN_COPY[language];

  /* Live test-ward accounts for the mother switcher (falls back silently) */
  useEffect(() => {
    api.mothers().then((res) => {
      if (res?.mothers?.length) setMothers(res.mothers);
    });
  }, []);

  const digits = phone.replace(/\s/g, "");
  const valid = digits.length >= 9;

  const submit = () => {
    if (!valid) {
      setShake(true);
      window.setTimeout(() => setShake(false), 500);
      return;
    }
    onEnter(role, role === "mother" ? account : undefined);
  };

  return (
    <main className="screen login-screen">
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
        <p className="eyebrow" style={stagger(2)}>
          {t.eyebrow}
        </p>
        <h1 style={stagger(3)}>{t.welcome}</h1>
        <p className="lead" style={stagger(4)}>
          {t.lead}
        </p>
      </div>

      <section className="stagger">
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

        {role === "mother" && mothers && (
          <div className="acct-field" style={stagger(7)}>
            <label className="field-label">Test ward · account</label>
            <div className="acct-row" role="listbox" aria-label="Test mother accounts">
              {mothers.map((m) => (
                <button
                  key={m.code}
                  type="button"
                  role="option"
                  aria-selected={account === m.code}
                  className={`acct-chip${account === m.code ? " selected" : ""}`}
                  onClick={() => setAccount(m.code)}
                  title={`${m.fullName} · ${m.week} weeks · ${m.risk}`}
                >
                  <span className="acct-dot" style={{ background: m.color }} aria-hidden="true">
                    {m.initials}
                  </span>
                  <span className="acct-copy">
                    <b>{m.firstName}</b>
                    <small>
                      {m.code} · {m.risk}
                    </small>
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}
        <label className="field-label" htmlFor="phone" style={stagger(8)}>
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
        <p className="phone-hint" style={stagger(10)}>
          {valid ? t.otpSent(digits) : t.phoneHint}
        </p>

        <button
          type="button"
          className={`primary-button${valid ? "" : " disabled"}`}
          style={stagger(11)}
          onClick={submit}
          disabled={!valid}
        >
          {t.cta} <Icon name="arrow" />
        </button>
        <p className="privacy" style={stagger(12)}>
          {t.privacy}
        </p>
      </section>
    </main>
  );
}
