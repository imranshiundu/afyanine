"use client";

import { useState } from "react";
import { Icon } from "../Icon";
import { EMERGENCY_TYPES, type Screen } from "../data";
import { stagger } from "../useMotion";
import { useLanguage } from "../language";

export function Sos({
  goBack,
  navigate,
  onEmergencyPicked,
}: {
  goBack: () => void;
  navigate: (s: Screen) => void;
  onEmergencyPicked: (title: string) => void;
}) {
  const { t } = useLanguage();
  const [picked, setPicked] = useState<string | null>(null);

  const choose = (title: string) => {
    setPicked(title);
    onEmergencyPicked(title);
    window.setTimeout(() => navigate("tracking"), 420);
  };

  return (
    <main className="screen sos-screen">
      <section className="sos-header stagger">
        <button
          type="button"
          onClick={goBack}
          className="icon-button red-back"
          aria-label="Cancel emergency"
          style={stagger(0)}
        >
          <Icon name="back" stroke="#FFFFFF" />
        </button>
        <div className="sos-symbol" style={stagger(1)} aria-hidden="true">
          <span className="sos-ring" />
          <span className="sos-ring slow" />
          <Icon name="plus" size={31} stroke="#FFFFFF" strokeWidth={2.5} />
        </div>
        <p style={stagger(2)}>{t("EMERGENCY HELP")}</p>
        <h1 style={stagger(3)}>
          {t("Is this an emergency?")}
        </h1>
        <span style={stagger(4)}>
          {t("Fictional SOS demo. No emergency services are dispatched.")}
        </span>
      </section>

      <section className="sos-options stagger">
        <p className="field-label" style={stagger(5)}>
          {t("CHOOSE ONE OPTION")}
        </p>
        {EMERGENCY_TYPES.map((e, i) => (
          <button
            key={e.title}
            type="button"
            className={`sos-option${picked === e.title ? " picked" : ""}`}
            style={stagger(6 + i)}
            aria-pressed={picked === e.title}
            onClick={() => choose(e.title)}
          >
            <span className="emergency-icon">
              <Icon name={e.icon} size={23} />
            </span>
            <span className="sos-copy">
              <b>{t(e.title)}</b>
              <small>{t(e.sub)}</small>
            </span>
            {picked === e.title ? (
              <span className="sos-sending">
                <Icon name="check" size={17} strokeWidth={3} />
              </span>
            ) : (
              <Icon name="chevron" />
            )}
          </button>
        ))}

        <div className="emergency-call" style={stagger(6 + EMERGENCY_TYPES.length)}>
          <span>{t("Need to speak to emergency services?")}</span>
          <div>
            <a href="tel:999" aria-label="Call 999">
              <span className="call-chip">
                <Icon name="phone" size={16} /> {t("Call 999")}
              </span>
            </a>
            <i />
            <a href="tel:112" aria-label="Call 112">
              <span className="call-chip">
                <Icon name="phone" size={16} /> {t("Call 112")}
              </span>
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
