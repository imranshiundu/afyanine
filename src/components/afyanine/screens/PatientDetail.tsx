"use client";

import { useState } from "react";
import { Icon } from "../Icon";
import { Header } from "../chrome";
import { ChartAxis, Sparkline } from "../charts";
import { AI_ALERT, BP_TREND, FLAGGED, type Screen } from "../data";
import { stagger } from "../useMotion";

export function PatientDetail({
  navigate,
  notify,
}: {
  navigate: (s: Screen) => void;
  notify: (msg: string) => void;
}) {
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);

  const saveNote = () => {
    if (!note.trim()) {
      notify("Add a note before saving");
      return;
    }
    setSaved(true);
    notify("Note saved to patient record");
    window.setTimeout(() => {
      setSaved(false);
      setNote("");
    }, 1400);
  };

  return (
    <main className="screen patient-screen">
      <Header
        title="Patient details"
        onBack={() => navigate("chw")}
        action={
          <button
            type="button"
            className="icon-button"
            aria-label="Patient history"
            onClick={() => notify("Opening full history")}
          >
            <Icon name="more" />
          </button>
        }
      />

      <section className="patient-profile stagger" style={stagger(0)}>
        <span className="patient-avatar large" style={{ background: FLAGGED.color }} aria-hidden="true">
          {FLAGGED.initials}
        </span>
        <span className="profile-copy">
          <h1>{FLAGGED.name}</h1>
          <p>
            {FLAGGED.week} pregnant · Age {FLAGGED.age}
          </p>
          <span className="patient-id">ID {FLAGGED.id}</span>
        </span>
        <button type="button" onClick={() => notify(`Calling ${FLAGGED.name}`)}>
          <Icon name="phone" size={19} />
          <span>Call</span>
        </button>
      </section>

      <section className="ai-alert stagger" aria-live="polite" style={stagger(1)}>
        <div className="ai-title">
          <span className="ai-pulse">
            <Icon name="warning" size={22} stroke="#FFFFFF" />
          </span>
          <div>
            <small>{AI_ALERT.label}</small>
            <h2>{AI_ALERT.title}</h2>
          </div>
        </div>
        <p>{AI_ALERT.reason}</p>
        <div className="ai-metrics">
          <span>
            <b>{AI_ALERT.latestBp}</b>
            <small>Latest BP</small>
          </span>
          <i aria-hidden="true" />
          <span>
            <b>{AI_ALERT.trend}</b>
            <small>{AI_ALERT.trendLabel}</small>
          </span>
        </div>
        <button
          type="button"
          onClick={() => notify("Alert marked for urgent follow-up")}
        >
          Mark for urgent follow-up <Icon name="arrow" size={17} />
        </button>
      </section>

      <section
        className="bp-card"
        aria-label="Blood pressure trend"
        style={stagger(2)}
      >
        <div className="card-title">
          <div>
            <p>{BP_TREND.label}</p>
            <h2>{BP_TREND.headline}</h2>
          </div>
          <span className="status high">{BP_TREND.status}</span>
        </div>
        <Sparkline
          data={[...BP_TREND.series]}
          labels={["12 Jun", "13 Jun", "14 Jun", "15 Jun", "16 Jun", "17 Jun", "Today"]}
          min={100}
          max={160}
          danger
          threshold={BP_TREND.threshold}
          thresholdLabel="140 danger line"
          ariaLabel="Blood pressure trend rising from 128 over 84 to 148 over 96 over seven days, above the 140 danger line"
        />
        <ChartAxis labels={BP_TREND.axis} indent />
        <div className="legend" aria-hidden="true">
          <span>
            <i className="legend-sys" /> Systolic
          </span>
          <span>
            <i className="legend-th" /> Danger line
          </span>
        </div>
      </section>

      <section className="notes-card" aria-label="Visit notes" style={stagger(3)}>
        <div className="card-title">
          <div>
            <p>VISIT NOTES</p>
            <h2>Add a note</h2>
          </div>
          <Icon name="edit" />
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add symptoms, observations or follow-up actions..."
          aria-label="Visit note"
        />
        <button
          type="button"
          className={`primary-button save-note${saved ? " saved" : ""}`}
          onClick={saveNote}
        >
          {saved ? (
            <>
              <Icon name="check" strokeWidth={3} /> Saved
            </>
          ) : (
            <>
              Save note <Icon name="check" />
            </>
          )}
        </button>
      </section>

      <button
        type="button"
        className="outline-call"
        style={stagger(4)}
        onClick={() => notify(`Calling ${FLAGGED.name}`)}
      >
        <Icon name="phone" /> Call patient
      </button>
    </main>
  );
}
