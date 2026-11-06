"use client";

import { useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import { Login } from "./screens/Login";
import { Home } from "./screens/Home";
import { FindCare } from "./screens/FindCare";
import { Sos } from "./screens/Sos";
import { Tracking } from "./screens/Tracking";
import { Vitals } from "./screens/Vitals";
import { ChwDashboard } from "./screens/ChwDashboard";
import { PatientDetail } from "./screens/PatientDetail";
import type { Role, Screen } from "./data";

const NAV_SCREENS: Screen[] = ["home", "care", "vitals"];

export function AfyaNine() {
  const [screen, setScreen] = useState<Screen>("login");
  const [stack, setStack] = useState<Screen[]>([]);
  const [role, setRole] = useState<Role>("mother");
  const [dir, setDir] = useState<"fwd" | "back">("fwd");
  const [emergencyType, setEmergencyType] = useState("");
  const [toast, setToast] = useState("");
  const toastTimer = useRef<number | null>(null);

  /* Forward navigation: remember where we came from */
  const navigate = (next: Screen) => {
    setDir("fwd");
    setStack((s) => (screen === "login" ? s : [...s, screen]));
    setScreen(next);
  };

  /* Entry points (login) reset the whole journey */
  const enter = (chosen: Role) => {
    setDir("fwd");
    setRole(chosen);
    setStack([]);
    setScreen(chosen === "mother" ? "home" : "chw");
  };

  /* Back pops history, falling back to the signed-in role's home */
  const goBack = () => {
    setDir("back");
    const prev = stack[stack.length - 1];
    if (prev) {
      setStack(stack.slice(0, -1));
      setScreen(prev);
    } else {
      setScreen(role === "chw" ? "chw" : "home");
    }
  };

  const notify = (message: string) => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    setToast("");
    /* retrigger the toast animation even when the message repeats */
    window.requestAnimationFrame(() => setToast(message));
    toastTimer.current = window.setTimeout(() => setToast(""), 2400);
  };

  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  return (
    <div className="page">
      <div className="app-shell">
        <div key={screen} className={`view ${dir}`}>
          {screen === "login" && <Login onEnter={enter} />}
          {screen === "home" && (
            <Home navigate={navigate} notify={notify} onProfile={() => notify("Signed in as Wanjiku · Mother")} />
          )}
          {screen === "care" && (
            <FindCare navigate={navigate} notify={notify} onProfile={() => notify("Signed in as Wanjiku · Mother")} />
          )}
          {screen === "sos" && (
            <Sos
              goBack={goBack}
              navigate={navigate}
              onEmergencyPicked={(title) => setEmergencyType(title)}
            />
          )}
          {screen === "tracking" && (
            <Tracking goBack={goBack} notify={notify} emergencyType={emergencyType} />
          )}
          {screen === "vitals" && <Vitals navigate={navigate} notify={notify} />}
          {screen === "chw" && (
            <ChwDashboard
              navigate={navigate}
              notify={notify}
              onLogout={() => {
                setDir("back");
                setStack([]);
                setScreen("login");
              }}
            />
          )}
          {screen === "patient" && <PatientDetail navigate={navigate} notify={notify} />}
        </div>

        {toast && (
          <div
            className={`toast${NAV_SCREENS.includes(screen) ? " raised" : ""}`}
            role="status"
            aria-live="polite"
          >
            <Icon name="check" size={17} strokeWidth={3} />
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}
