"use client";

import { useState } from "react";
import { Icon } from "../Icon";
import { Logo } from "../Logo";
import { ThemeToggle } from "../chrome";
import { BRAND, LOGIN_COPY, type Role } from "../data";
import { AccountForm } from "../AccountForm";
import { useLanguage } from "../language";
import { rememberEntryRole } from "../entry-role";

export function Login() {
  const { language, setLanguage } = useLanguage();
  const [role, setRole] = useState<Role | null>(null);
  const copy = LOGIN_COPY[language];
  return <main className="screen login-screen account-entry-screen">
    <div className="login-art" aria-hidden="true"><span className="blob blob-a" /><span className="blob blob-b" /><span className="dotty" /></div>
    <div className="login-top">
      <div className="login-top-row"><Logo /><div className="login-top-actions">
        <ThemeToggle className="theme-toggle" />
        <div className="language-toggle" role="group" aria-label="Language">
          {(["EN", "SW"] as const).map(value => <button key={value} type="button" onClick={() => setLanguage(value)} className={language === value ? "active" : ""} aria-pressed={language === value}>{value}</button>)}
          <span className="lang-thumb" aria-hidden="true" data-pos={language === "EN" ? 0 : 1} />
        </div>
      </div></div>
      <p className="brand-tagline">{BRAND.tagline}</p>
      <p className="eyebrow">{copy.eyebrow}</p>
      <h1>{language === "SW" ? "Karibu AfyaNine." : "Welcome to AfyaNine."}</h1>
      <p className="lead">{copy.lead}</p>
    </div>
    {!role ? <section className="entry-role-section" aria-label={copy.signInAs}>
      <h2>{language === "SW" ? "Chagua aina ya akaunti" : "Choose your account type"}</h2>
      <div className="role-grid">{(["mother", "chw"] as const).map(value => <button key={value} type="button" className="role-card" onClick={() => { rememberEntryRole(value); setRole(value); }}>
        <span className="role-icon"><Icon name={value === "mother" ? "heart" : "people"} size={28} /></span>
        <span className="role-copy"><b>{copy[value]}</b><small>{value === "mother" ? copy.motherSub : copy.chwSub}</small></span>
      </button>)}</div>
    </section> : <section className="entry-auth-section">
      <button className="entry-back" type="button" onClick={() => setRole(null)}><Icon name="back" size={18} />{language === "SW" ? "Badilisha aina ya akaunti" : "Change account type"}</button>
      <p className="eyebrow entry-role-label">{copy[role]}</p>
      <AccountForm key={role} language={language} role={role} />
    </section>}
  </main>;
}
