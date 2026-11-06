"use client";

import { useState } from "react";
import { Icon } from "../Icon";
import { BottomNav, Header } from "../chrome";
import { CARE_TABS, FACILITIES, type CareTab, type Screen } from "../data";

export function FindCare({
  navigate,
  notify,
  onProfile,
}: {
  navigate: (s: Screen) => void;
  notify: (msg: string) => void;
  onProfile: () => void;
}) {
  const [tab, setTab] = useState<CareTab>("Health centre");
  const [view, setView] = useState<"Map" | "List">("List");
  const facilities = FACILITIES[tab];

  return (
    <main className={`screen with-nav care-screen${view === "Map" ? " map-mode" : ""}`}>
      <Header
        title="Find care"
        onBack={() => navigate("home")}
        action={
          <button type="button" className="icon-button" aria-label="Search services">
            <Icon name="search" />
          </button>
        }
      />

      <div className="care-tabs" role="tablist" aria-label="Facility type">
        {CARE_TABS.map((x) => (
          <button
            key={x}
            type="button"
            role="tab"
            aria-selected={tab === x}
            className={tab === x ? "active" : ""}
            onClick={() => setTab(x)}
          >
            {x}
          </button>
        ))}
      </div>

      <div className="map-preview">
        <div className="road r1" />
        <div className="road r2" />
        <div className="road r3" />
        <span className="map-pin p1" aria-hidden="true">
          <Icon name="hospital" size={17} />
        </span>
        <span className="map-pin p2" aria-hidden="true">
          <Icon name="hospital" size={17} />
        </span>
        <span className="you-dot" aria-hidden="true" />
        <div className="view-toggle" role="group" aria-label="Map or list view">
          {(["Map", "List"] as const).map((v) => (
            <button key={v} type="button" onClick={() => setView(v)} className={view === v ? "active" : ""} aria-pressed={view === v}>
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-row" role="group" aria-label="Filters">
        <button type="button" className="filter-main">
          <Icon name="sliders" size={17} /> Filters
        </button>
        <button type="button">Open now</button>
        <button type="button">Maternity</button>
      </div>

      <div className="result-count">
        <b>
          {tab === "Ambulance"
            ? `${FACILITIES.Ambulance.length} services`
            : `${facilities.length} places nearby`}
        </b>
        <span>Nearest first</span>
      </div>

      <div className="facility-list">
        {facilities.map((f) => (
          <button
            className="facility-card"
            key={f.name}
            type="button"
            onClick={() => notify(`Opening directions to ${f.name}`)}
          >
            <div className="facility-icon">
              <Icon name={f.icon} size={25} />
            </div>
            <div className="facility-content">
              <div className="facility-title">
                <h3>{f.name}</h3>
                <span>{f.distance}</span>
              </div>
              <p className={f.open ? "open" : "closed"}>{f.meta}</p>
              <div>
                {f.services.map((s) => (
                  <span className="service-chip" key={s}>
                    {s}
                  </span>
                ))}
              </div>
              <small>
                <Icon name="direction" size={14} /> {f.drive} drive
              </small>
            </div>
            <Icon name="chevron" size={18} />
          </button>
        ))}
      </div>

      <BottomNav active="care" navigate={navigate} onProfile={onProfile} />
    </main>
  );
}
