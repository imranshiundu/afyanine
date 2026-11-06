"use client";

import { Icon } from "../Icon";
import { AMBULANCE, TIMELINE, type Screen } from "../data";

export function Tracking({ goBack, notify }: { goBack: () => void; notify: (msg: string) => void }) {
  return (
    <main className="screen tracking-screen">
      <div className="tracking-map">
        <div className="map-label l1">KIBERA</div>
        <div className="map-label l2">JAMHURI</div>
        <div className="road tr1" />
        <div className="road tr2" />
        <div className="road tr3" />
        <div className="road tr4" />
        <svg className="route" viewBox="0 0 390 440" preserveAspectRatio="none" aria-hidden="true">
          <path d="M72 365 C105 300, 91 250, 170 225 S220 150, 316 95" />
          <circle cx="72" cy="365" r="7" />
        </svg>
        <button type="button" className="tracking-back" onClick={goBack} aria-label="Back">
          <Icon name="back" />
        </button>
        <div className="eta-pill">
          <span>
            <Icon name="ambulance" size={20} />
          </span>
          <div>
            <small>ESTIMATED ARRIVAL</small>
            <b>{AMBULANCE.eta}</b>
          </div>
        </div>
        <span className="destination-pin">
          <Icon name="pin" size={33} fill="var(--red)" stroke="#FFFFFF" strokeWidth={1.6} />
        </span>
        <span className="ambulance-pin">
          <Icon name="ambulance" size={23} />
        </span>
      </div>

      <section className="tracking-sheet">
        <div className="grabber" aria-hidden="true" />
        <div className="tracking-status">
          <span className="live-dot" aria-hidden="true" />
          <b>{AMBULANCE.status}</b>
          <small>{AMBULANCE.updated}</small>
        </div>

        <div className="driver-card">
          <span className="avatar">{AMBULANCE.initials}</span>
          <div>
            <small>{AMBULANCE.service}</small>
            <h3>{AMBULANCE.plate}</h3>
            <p>Driver · {AMBULANCE.driver}</p>
          </div>
          <button type="button" onClick={() => notify(`Calling driver ${AMBULANCE.driver}`)}>
            <Icon name="phone" size={20} />
            <span>Call</span>
          </button>
        </div>

        <ol className="timeline" style={{ listStyle: "none", margin: 0, padding: 0 }} aria-label="Ambulance progress">
          {TIMELINE.map((step) => (
            <div className={step.done ? "done" : ""} key={step.label}>
              <span>{step.done && <Icon name="check" size={12} strokeWidth={3} />}</span>
              <b>{step.label}</b>
              {step.live ? <em>{step.meta}</em> : step.meta ? <small>{step.meta}</small> : null}
            </div>
          ))}
        </ol>

        <p className="tracking-note">Stay where you are if it is safe. Keep your phone nearby.</p>
      </section>
    </main>
  );
}
