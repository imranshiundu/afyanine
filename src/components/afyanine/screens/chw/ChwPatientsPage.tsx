import { useState } from "react";
import { ChwIcon, ChwPageHeader } from "./ChwShared"; // Removed ChwNav import
import { mockPatients } from "./mock-data";
import type { ChwPageProps, RiskLevel } from "./types";

// Extended interface to accept the drill-down function
interface ChwPatientsPageProps extends ChwPageProps {
  openPatient: (id: string) => void;
}

export function ChwPatientsPage({ navigate, notify, openPatient }: ChwPatientsPageProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<"All" | RiskLevel>("All");
  const filtered = mockPatients.filter(
    (patient) =>
      patient.name.toLowerCase().includes(query.toLowerCase()) &&
      (filter === "All" || patient.risk === filter),
  );

  return (
    <main className="screen chw-screen" style={{ paddingBottom: "80px" }}>
      <ChwPageHeader eyebrow="YOUR CASELOAD" title="Registered mothers" />
      <div className="patient-count-card">
        <div>
          <b>{mockPatients.length}</b>
          <span>Total mothers</span>
        </div>
        <div>
          <b className="red-text">
            {mockPatients.filter((patient) => patient.risk === "High Risk").length}
          </b>
          <span>High risk</span>
        </div>
        <div>
          <b>2</b>
          <span>Due this month</span>
        </div>
      </div>
      <div className="search-box patient-search">
        <ChwIcon name="search" />
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Search name or patient ID"
        />
      </div>
      <div className="patient-filters">
        {(["All", "High Risk", "Watch", "Normal"] as const).map((item) => (
          <button
            key={item}
            className={filter === item ? "active" : ""}
            onClick={() => setFilter(item)}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="registry-heading">
        <span>{filtered.length} mothers</span>
        <button onClick={() => notify("Patient list sorted by recent activity")}>
          Recent <ChwIcon name="sliders" size={14} />
        </button>
      </div>
      <div className="patient-list">
        {filtered.map((patient) => (
          // Fixed drill-down to pass the specific patient ID
          <button className="patient-row" key={patient.id} onClick={() => openPatient(patient.id)}>
            <span className="patient-avatar" style={{ background: patient.color }}>
              {patient.initials}
            </span>
            <div className="patient-info">
              <h3>{patient.name}</h3>
              <p>
                {patient.week} <i /> BP{" "}
                <b className={patient.high ? "red-text" : ""}>{patient.bp}</b>
              </p>
            </div>
            <span
              className={`risk ${patient.high ? "high" : patient.risk === "Watch" ? "watch" : ""}`}
            >
              {patient.risk}
            </span>
            <ChwIcon name="chevron" size={17} />
          </button>
        ))}
      </div>
      {/* Removed ChwNav component from here */}
    </main>
  );
}