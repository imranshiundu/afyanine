"use client";

import { useRef, useState } from "react";
import { Icon } from "../Icon";
import { ThemeToggle } from "../chrome";
import { CHW, PATIENTS, type Patient, type Screen } from "../data";
import type { PatientsPayload } from "../api";
import { useCountUp, stagger } from "../useMotion";
import { useLanguage } from "../language";
import Link from "next/link";

function riskClass(risk: Patient["risk"]) {
  if (risk === "High Risk") return "high";
  if (risk === "Watch") return "watch";
  return "";
}

const TIME_OF_DAY = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning,";
  if (h < 17) return "Good afternoon,";
  return "Good evening,";
};

export function ChwDashboard({
  payload,
  navigate,
  openPatient,
  notify,
  onResolve,
  onLogout,
}: {
  payload: PatientsPayload | null;
  navigate: (s: Screen) => void;
  openPatient: (code: string) => void;
  notify: (msg: string) => void;
  onResolve: () => void;
  onLogout: () => void;
}) {
  const { t, locale } = useLanguage();
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  /* Live register from the API; bundled demo register ONLY when the API is down */
  const live = payload !== null;
  const list = live ? (payload?.patients ?? []) : PATIENTS;
  const chw = live ? (payload?.chw ?? CHW) : CHW;
  const emergency = live ? payload?.emergency ?? null : CHW.emergency;

  const filtered = list.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));

  const patients = useCountUp(chw.stats.patients, 900);
  const attention = useCountUp(chw.stats.attention, 900);
  const visits = useCountUp(chw.stats.visits, 900);

  return (
    <main className="screen chw-screen">
      <div className="chw-head stagger">
        <div style={stagger(0)}>
          <p>
            {new Date().toLocaleDateString(locale, { weekday: "long", day: "numeric", month: "long" }).toUpperCase()}
          </p>
          <h1>
            {t(TIME_OF_DAY())}
            <br />
            {chw.firstName}
          </h1>
        </div>
        <div className="head-actions">
          <ThemeToggle className="theme-toggle" />
          <button
            type="button"
            className="notification"
            aria-label={emergency ? "Notifications, 1 unread" : "Notifications"}
            onClick={() =>
              notify(emergency ? "1 active emergency · 2 new messages" : "2 new messages")
            }
            style={stagger(1)}
          >
            <Icon name="bell" />
            {emergency && <i />}
          </button>
        </div>
      </div>

      {emergency && (
        <div
          role="button"
          tabIndex={0}
          className="alert-banner"
          onClick={() => navigate("tracking")}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !(e.target as HTMLElement).closest(".alert-resolve")) {
              navigate("tracking");
            }
          }}
          style={stagger(2)}
        >
          <span className="alert-icon">
            <Icon name="ambulance" size={25} stroke="#FFFFFF" />
          </span>
          <span className="alert-copy">
            <small>
              <i className="alert-live" aria-hidden="true" /> {t("ACTIVE EMERGENCY")}
            </small>
            <b>{emergency.who}</b>
            <p>
              <Icon name="pin" size={14} /> {emergency.where}
            </p>
          </span>
          <button
            type="button"
            className="alert-resolve"
            aria-label="Mark SOS resolved"
            onClick={(e) => {
              e.stopPropagation();
              onResolve();
            }}
          >
            <Icon name="x" size={15} stroke="#FFFFFF" strokeWidth={3} />
          </button>
          <Icon name="chevron" stroke="#FFFFFF" size={17} />
        </div>
      )}

      <div className="stats-row" aria-label="Practice summary" style={stagger(3)}>
        <div>
          <b>{patients}</b>
          <span>{t("Patients")}</span>
        </div>
        <div>
          <b className="red-text">{attention}</b>
          <span>{t("Need attention")}</span>
        </div>
        <div>
          <b>{visits}</b>
          <span>{t("Visits today")}</span>
        </div>
      </div>

      <div className="section-title patients-title">
        <h2>{t("My patients")}</h2>
        <button type="button" onClick={() => notify(`Showing all ${chw.stats.patients} patients`)}>
          {t("View all")}
        </button>
      </div>

      <div className="search-box">
        <Icon name="search" size={18} />
        <input
          ref={searchRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("Search patients")}
          aria-label={t("Search patients")}
        />
        {query ? (
          <button type="button" aria-label="Clear search" onClick={() => setQuery("")}>
            <Icon name="x" size={16} />
          </button>
        ) : (
          <button type="button" aria-label="Filter list">
            <Icon name="sliders" size={18} />
          </button>
        )}
      </div>

      <div className="patient-list stagger" key={query}>
        {filtered.map((p, i) => (
          <button
            className="patient-row"
            key={p.id}
            type="button"
            style={stagger(Math.min(i, 8))}
            onClick={() => openPatient(p.id)}
          >
            <span className="patient-avatar" style={{ background: p.color }} aria-hidden="true">
              {p.initials}
            </span>
            <span className="patient-info">
              <h3>{p.name}</h3>
              <p>
                {p.week} <i /> BP{" "}
                <b className={p.risk === "High Risk" ? "red-text" : ""}>{p.bp}</b>
              </p>
            </span>
            <span className={`risk ${riskClass(p.risk)}`}>{t(p.risk)}</span>
            <Icon name="chevron" size={17} />
          </button>
        ))}
        {filtered.length === 0 && (
          <div className="empty-state" style={stagger(0)}>
            <span className="empty-art">
              <Icon name="search" size={26} />
            </span>
            <b>No patients match “{query}”</b>
            <p>{t("Check the spelling or search by clinic ID.")}</p>
          </div>
        )}
      </div>

      <nav className="chw-nav" aria-label="CHW navigation">
        <button type="button" className="active" aria-current="page">
          <Icon name="home" />
          <span>{t("Dashboard")}</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setQuery("");
            searchRef.current?.focus();
          }}
        >
          <Icon name="people" />
          <span>{t("Patients")}</span>
        </button>
        <button
          type="button"
          className="add-patient"
          aria-label="Add patient"
          onClick={() => searchRef.current?.focus()}
        >
          <Icon name="plus" strokeWidth={2.5} />
        </button>
        <Link href="/care-team-demo?actor=chw&tab=visits">
          <Icon name="calendar" />
          <span>{t("Visits")}</span>
        </Link>
        <button type="button" onClick={onLogout}>
          <Icon name="user" />
          <span>{t("Profile")}</span>
        </button>
      </nav>
    </main>
  );
}
