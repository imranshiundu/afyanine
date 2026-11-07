"use client";

import { useEffect, useState } from "react";
import { api, type MotherAccount } from "../api";
import { Icon } from "../Icon";
import type { Lang, Role } from "../data";

const COPY = {
  EN: {
    label: "DEMO ENVIRONMENT",
    heading: "Meet the test ward",
    intro: "Six different journeys. Choose a mother to explore her pregnancy, vitals and care.",
    notice: "Fictional accounts only. No real patient data.",
    accounts: "Choose a test account",
    hint: "Tap a card to open her experience.",
    loading: "Loading the test ward…",
    unavailable: "We couldn't load the test accounts.",
    retry: "Try again",
    empty: "No fictional accounts are available yet.",
    openError: "This account couldn't be opened. Please try again.",
    opening: "Opening",
    weeks: "weeks",
    open: "Open account",
    normal: "Normal",
    watch: "Watch",
    high: "High Risk",
  },
  SW: {
    label: "MAZINGIRA YA MAJARIBIO",
    heading: "Wodi ya majaribio",
    intro: "Safari sita tofauti. Chagua mama kuona ujauzito, vipimo na huduma zake.",
    notice: "Akaunti za kubuni tu. Hakuna taarifa halisi za wagonjwa.",
    accounts: "Chagua akaunti ya majaribio",
    hint: "Gusa kadi kufungua akaunti yake.",
    loading: "Inapakia akaunti za majaribio…",
    unavailable: "Hatukuweza kupakia akaunti za majaribio.",
    retry: "Jaribu tena",
    empty: "Hakuna akaunti za kubuni zinazopatikana bado.",
    openError: "Akaunti haikufunguka. Tafadhali jaribu tena.",
    opening: "Inafungua",
    weeks: "wiki",
    open: "Fungua akaunti",
    normal: "Kawaida",
    watch: "Uangalizi",
    high: "Hatari kubwa",
  },
} as const;

export function TestWard({
  language,
  onEnter,
}: {
  language: Lang;
  onEnter: (role: Role, code?: string) => Promise<void>;
}) {
  const t = COPY[language];
  const [mothers, setMothers] = useState<MotherAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [opening, setOpening] = useState<string | null>(null);
  const [entryError, setEntryError] = useState(false);

  useEffect(() => {
    let active = true;
    api.mothers().then((result) => {
      if (!active) return;
      setMothers(result?.mothers.filter((mother) => mother.simulated) ?? []);
      setFailed(!result);
      setLoading(false);
    });
    return () => { active = false; };
  }, [attempt]);

  const retry = () => {
    setLoading(true);
    setFailed(false);
    setAttempt((value) => value + 1);
  };

  const open = async (mother: MotherAccount) => {
    if (opening) return;
    setOpening(mother.code);
    setEntryError(false);
    try {
      await onEnter("mother", mother.code);
    } catch {
      setEntryError(true);
      setOpening(null);
    }
  };

  return (
    <div className="test-ward">
      <section className="ward-intro">
        <span className="ward-kicker"><Icon name="sparkles" size={14} /> {t.label}</span>
        <h1>{t.heading}</h1>
        <p>{t.intro}</p>
        <div className="ward-illustration" aria-hidden="true">
          <Icon name="mother" size={45} />
          <span><Icon name="heart" size={17} /></span>
          <i /><i />
        </div>
      </section>
      <p className="ward-notice"><Icon name="check" size={16} /> {t.notice}</p>
      <div className="ward-section-heading">
        <h2>{t.accounts}</h2>
        <p>{t.hint}</p>
      </div>
      {entryError && <p className="ward-error" role="alert">{t.openError}</p>}
      <div className="ward-accounts" aria-label={t.accounts} aria-busy={loading || !!opening}>
        {loading ? (
          <p className="ward-state" role="status">{t.loading}</p>
        ) : failed || mothers.length === 0 ? (
          <div className="ward-state">
            <Icon name="people" size={28} />
            <p role={failed ? "alert" : "status"}>{failed ? t.unavailable : t.empty}</p>
            <button type="button" className="ward-retry" onClick={retry}>{t.retry}</button>
          </div>
        ) : mothers.map((mother) => {
          const riskClass = mother.risk === "High Risk" ? "high" : mother.risk === "Watch" ? "watch" : "normal";
          const riskLabel = riskClass === "high" ? t.high : riskClass === "watch" ? t.watch : t.normal;
          return (
            <button
              type="button"
              key={mother.code}
              className="ward-account"
              disabled={!!opening}
              aria-label={`${t.open}: ${mother.fullName}, ${mother.code}`}
              onClick={() => void open(mother)}
            >
              <span className="ward-avatar" style={{ background: mother.color }} aria-hidden="true">{mother.initials}</span>
              <span className="ward-account-copy">
                <b>{mother.fullName}</b>
                <span>{mother.code} <i aria-hidden="true">·</i> {mother.week} {t.weeks}</span>
                <small className={`ward-risk ${riskClass}`}><i />{riskLabel}</small>
              </span>
              <span className="ward-open" aria-hidden="true">
                {opening === mother.code ? <span className="ward-spinner" /> : <Icon name="arrow" size={18} />}
              </span>
            </button>
          );
        })}
      </div>
      {opening && <p className="ward-opening" role="status">{t.opening} {mothers.find((mother) => mother.code === opening)?.firstName}…</p>}
    </div>
  );
}
