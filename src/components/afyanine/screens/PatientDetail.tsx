"use client";

import { useEffect, useState } from "react";
import { Icon } from "../Icon";
import { Header } from "../chrome";
import { ChartAxis, Sparkline } from "../charts";
import { AI_ALERT, BP_TREND, FLAGGED, type Screen } from "../data";
import { api, type PatientDetailPayload } from "../api";
import { stagger } from "../useMotion";
import { useLanguage } from "../language";

const timeOf = (iso: string) =>
  new Date(iso).toLocaleString("en-KE", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });

export function PatientDetail({
  patientId,
  navigate,
  notify,
}: {
  patientId: string;
  navigate: (s: Screen) => void;
  notify: (msg: string) => void;
}) {
  const { t } = useLanguage();
  const [note, setNote] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  /* Live record from the API; bundled demo case as instant fallback */
  const [detail, setDetail] = useState<PatientDetailPayload | null>(null);
  const [notes, setNotes] = useState<PatientDetailPayload["notes"]>([]);

  useEffect(() => {
    let alive = true;
    api.patient(patientId).then((data) => {
      if (!alive || !data) return;
      setDetail(data);
      setNotes(data.notes);
    });
    return () => {
      alive = false;
    };
  }, [patientId]);

  const patient = detail?.patient ?? FLAGGED;
  const alert = detail?.alert ?? AI_ALERT;
  const trend = detail
    ? {
        label: "BLOOD PRESSURE TREND",
        headline: detail.trend.headline,
        status: detail.trend.status,
        axis: detail.trend.axis,
        series: detail.trend.series,
        threshold: detail.trend.threshold,
      }
    : BP_TREND;

  const saveNote = async () => {
    if (!note.trim()) {
      notify("Add a note before saving");
      return;
    }
    setSaving(true);
    const res = await api.saveNote(patientId, note.trim(), "Grace Wanjiru");
    setSaving(false);
    if (res?.note) {
      setNotes((n) => [res.note, ...n]);
      notify("Note saved to patient record");
      setNote("");
      setSaved(true);
      window.setTimeout(() => setSaved(false), 1400);
    } else {
      notify("Could not reach the clinic record — try again");
    }
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
        <span className="patient-avatar large" style={{ background: patient.color }} aria-hidden="true">
          {patient.initials}
        </span>
        <span className="profile-copy">
          <h1>{patient.name}</h1>
          <p>
            {patient.week} {t("pregnant")} · {t("Age")} {patient.age}
          </p>
          <span className="patient-id">ID {patient.id}</span>
        </span>
        <button type="button" onClick={() => notify(`Calling ${patient.name}`)}>
          <Icon name="phone" size={19} />
          <span>{t("Call")}</span>
        </button>
      </section>

      {alert && (
        <section className="ai-alert stagger" aria-live="polite" style={stagger(1)}>
          <div className="ai-title">
            <span className="ai-pulse">
              <Icon name="warning" size={22} stroke="#FFFFFF" />
            </span>
            <div>
              <small>{t(alert.label)}</small>
              <h2>{t(alert.title)}</h2>
            </div>
          </div>
          <p>{t(alert.reason)}</p>
          <div className="ai-metrics">
            <span>
              <b>{alert.latestBp}</b>
              <small>{t("Latest BP")}</small>
            </span>
            <i aria-hidden="true" />
            <span>
              <b>{alert.trend}</b>
              <small>{t(alert.trendLabel)}</small>
            </span>
          </div>
          <button
            type="button"
            onClick={() => notify("Alert marked for urgent follow-up")}
          >
            {t("Mark for urgent follow-up")} <Icon name="arrow" size={17} />
          </button>
        </section>
      )}

      <section
        className="bp-card"
        aria-label="Blood pressure trend"
        style={stagger(2)}
      >
        <div className="card-title">
          <div>
            <p>{t(trend.label ?? "BLOOD PRESSURE TREND")}</p>
            <h2>{t(trend.headline)}</h2>
          </div>
          <span className={`status ${trend.status === "High" ? "high" : ""}`}>{t(trend.status)}</span>
        </div>
        <Sparkline
          data={[...trend.series]}
          labels={[...trend.axis]}
          min={100}
          max={160}
          danger
          threshold={trend.threshold}
          thresholdLabel="140 danger line"
          ariaLabel={`Blood pressure trend, ${trend.headline.toLowerCase()}, latest ${patient.bp}`}
        />
        <ChartAxis labels={trend.axis} indent />
        <div className="legend" aria-hidden="true">
          <span>
            <i className="legend-sys" /> {t("Systolic")}
          </span>
          <span>
            <i className="legend-th" /> {t("Danger line")}
          </span>
        </div>
      </section>

      <section className="notes-card" aria-label="Visit notes" style={stagger(3)}>
        <div className="card-title">
          <div>
            <p>{t("VISIT NOTES")}</p>
            <h2>{t("Add a note")}</h2>
          </div>
          <Icon name="edit" />
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder={t("Add symptoms, observations or follow-up actions...")}
          aria-label={t("Visit note")}
        />
        <button
          type="button"
          className={`primary-button save-note${saved ? " saved" : ""}`}
          onClick={saveNote}
          disabled={saving}
        >
          {saved ? (
            <>
              <Icon name="check" strokeWidth={3} /> {t("Saved")}
            </>
          ) : (
            <>
              {t("Save note")} <Icon name="check" />
            </>
          )}
        </button>

        {notes.length > 0 && (
          <div className="note-history">
            {notes.map((n) => (
              <article key={n.id} className="note-item">
                <span className="note-avatar" aria-hidden="true">
                  {n.author
                    .split(" ")
                    .map((p) => p[0])
                    .slice(0, 2)
                    .join("")}
                </span>
                <div>
                  <header>
                    <b>{n.author}</b>
                    <small>{timeOf(n.createdAt)}</small>
                  </header>
                  <p>{n.body}</p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      <button
        type="button"
        className="outline-call"
        style={stagger(4)}
        onClick={() => notify(`Calling ${patient.name}`)}
      >
        <Icon name="phone" /> {t("Call patient")}
      </button>
    </main>
  );
}
