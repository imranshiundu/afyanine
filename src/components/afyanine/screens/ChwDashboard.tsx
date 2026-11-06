"use client";

import { useRef, useState } from "react";
import { Icon } from "../Icon";
import { CHW, PATIENTS, type Patient, type Screen } from "../data";

function riskClass(risk: Patient["risk"]) {
  if (risk === "High Risk") return "high";
  if (risk === "Watch") return "watch";
  return "";
}

export function ChwDashboard({
  navigate,
  notify,
  onLogout,
}: {
  navigate: (s: Screen) => void;
  notify: (msg: string) => void;
  onLogout: () => void;
}) {
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);
  const filtered = PATIENTS.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));

  return (
    <main className="screen chw-screen">
      <div className="chw-head">
        <div>
          <p>{CHW.date}</p>
          <h1>
            Good morning,
            <br />
            {CHW.firstName}
          </h1>
        </div>
        <button type="button" className="notification" aria-label="Notifications, 1 unread">
          <Icon name="bell" />
          <i />
        </button>
      </div>

      <button type="button" className="alert-banner" onClick={() => navigate("tracking")}>
        <span className="alert-icon">
          <Icon name="ambulance" size={25} stroke="#FFFFFF" />
        </span>
        <span className="alert-copy">
          <small>{CHW.emergency.label}</small>
          <b>{CHW.emergency.who}</b>
          <p>
            <Icon name="pin" size={14} /> {CHW.emergency.where}
          </p>
        </span>
        <Icon name="chevron" stroke="#FFFFFF" />
      </button>

      <div className="stats-row" aria-label="Practice summary">
        <div>
          <b>{CHW.stats.patients}</b>
          <span>Patients</span>
        </div>
        <div>
          <b className="red-text">{CHW.stats.attention}</b>
          <span>Need attention</span>
        </div>
        <div>
          <b>{CHW.stats.visits}</b>
          <span>Visits today</span>
        </div>
      </div>

      <div className="section-title patients-title">
        <h2>My patients</h2>
        <button type="button">View all</button>
      </div>

      <div className="search-box">
        <Icon name="search" size={18} />
        <input
          ref={searchRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search patients"
          aria-label="Search patients"
        />
        <button type="button" aria-label="Filter list">
          <Icon name="sliders" size={18} />
        </button>
      </div>

      <div className="patient-list">
        {filtered.map((p) => (
          <button className="patient-row" key={p.id} type="button" onClick={() => navigate("patient")}>
            <span className="patient-avatar" style={{ background: p.color }} aria-hidden="true">
              {p.initials}
            </span>
            <span className="patient-info">
              <h3>{p.name}</h3>
              <p>
                {p.week} <i /> BP <b className={p.risk === "High Risk" ? "red-text" : ""}>{p.bp}</b>
              </p>
            </span>
            <span className={`risk ${riskClass(p.risk)}`}>{p.risk}</span>
            <Icon name="chevron" size={17} />
          </button>
        ))}
        {filtered.length === 0 && (
          <p className="tracking-note" style={{ textAlign: "left", padding: "12px 2px" }}>
            No patients match “{query}”.
          </p>
        )}
      </div>

      <nav className="chw-nav" aria-label="CHW navigation">
        <button type="button" className="active" aria-current="page">
          <Icon name="home" />
          <span>Dashboard</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setQuery("");
            searchRef.current?.focus();
          }}
        >
          <Icon name="people" />
          <span>Patients</span>
        </button>
        <button
          type="button"
          className="add-patient"
          aria-label="Add patient"
          onClick={() => searchRef.current?.focus()}
        >
          <Icon name="plus" strokeWidth={2.5} />
        </button>
        <button type="button" onClick={() => notify(`${CHW.stats.visits} visits scheduled today`)}>
          <Icon name="calendar" />
          <span>Visits</span>
        </button>
        <button type="button" onClick={onLogout}>
          <Icon name="user" />
          <span>Profile</span>
        </button>
      </nav>
    </main>
  );
}
