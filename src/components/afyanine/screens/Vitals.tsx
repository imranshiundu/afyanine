"use client";

import { useState, type ReactNode } from "react";
import { Icon } from "../Icon";
import { BottomNav, Header } from "../chrome";
import { BpMeter, ChartAxis, EcgWave, Sparkline } from "../charts";
import {
  BP_CATEGORIES,
  BP_SCALE,
  MINI_METRICS,
  VITALS,
  VITALS_CURRENT,
  bpCategory,
  type Screen,
  type VitalsRange,
} from "../data";
import type { MotherSnapshot } from "../api";
import { stagger } from "../useMotion";

const RANGES: VitalsRange[] = ["Hourly", "Daily", "Weekly"];

export function Vitals({
  snapshot,
  navigate,
  notify,
  accountMode = false,
  children,
}: {
  snapshot: MotherSnapshot | null;
  navigate: (s: Screen) => void;
  notify: (msg: string) => void;
  accountMode?: boolean;
  children?: ReactNode;
}) {
  const [range, setRange] = useState<VitalsRange>("Hourly");

  /* Live series when the API responded; bundled demo data otherwise */
  const series = snapshot?.series[range] ?? VITALS[range];
  const current = snapshot
    ? {
        ...snapshot.current,
        weightKg: VITALS_CURRENT.weightKg,
        weightDelta: VITALS_CURRENT.weightDelta,
        sleep: VITALS_CURRENT.sleep,
        sleepDeep: VITALS_CURRENT.sleepDeep,
        kicks: VITALS_CURRENT.kicks,
        kicksSince: VITALS_CURRENT.kicksSince,
      }
    : VITALS_CURRENT;

  const cat = bpCategory(current.systolic);
  const hrCat = current.heartRate > 0 && current.heartRate < 100 ? "normal" : "high";
  const rangeIndex = RANGES.indexOf(range);
  const catLabel = BP_CATEGORIES.find((c) => c.key === cat)?.label ?? "Normal";

  return (
    <main className="screen vitals-screen with-nav">
      <Header
        title="My vitals"
        onBack={() => navigate("home")}
        action={
          <button
            type="button"
            className="icon-button"
            aria-label="Share vitals with my CHP"
            onClick={() => accountMode ? navigate("profile") : notify("Vitals shared with Grace (CHP)")}
          >
            <Icon name="sparkles" />
          </button>
        }
      />

      <div className="sync-state stagger" style={stagger(0)}>
        <span className="live-dot" aria-hidden="true" />
        <p>
          <b>{accountMode ? `${current.device} · saved data` : `${current.device} connected`}</b>
          <small>Last synced {current.synced}</small>
        </p>
        <span className="sync-badge">
          <Icon name="check" size={15} strokeWidth={3} />
        </span>
      </div>

      {/* Range switcher with a sliding thumb */}
      <div className="period-tabs" role="tablist" aria-label="Time range" style={stagger(1)}>
        <span className="period-thumb" data-pos={rangeIndex} aria-hidden="true" />
        {(accountMode ? (["Hourly"] as const) : RANGES).map((r) => (
          <button
            key={r}
            type="button"
            role="tab"
            aria-selected={range === r}
            className={range === r ? "active" : ""}
            onClick={() => setRange(r)}
          >
            {accountMode ? "Latest saved readings" : r}
          </button>
        ))}
      </div>

      {/* HERO — blood pressure on ink */}
      <section className="bp-hero stagger" aria-label="Blood pressure" style={stagger(2)}>
        <div className="bp-hero-head">
          <div>
            <small>BLOOD PRESSURE</small>
            <p className="bp-hero-value">
              <b>{current.systolic}</b>
              <em>/{current.diastolic}</em>
              <span>mmHg</span>
            </p>
          </div>
          <span className={`status ${cat === "normal" || cat === "low" ? "normal" : "high"}`}>
            {catLabel}
          </span>
        </div>

        <Sparkline
          key={range}
          data={[...series.systolic]}
          secondary={[...series.diastolic]}
          labels={[...series.labels]}
          min={90}
          max={160}
          ariaLabel={`Blood pressure trend by ${range.toLowerCase()} — latest reading ${current.systolic} over ${current.diastolic}`}
        />
        <ChartAxis labels={series.labels} />

        <p className="bp-hero-insight">
          <span>
            <Icon name="sparkles" size={13} />
          </span>
          {series.bpInsight}
        </p>
      </section>

      {/* Category meter — where today's reading sits */}
      <section className="vital-card" aria-label="Blood pressure category" style={stagger(3)}>
        <div className="vital-card-head plain">
          <div>
            <small>WHERE YOUR READING SITS</small>
            <b>Today · {current.systolic}/{current.diastolic}</b>
          </div>
          <Icon name="route" size={20} />
        </div>
        <BpMeter systolic={current.systolic} scale={BP_SCALE} categories={BP_CATEGORIES} />
        <p className="meter-note">
          Danger zone starts at 140/90 — the point where we check for preeclampsia.
        </p>
      </section>

      {/* Heart rate — live ECG */}
      <section className="vital-card heart-card" aria-label="Heart rate" style={stagger(4)}>
        <div className="vital-card-head plain">
          <div>
            <small>
              <Icon name="heart" size={13} fill="var(--lime)" /> HEART RATE · LIVE
            </small>
            <p className="hr-value">
              <b>{current.heartRate}</b>
              <span>bpm</span>
            </p>
          </div>
          <span className={`status ${hrCat === "normal" ? "normal" : "high"}`}>
            {hrCat === "normal" ? "Normal" : "Check"}
          </span>
        </div>
        {!accountMode && <EcgWave />}
        <div className="hr-chips">
          <span>
            <i className="dot low" /> Low {current.heartLow}
          </span>
          <span>
            <i className="dot high" /> High {current.heartHigh}
          </span>
          <span className="hr-summary">{series.hrSummary}</span>
        </div>
      </section>

      {/* Mini metrics */}
      <section className="mini-grid stagger">
        {!accountMode && MINI_METRICS.map((m, i) => (
          <button
            key={m.label}
            type="button"
            className="mini-tile"
            style={stagger(i)}
            onClick={() => notify(m.toast)}
          >
            <span className="mini-icon">
              <Icon name={m.icon} size={20} />
            </span>
            <b>{m.value}</b>
            <small>{m.unit || m.label}</small>
            <span className="mini-sub">{m.sub}</span>
          </button>
        ))}
      </section>

      <div className="vitals-tip" style={stagger(0)}>
        <Icon name="sparkles" />
        <p>
          <b>
            {accountMode ? "Latest saved reading" : cat === "normal" || cat === "low"
              ? "Today's readings look good"
              : "Your BP is elevated today"}
          </b>
          <small>
            {accountMode ? "Measurements from a simulated band are not clinical readings. Use emergency services if you feel unwell; no clinician is automatically alerted by this card." : cat === "normal" || cat === "low"
              ? "Keep wearing your AfyaBand throughout the day."
              : "Rest, avoid salt, and tap SOS if you feel unwell — Grace has been alerted."}
          </small>
        </p>
      </div>

      <button
        type="button"
        className="emergency-button vitals-emergency"
        onClick={() => navigate("sos")}
      >
        <span>
          <Icon name="phone" stroke="#FFFFFF" />
        </span>
        <div>
          <b>SOS — I need help</b>
          <small>Get emergency support now</small>
        </div>
        <Icon name="chevron" stroke="#FFFFFF" />
      </button>
      {children}
      <BottomNav
        active="vitals"
        navigate={navigate}
        onProfile={() => accountMode ? navigate("profile") : notify(`Signed in as ${snapshot?.mother.firstName ?? "Mother"} · Mother`)}
      />
    </main>
  );
}
