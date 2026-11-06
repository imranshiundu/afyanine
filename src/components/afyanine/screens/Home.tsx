"use client";

import { useState } from "react";
import { Icon } from "../Icon";
import { BottomNav } from "../chrome";
import { WeekRing } from "../charts";
import { Sheet } from "../Sheet";
import {
  ANC_VISIT,
  CHP_CONTACT,
  NOTIFICATIONS,
  PREGNANCY,
  QUICK_ACTIONS,
  type Screen,
} from "../data";
import { stagger } from "../useMotion";

export function Home({
  navigate,
  notify,
  onProfile,
}: {
  navigate: (s: Screen) => void;
  notify: (msg: string) => void;
  onProfile: () => void;
}) {
  const [chpOpen, setChpOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifRead, setNotifRead] = useState(false);

  const openNotifs = () => {
    setNotifOpen(true);
    setNotifRead(true);
  };

  return (
    <main className="screen with-nav">
      <div className="home-head stagger">
        <div style={stagger(0)}>
          <p>Good morning,</p>
          <h1>Wanjiku</h1>
        </div>
        <button
          type="button"
          className="notification"
          aria-label={notifRead ? "Notifications" : "Notifications, 1 unread"}
          onClick={openNotifs}
          style={stagger(1)}
        >
          <Icon name="bell" />
          {!notifRead && <i />}
        </button>
      </div>

      <section className="stagger">
        <section className="pregnancy-card" aria-label="Pregnancy overview" style={stagger(2)}>
          <span className="card-rings" aria-hidden="true" />
          <WeekRing week={PREGNANCY.week} totalWeeks={PREGNANCY.totalWeeks} />
          <div className="pregnancy-copy">
            <span className="tag">{PREGNANCY.trimester}</span>
            <h2>{PREGNANCY.headline}</h2>
            <p>
              {PREGNANCY.size} · <b>{PREGNANCY.daysLeft} days to go</b>
            </p>
          </div>
        </section>

        <section className="appointment-card" aria-label="Next antenatal visit" style={stagger(3)}>
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
            <button
              type="button"
              onClick={() => notify(`Opening directions to ${ANC_VISIT.place}`)}
            >
              <Icon name="direction" size={17} /> Directions
            </button>
            <button type="button" onClick={() => notify("Reschedule request started")}>
              Reschedule
            </button>
          </div>
        </section>
      </section>

      <div className="section-title">
        <h2>How can we help?</h2>
        <button type="button" onClick={() => navigate("care")}>
          See all
        </button>
      </div>

      <section className="quick-grid stagger">
        {QUICK_ACTIONS.map((action, i) => (
          <button key={action.title} type="button" style={stagger(i)} onClick={() => {
            if (action.dest === "chp-call") setChpOpen(true);
            else navigate(action.dest);
          }}>
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

      <Sheet
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        title="Notifications"
        label="Notifications"
      >
        <div className="notif-list">
          {NOTIFICATIONS.map((n) => (
            <article key={n.title} className="notif-item">
              <span className={`notif-icon ${n.tone}`}>
                <Icon name={n.icon} size={19} />
              </span>
              <div>
                <h3>{n.title}</h3>
                <p>{n.body}</p>
              </div>
              <small>{n.time}</small>
            </article>
          ))}
        </div>
      </Sheet>

      <Sheet open={chpOpen} onClose={() => setChpOpen(false)} title="My CHP" label="Talk to my CHP">
        <div className="chp-card">
          <span className="avatar">{CHP_CONTACT.initials}</span>
          <div>
            <h3>{CHP_CONTACT.name}</h3>
            <p>{CHP_CONTACT.role}</p>
            <small>{CHP_CONTACT.hours}</small>
          </div>
          <button
            type="button"
            className="chp-call"
            onClick={() => {
              setChpOpen(false);
              notify(`Calling ${CHP_CONTACT.name}`);
            }}
          >
            <Icon name="phone" size={18} />
            <span>Call</span>
          </button>
        </div>
        <p className="sheet-label">QUICK QUESTIONS</p>
        <div className="prompt-grid">
          {CHP_CONTACT.prompts.map((p) => (
            <button
              key={p.label}
              type="button"
              onClick={() => {
                setChpOpen(false);
                notify(p.toast);
              }}
            >
              <Icon name="chat" size={16} />
              {p.label}
            </button>
          ))}
        </div>
      </Sheet>
    </main>
  );
}
