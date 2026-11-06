"use client";

import { Icon } from "../Icon";
import { BottomNav } from "../chrome";
import { WeekRing } from "../charts";
import { ANC_VISIT, PREGNANCY, QUICK_ACTIONS, type Screen } from "../data";

export function Home({
  navigate,
  notify,
  onProfile,
}: {
  navigate: (s: Screen) => void;
  notify: (msg: string) => void;
  onProfile: () => void;
}) {
  return (
    <main className="screen with-nav">
      <div className="home-head">
        <div>
          <p>Good morning,</p>
          <h1>Wanjiku</h1>
        </div>
        <button type="button" className="notification" aria-label="Notifications, 1 unread">
          <Icon name="bell" />
          <i />
        </button>
      </div>

      <section className="pregnancy-card" aria-label="Pregnancy overview">
        <WeekRing week={PREGNANCY.week} totalWeeks={PREGNANCY.totalWeeks} />
        <div className="pregnancy-copy">
          <span className="tag">{PREGNANCY.trimester}</span>
          <h2>{PREGNANCY.headline}</h2>
          <p>{PREGNANCY.size}</p>
        </div>
      </section>

      <section className="appointment-card" aria-label="Next antenatal visit">
        <div className="appointment-title">
          <span className="square-icon">
            <Icon name="calendar" />
          </span>
          <div>
            <small>{ANC_VISIT.label}</small>
            <h3>{ANC_VISIT.date}</h3>
            <p>{ANC_VISIT.detail}</p>
          </div>
        </div>
        <div className="appointment-actions">
          <button type="button" onClick={() => notify(`Opening directions to ${ANC_VISIT.place}`)}>
            <Icon name="direction" size={17} /> Directions
          </button>
          <button type="button" onClick={() => notify("Reschedule request started")}>
            Reschedule
          </button>
        </div>
      </section>

      <div className="section-title">
        <h2>How can we help?</h2>
        <button type="button" onClick={() => navigate("care")}>
          See all
        </button>
      </div>

      <section className="quick-grid">
        {QUICK_ACTIONS.map((action) => (
          <button
            key={action.title}
            type="button"
            onClick={() =>
              action.dest === "chp-call"
                ? notify("Your CHP, Grace, will call you shortly")
                : navigate(action.dest)
            }
          >
            <span>
              <Icon name={action.icon} />
            </span>
            <b>{action.title}</b>
            <small>{action.sub}</small>
          </button>
        ))}
      </section>

      <button type="button" className="emergency-button" onClick={() => navigate("sos")}>
        <span>
          <Icon name="phone" stroke="#FFFFFF" size={25} />
        </span>
        <div>
          <b>I need help now</b>
          <small>Emergency support, 24/7</small>
        </div>
        <Icon name="chevron" stroke="#FFFFFF" />
      </button>

      <BottomNav active="home" navigate={navigate} onProfile={onProfile} />
    </main>
  );
}
