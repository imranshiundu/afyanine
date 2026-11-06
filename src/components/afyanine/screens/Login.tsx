"use client";

import { useState } from "react";
import { Icon } from "../Icon";
import { Logo } from "../Logo";
import { BRAND, LOGIN_COPY, type Role } from "../data";

export function Login({ onEnter }: { onEnter: (role: Role) => void }) {
  const [role, setRole] = useState<Role>("mother");
  const [language, setLanguage] = useState<"EN" | "SW">("EN");
  const [phone, setPhone] = useState("");
  const t = LOGIN_COPY[language];

  return (
    <main className="screen login-screen">
      <div className="login-top">
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
        </div>
        <Logo />
        <p className="brand-tagline">{BRAND.tagline}</p>
        <p className="eyebrow">{t.eyebrow}</p>
        <h1>{t.welcome}</h1>
        <p className="lead">{t.lead}</p>
      </div>

      <section>
        <label className="field-label" id="role-label">
          {t.signInAs}
        </label>
        <div className="role-grid" role="radiogroup" aria-labelledby="role-label">
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

        <label className="field-label" htmlFor="phone">
          {t.phone}
        </label>
        <div className="phone-field">
          <span>+254</span>
          <input
            id="phone"
            type="tel"
            inputMode="numeric"
            autoComplete="tel-national"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^\d\s]/g, ""))}
            placeholder="712 345 678"
          />
        </div>

        <button type="button" className="primary-button" onClick={() => onEnter(role)}>
          {t.cta} <Icon name="arrow" />
        </button>
        <p className="privacy">{t.privacy}</p>
      </section>
    </main>
  );
}
