"use client";

import { useState } from "react";
import { Icon } from "../Icon";
import { BottomNav, ThemeToggle } from "../chrome";
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
import type { MotherSnapshot } from "../api";
import { stagger } from "../useMotion";
import { useLanguage } from "../language";

const DAY_MONTH = (iso: string, locale: string) =>
  new Date(iso).toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

const TIME_OF_DAY = () => {
  const h = new Date().getHours();
  if (h < 12) return "Good morning,";
  if (h < 17) return "Good afternoon,";
  return "Good evening,";
};

export function Home({
  snapshot,
  navigate,
  notify,
  onProfile,
  stale = false,
}: {
  snapshot: MotherSnapshot | null;
  navigate: (s: Screen) => void;
  notify: (msg: string) => void;
  onProfile: () => void;
  stale?: boolean;
}) {
  const { t, locale } = useLanguage();
  const [chpOpen, setChpOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [notifRead, setNotifRead] = useState(false);

  const live = snapshot; // null → bundled demo data below
  const pregnancy = live
    ? {
        week: live.mother.week,
        totalWeeks: live.mother.totalWeeks,
        trimester: live.mother.trimester,
        size: live.mother.sizeNote,
        daysLeft: live.mother.daysLeft,
        headline: live.mother.week >= 28 ? "Your baby is growing beautifully." : "Your baby is on track.",
      }
    : PREGNANCY;
  const visit = live?.appointment
    ? {
        label: live.appointment.label,
        date: DAY_MONTH(live.appointment.scheduledAt, locale),
        detail: `${new Date(live.appointment.scheduledAt).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit", hour12: true })} · ${live.appointment.place}`,
        place: live.appointment.place,
      }
    : ANC_VISIT;

  const openNotifs = () => {
    setNotifOpen(true);
    setNotifRead(true);
  };

  return (
    <main className="screen with-nav">
      <p className="demo-feed-label">{t("Fictional Test Ward · data refreshes every 30 seconds · not a medical service")}</p>
      {stale && <p className="account-notice" role="status">{t("Refresh unavailable. Showing the last loaded fictional record.")}</p>}
      <div className="home-head stagger">
        <div style={stagger(0)}>
          <p>{t(TIME_OF_DAY())}</p>
          <h1>{live?.mother.firstName ?? "Wanjiku"}</h1>
        </div>
        <div className="head-actions">
          <ThemeToggle className="theme-toggle" />
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
      </div>

      <section className="stagger">
        <section className="pregnancy-card" aria-label="Pregnancy overview" style={stagger(2)}>
          <span className="card-rings" aria-hidden="true" />
          <WeekRing week={pregnancy.week} totalWeeks={pregnancy.totalWeeks} />
          <div className="pregnancy-copy">
            <span className="tag">{t(pregnancy.trimester)}</span>
            <h2>{t(pregnancy.headline)}</h2>
            <p>
              {t(pregnancy.size)} · <b>{pregnancy.daysLeft} {t("days to go")}</b>
            </p>
          </div>
        </section>

        <section className="appointment-card" aria-label="Next antenatal visit" style={stagger(3)}>
          <div className="appointment-title">
            <span className="square-icon">
              <Icon name="calendar" />
            </span>
            <div>
              <small>{t(visit.label)}</small>
              <h3>{visit.date}</h3>
              <p>{visit.detail}</p>
            </div>
          </div>
          <div className="appointment-actions">
            <button
              type="button"
              onClick={() => notify(`Opening directions to ${visit.place}`)}
            >
              <Icon name="direction" size={17} /> {t("Directions")}
            </button>
            <button type="button" onClick={() => notify("Reschedule request started")}>
              {t("Reschedule")}
            </button>
          </div>
        </section>
      </section>

      <div className="section-title">
        <h2>{t("How can we help?")}</h2>
        <button type="button" onClick={() => navigate("care")}>
          {t("See all")}
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
            <b>{t(action.title)}</b>
            <small>{t(action.sub)}</small>
          </button>
        ))}
      </section>

      <button type="button" className="emergency-button" onClick={() => navigate("sos")}>
        <span>
          <Icon name="phone" stroke="#FFFFFF" size={25} />
        </span>
        <div>
          <b>{t("I need help now")}</b>
          <small>{t("Emergency support, 24/7")}</small>
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
                <h3>{t(n.title)}</h3>
                <p>{t(n.body)}</p>
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
            <p>{t(CHP_CONTACT.role)}</p>
            <small>{t(CHP_CONTACT.hours)}</small>
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
            <span>{t("Call")}</span>
          </button>
        </div>
        <p className="sheet-label">{t("QUICK QUESTIONS")}</p>
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
              {t(p.label)}
            </button>
          ))}
        </div>
      </Sheet>
    </main>
  );
}
