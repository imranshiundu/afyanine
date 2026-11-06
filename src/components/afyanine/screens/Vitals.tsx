"use client";

import { useState } from "react";
import { Icon } from "../Icon";
import { Header } from "../chrome";
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
import { stagger } from "../useMotion";

const RANGES: VitalsRange[] = ["Hourly", "Daily", "Weekly"];

export function Vitals({
  navigate,
  notify,
}: {
  navigate: (s: Screen) => void;
  notify: (msg: string) => void;
}) {
  const [range, setRange] = useState<VitalsRange>("Hourly");
  const series = VITALS[range];
  const cat = bpCategory(VITALS_CURRENT.systolic);
  const rangeIndex = RANGES.indexOf(range);

  return (
    <main className="screen vitals-screen">
      <Header
        title="My vitals"
        onBack={() => navigate("home")}
        action={
          <button
            type="button"
            className="icon-button"
            aria-label="Share vitals with my CHP"
            onClick={() => notify("Vitals shared with Grace (CHP)")}
          >
            <Icon name="sparkles" />
          </button>
        }
      />

      <div className="sync-state stagger" style={stagger(0)}>
        <span className="live-dot" aria-hidden="true" />
        <p>
          <b>{VITALS_CURRENT.device} connected</b>
          <small>Last synced {VITALS_CURRENT.synced}</small>
        </p>
        <span className="sync-badge">
          <Icon name="check" size={15} strokeWidth={3} />
        </span>
      </div>

      {/* Range switcher with a sliding thumb */}
      <div className="period-tabs" role="tablist" aria-label="Time range" style={stagger(1)}>
        <span className="period-thumb" data-pos={rangeIndex} aria-hidden="true" />
        {RANGES.map((r) => (
          <button
            key={r}
            type="button"
            role="tab"
            aria-selected={range === r}
            className={range === r ? "active" : ""}
            onClick={() => setRange(r)}
          >
            {r}
          </button>
        ))}
      </div>

      {/* HERO — blood pressure on ink */}
      <section className="bp-hero stagger" aria-label="Blood pressure" style={stagger(2)}>
        <div className="bp-hero-head">
          <div>
            <small>BLOOD PRESSURE</small>
            <p className="bp-hero-value">
              <b>{VITALS_CURRENT.systolic}</b>
              <em>/{VITALS_CURRENT.diastolic}</em>
              <span>mmHg</span>
            </p>
          </div>
          <span className={`status ${cat === "normal" ? "normal" : "high"}`}>
            {BP_CATEGORIES.find((c) => c.key === cat)?.label}
          </span>
        </div>

        <Sparkline
          key={range}
          data={[...series.systolic]}
          secondary={[...series.diastolic]}
          labels={[...series.labels]}
          min={90}
          max={150}
          ariaLabel={`Blood pressure trend by ${range.toLowerCase()} — latest reading ${VITALS_CURRENT.systolic} over ${VITALS_CURRENT.diastolic}`}
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
            <b>Today · {VITALS_CURRENT.systolic}/{VITALS_CURRENT.diastolic}</b>
          </div>
          <Icon name="route" size={20} />
        </div>
        <BpMeter systolic={VITALS_CURRENT.systolic} scale={BP_SCALE} categories={BP_CATEGORIES} />
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
              <b>{VITALS_CURRENT.heartRate}</b>
              <span>bpm</span>
            </p>
          </div>
          <span className="status normal">Normal</span>
        </div>
        <EcgWave />
        <div className="hr-chips">
          <span>
            <i className="dot low" /> Low {VITALS_CURRENT.heartLow}
          </span>
          <span>
            <i className="dot high" /> High {VITALS_CURRENT.heartHigh}
          </span>
          <span className="hr-summary">{series.hrSummary}</span>
        </div>
      </section>

      {/* Mini metrics */}
      <section className="mini-grid stagger">
        {MINI_METRICS.map((m, i) => (
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
          <b>Today’s readings look good</b>
          <small>Keep wearing your AfyaBand throughout the day.</small>
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
    </main>
  );
}
