"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import { INITIAL_REMINDER_STATE, InstallReminderController } from "./install-reminder";

export function InstallReminder({ raised, suppressed }: { raised: boolean; suppressed: boolean }) {
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
    <aside className={`install-reminder${raised ? " raised" : ""}`} aria-label="Install AfyaNine" aria-live="polite">
      <div className="install-reminder-head">
        <img src="/icons/icon-192.png" width={44} height={44} alt="" />
        <div>
          <h2>Keep AfyaNine close</h2>
          <p>Add the app to your home screen for quick access.</p>
        </div>
      </div>
      {state.instructions && (
        <div id="install-instructions" className="install-instructions">
          {state.ios ? (
            <p>In Safari, tap <b>Share</b>, then <b>Add to Home Screen</b> and <b>Add</b>. If you opened this inside another app, open it in Safari first.</p>
          ) : (
            <p>Open your browser menu and look for <b>Install app</b> or <b>Add to Home Screen</b>. On desktop, you can also look for an install icon in the address bar. If these options are missing, try a browser that supports installation.</p>
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
          <Icon name="plus" size={18} />{state.busy ? "Opening…" : state.canPrompt ? "Install app" : "How to install"}
        </button>
        <button type="button" className="install-later" onClick={() => controller.current?.snooze()}>Not now</button>
      </div>
      <small>“Not now” reminds you again in 10 minutes.</small>
    </aside>
  );
}
