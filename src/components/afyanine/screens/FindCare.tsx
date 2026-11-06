"use client";

import { useState } from "react";
import { Icon } from "../Icon";
import { BottomNav, Header } from "../chrome";
import { Sheet } from "../Sheet";
import { CARE_FILTERS, CARE_TABS, FACILITIES, type CareTab, type Screen } from "../data";
import { stagger } from "../useMotion";

type FilterId = string;

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
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<Record<FilterId, boolean>>({
    open: false,
    maternity: false,
    anc: false,
    always: false,
  });
  const [pending, setPending] = useState<Record<FilterId, boolean>>({ ...filters, });

  const matches = (f: (typeof FACILITIES)[CareTab][number]) => {
    if (filters.open && !f.open) return false;
    if (filters.maternity && !f.services.includes("Maternity")) return false;
    if (filters.anc && !f.services.some((s) => s.includes("ANC"))) return false;
    if (filters.always && !f.alwaysOpen) return false;
    return true;
  };

  const facilities = FACILITIES[tab].filter(matches);

  const activeCount = Object.values(filters).filter(Boolean).length;

  const toggleFilter = (id: FilterId) => setPending((p) => ({ ...p, [id]: !p[id] }));

  const applyFilters = () => {
    setFilters({ ...pending });
    setFilterOpen(false);
  };

  const quickToggle = (id: FilterId) => {
    const next = !filters[id];
    setFilters((f) => ({ ...f, [id]: next }));
    setPending((p) => ({ ...p, [id]: next }));
  };

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
        <span className="map-label care-l1">KIBERA</span>
        <button
          type="button"
          className="map-pin p1"
          aria-hidden={false}
          aria-label="First facility on map"
          onClick={() => notify(FACILITIES[tab][0]?.name ?? "Facility")}
        >
          <Icon name="hospital" size={17} />
        </button>
        <button
          type="button"
          className="map-pin p2"
          aria-label="Second facility on map"
          onClick={() => notify(FACILITIES[tab][1]?.name ?? "Facility")}
        >
          <Icon name="hospital" size={17} />
        </button>
        <span className="you-dot radar" aria-hidden="true" />
        <div className="view-toggle" role="group" aria-label="Map or list view">
          {(["Map", "List"] as const).map((v) => (
            <button
              key={v}
              type="button"
              onClick={() => setView(v)}
              className={view === v ? "active" : ""}
              aria-pressed={view === v}
            >
              {v}
            </button>
          ))}
        </div>
      </div>

      <div className="filter-row" role="group" aria-label="Quick filters">
        <button type="button" className="filter-main" onClick={() => setFilterOpen(true)}>
          <Icon name="sliders" size={17} /> Filters
          {activeCount > 0 && <i className="filter-badge">{activeCount}</i>}
        </button>
        <button
          type="button"
          className={filters.open ? "chip-on" : ""}
          aria-pressed={filters.open}
          onClick={() => quickToggle("open")}
        >
          Open now
        </button>
        <button
          type="button"
          className={filters.maternity ? "chip-on" : ""}
          aria-pressed={filters.maternity}
          onClick={() => quickToggle("maternity")}
        >
          Maternity
        </button>
        <button
          type="button"
          className={filters.always ? "chip-on" : ""}
          aria-pressed={filters.always}
          onClick={() => quickToggle("always")}
        >
          24 hours
        </button>
      </div>

      <div className="result-count">
        <b>
          {facilities.length === FACILITIES[tab].length
            ? tab === "Ambulance"
              ? `${FACILITIES.Ambulance.length} services`
              : `${facilities.length} places nearby`
            : `${facilities.length} of ${FACILITIES[tab].length} places`}
        </b>
        <span>Nearest first</span>
      </div>

      <div className="facility-list stagger" key={`${tab}-${activeCount}`}>
        {facilities.map((f, i) => (
          <button
            className="facility-card"
            key={f.name}
            type="button"
            style={stagger(i)}
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
        {facilities.length === 0 && (
          <div className="empty-state" style={stagger(0)}>
            <span className="empty-art">
              <Icon name="search" size={26} />
            </span>
            <b>No places match</b>
            <p>Try removing a filter to widen your search.</p>
            <button
              type="button"
              onClick={() => {
                const cleared = { open: false, maternity: false, anc: false, always: false };
                setFilters(cleared);
                setPending(cleared);
              }}
            >
              Clear filters
            </button>
          </div>
        )}
      </div>

      <BottomNav active="care" navigate={navigate} onProfile={onProfile} />

      <Sheet
        open={filterOpen}
        onClose={() => setFilterOpen(false)}
        title="Filters"
        label="Filter facilities"
      >
        <div className="filter-options">
          {CARE_FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              className="filter-option"
              role="switch"
              aria-checked={pending[f.id]}
              onClick={() => toggleFilter(f.id)}
            >
              <span>{f.label}</span>
              <span className={`switch${pending[f.id] ? " on" : ""}`} aria-hidden="true">
                <i />
              </span>
            </button>
          ))}
        </div>
        <button type="button" className="primary-button" onClick={applyFilters}>
          Show {tab === "Ambulance" ? "services" : "places"}
        </button>
      </Sheet>
    </main>
  );
}
