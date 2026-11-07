"use client";

import { Icon } from "../Icon";
import { AMBULANCE, TIMELINE, TRACKING_STAGES, type Screen } from "../data";
import { useStageProgress, stagger } from "../useMotion";

export function Tracking({
  goBack,
  notify,
  emergencyType,
}: {
  goBack: () => void;
  notify: (msg: string) => void;
  emergencyType: string;
}) {
  const stage = useStageProgress(TRACKING_STAGES.length, 5000, true);
  const now = TRACKING_STAGES[stage];
  const arrived = stage >= 2;

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
          <path d="M72 365 C105 300, 91 250, 170 225 S220 150, 316 95" pathLength={1} />
          <circle cx="72" cy="365" r="7" />
        </svg>

        {/* Ambulance circles along the road on a loop */}
        <svg className="route traffic" viewBox="0 0 390 440" preserveAspectRatio="none" aria-hidden="true">
          <circle r="4.5" fill="#FFFFFF" opacity="0.75">
            <animateMotion
              dur="7s"
              repeatCount="indefinite"
              path="M72 365 C105 300, 91 250, 170 225 S220 150, 316 95"
            />
          </circle>
          <circle r="3.5" fill="#FFFFFF" opacity="0.55">
            <animateMotion
              dur="9s"
              begin="-3s"
              repeatCount="indefinite"
              path="M316 95 S220 150, 170 225 C91 250, 105 300, 72 365"
            />
          </circle>
        </svg>

        <button type="button" className="tracking-back" onClick={goBack} aria-label="Back">
          <Icon name="back" />
        </button>
        <div className="eta-pill" key={stage}>
          <span>
            <Icon name="ambulance" size={20} />
          </span>
          <div>
            <small>ESTIMATED ARRIVAL</small>
            <b>{now.eta}</b>
          </div>
        </div>
        <span className="destination-pin" aria-hidden="true">
          <span className="dest-radar" />
          <Icon name="pin" size={33} fill="var(--red)" stroke="#FFFFFF" strokeWidth={1.6} />
        </span>
        <span className="ambulance-pin" aria-hidden="true">
          <span className="siren-dot" />
          <Icon name="ambulance" size={23} />
        </span>
      </div>

      <section className="tracking-sheet stagger">
        <div className="grabber" aria-hidden="true" />
        <div className="tracking-status" style={stagger(0)}>
          <span className="live-dot" aria-hidden="true" />
          <b key={stage}>{now.status}</b>
          <small>{now.note}</small>
          <span className="emergency-chip">
            <Icon name="warning" size={13} /> {emergencyType || "Emergency"} · Wanjiku
          </span>
        </div>

        <div className="driver-card" style={stagger(1)}>
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

        <ol
          className="timeline"
          style={{ listStyle: "none", margin: 0, padding: 0 }}
          aria-label="Ambulance progress"
        >
          {TIMELINE.map((step, i) => {
            const done = i < now.doneSteps;
            const live = i === now.doneSteps - 1 && !arrived && stage < 3;
            return (
              <div className={done ? "done" : ""} key={step.label} style={stagger(2 + i)}>
                <span>
                  {done && <Icon name="check" size={12} strokeWidth={3} />}
                  {live && <i className="step-live" aria-hidden="true" />}
                </span>
                <b>{step.label}</b>
                {step.meta && !live ? <small>{step.meta}</small> : null}
                {live && <em>Now</em>}
              </div>
            );
          })}
        </ol>

        <p className="tracking-note">
          {arrived
            ? "Help has arrived. Open the door if it is safe."
            : "Stay where you are if it is safe. Keep your phone nearby."}
        </p>
      </section>
    </main>
  );
}
