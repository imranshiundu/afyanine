"use client";

import { Icon } from "../Icon";
import { EMERGENCY_TYPES, type Screen } from "../data";

export function Sos({ goBack, navigate }: { goBack: () => void; navigate: (s: Screen) => void }) {
  return (
    <main className="screen sos-screen">
      <section className="sos-header">
        <button type="button" onClick={goBack} className="icon-button red-back" aria-label="Cancel emergency">
          <Icon name="back" stroke="#FFFFFF" />
        </button>
        <div className="sos-symbol">
          <Icon name="plus" size={31} stroke="#FFFFFF" strokeWidth={2.5} />
        </div>
        <p>EMERGENCY HELP</p>
        <h1>
          Is this an
          <br />
          emergency?
        </h1>
        <span>Tell us what is happening. Help will be sent immediately.</span>
      </section>

      <section className="sos-options">
        <p className="field-label">CHOOSE ONE OPTION</p>
        {EMERGENCY_TYPES.map((e) => (
          <button key={e.title} type="button" onClick={() => navigate("tracking")}>
            <span className="emergency-icon">
              <Icon name={e.icon} size={23} />
            </span>
            <span className="sos-copy">
              <b>{e.title}</b>
              <small>{e.sub}</small>
            </span>
            <Icon name="chevron" />
          </button>
        ))}

        <div className="emergency-call">
          <span>Need to speak to emergency services?</span>
          <div>
            <a href="tel:999" aria-label="Call 999">
              <Icon name="phone" size={17} /> Call 999
            </a>
            <i />
            <a href="tel:112" aria-label="Call 112">
              Call 112
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
