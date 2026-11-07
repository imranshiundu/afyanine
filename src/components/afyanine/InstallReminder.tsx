"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import { INITIAL_REMINDER_STATE, InstallReminderController } from "./install-reminder";
import { useLanguage } from "./language";

export function InstallReminder({ raised, suppressed }: { raised: boolean; suppressed: boolean }) {
  const { t } = useLanguage();
  const [state, setState] = useState(INITIAL_REMINDER_STATE);
  const controller = useRef<InstallReminderController | null>(null);

  useEffect(() => {
    const reminder = new InstallReminderController(window, setState);
    controller.current = reminder;
    const stop = reminder.start();
    return () => {
      stop();
      controller.current = null;
    };
  }, []);

  useEffect(() => { controller.current?.setSuppressed(suppressed); }, [suppressed]);

  if (!state.visible || suppressed) return null;
  return (
    <aside className={`install-reminder${raised ? " raised" : ""}`} aria-label={t("Install AfyaNine")} aria-live="polite">
      <div className="install-reminder-head">
        <img src="/icons/icon-192.png" width={44} height={44} alt="" />
        <div>
          <h2>{t("Keep AfyaNine close")}</h2>
          <p>{t("Add the app to your home screen for quick access.")}</p>
        </div>
      </div>
      {state.instructions && (
        <div id="install-instructions" className="install-instructions">
          {state.ios ? (
            <p>{t("In Safari, tap Share, then Add to Home Screen and Add. If you opened this inside another app, open it in Safari first.")}</p>
          ) : (
            <p>{t("Open your browser menu and look for Install app or Add to Home Screen. On desktop, look for the install icon in the address bar.")}</p>
          )}
        </div>
      )}
      <div className="install-reminder-actions">
        <button
          type="button"
          className="install-primary"
          disabled={state.busy}
          aria-expanded={state.canPrompt ? undefined : state.instructions}
          aria-controls={state.instructions ? "install-instructions" : undefined}
          onClick={() => void controller.current?.install()}
        >
          <Icon name="plus" size={18} />{t(state.busy ? "Opening…" : state.canPrompt ? "Install app" : "How to install")}
        </button>
        <button type="button" className="install-later" onClick={() => controller.current?.snooze()}>{t("Not now")}</button>
      </div>
      <small>{t("“Not now” reminds you again in 10 minutes.")}</small>
    </aside>
  );
}
