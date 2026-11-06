"use client";

import { useState } from "react";
import { Icon } from "../Icon";
import { Header } from "../chrome";
import { LineChart } from "../charts";
import type { Screen } from "../data";

const AXIS = ["6 AM", "9 AM", "12 PM", "NOW"];

export function Vitals({ navigate }: { navigate: (s: Screen) => void }) {
  const [period, setPeriod] = useState("Hourly");

  return (
    <main className="screen vitals-screen">
      <Header
        title="My vitals"
        onBack={() => navigate("home")}
        action={
          <button type="button" className="icon-button" aria-label="More options">
            <Icon name="more" />
          </button>
        }
      />

      <div className="sync-state">
        <span aria-hidden="true" />
        <p>
          <b>Live wearable connected</b>
          <small>Last synced just now</small>
        </p>
        <Icon name="check" size={16} />
      </div>

      <div className="period-tabs" role="tablist" aria-label="Time range">
        {["Hourly", "Daily", "Weekly"].map((x) => (
          <button
            key={x}
            type="button"
            role="tab"
            aria-selected={period === x}
            className={period === x ? "active" : ""}
            onClick={() => setPeriod(x)}
          >
            {x}
          </button>
        ))}
      </div>

      <section className="vital-card" aria-label="Blood pressure">
        <div className="vital-card-head">
          <div>
            <span className="vital-icon">
              <Icon name="activity" />
            </span>
            <p>
              <small>BLOOD PRESSURE</small>
              <b>
                118<em>/76</em>
              </b>
              <i>mmHg</i>
            </p>
          </div>
          <span className="status normal">Normal</span>
        </div>
        <LineChart label="Blood pressure trend, rising from 112 over 68 to 118 over 76" />
        <div className="chart-axis" aria-hidden="true">
          {AXIS.map((x) => (
            <span key={x}>{x}</span>
          ))}
        </div>
        <p className="insight">
          <span>
            <Icon name="check" size={14} strokeWidth={3} />
          </span>
          Your blood pressure is in a healthy range.
        </p>
      </section>

      <section className="vital-card heart-card" aria-label="Heart rate">
        <div className="vital-card-head">
          <div>
            <span className="vital-icon">
              <Icon name="heart" fill="var(--lime)" />
            </span>
            <p>
              <small>HEART RATE</small>
              <b>82</b>
              <i>bpm</i>
            </p>
          </div>
          <span className="status normal">Normal</span>
        </div>
        <LineChart compact label="Heart rate trend around 82 beats per minute" />
        <div className="chart-axis" aria-hidden="true">
          {AXIS.map((x) => (
            <span key={x}>{x}</span>
          ))}
        </div>
      </section>

      <div className="vitals-tip">
        <Icon name="activity" />
        <p>
          <b>Today’s readings look good</b>
          <small>Keep wearing your AfyaBand throughout the day.</small>
        </p>
      </div>

      <button type="button" className="emergency-button vitals-emergency" onClick={() => navigate("sos")}>
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
