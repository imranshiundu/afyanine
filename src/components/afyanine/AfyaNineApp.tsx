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

const NAV_SCREENS: Screen[] = ["home", "care"];

export function AfyaNine() {
  const [screen, setScreen] = useState<Screen>("login");
  const [stack, setStack] = useState<Screen[]>([]);
  const [role, setRole] = useState<Role>("mother");
  const [toast, setToast] = useState("");
  const shellRef = useRef<HTMLDivElement>(null);
  const toastTimer = useRef<number | null>(null);

  const scrollTop = () => {
    shellRef.current?.scrollTo({ top: 0, behavior: "smooth" });
  };

  /* Forward navigation: remember where we came from */
  const navigate = (next: Screen) => {
    setStack((s) => (screen === "login" ? s : [...s, screen]));
    setScreen(next);
    scrollTop();
  };

  /* Entry points (login) reset the whole journey */
  const enter = (chosen: Role) => {
    setRole(chosen);
    setStack([]);
    setScreen(chosen === "mother" ? "home" : "chw");
    scrollTop();
  };

  /* Back pops history, falling back to the signed-in role's home */
  const goBack = () => {
    const prev = stack[stack.length - 1];
    if (prev) {
      setStack(stack.slice(0, -1));
      setScreen(prev);
    } else {
      setScreen(role === "chw" ? "chw" : "home");
    }
    scrollTop();
  };

  const notify = (message: string) => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    setToast(message);
    toastTimer.current = window.setTimeout(() => setToast(""), 2400);
  };

  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  return (
    <div className="page">
      <div className="app-shell" ref={shellRef}>
        {screen === "login" && <Login onEnter={enter} />}
        {screen === "home" && (
          <Home navigate={navigate} notify={notify} onProfile={() => notify("Signed in as Wanjiku · Mother")} />
        )}
        {screen === "care" && (
          <FindCare navigate={navigate} notify={notify} onProfile={() => notify("Signed in as Wanjiku · Mother")} />
        )}
        {screen === "sos" && <Sos goBack={goBack} navigate={navigate} />}
        {screen === "tracking" && <Tracking goBack={goBack} notify={notify} />}
        {screen === "vitals" && <Vitals navigate={navigate} />}
        {screen === "chw" && (
          <ChwDashboard
            navigate={navigate}
            notify={notify}
            onLogout={() => {
              setStack([]);
              setScreen("login");
              scrollTop();
            }}
          />
        )}
        {screen === "patient" && <PatientDetail navigate={navigate} notify={notify} />}

        {toast && (
          <div className={`toast${NAV_SCREENS.includes(screen) ? " raised" : ""}`} role="status" aria-live="polite">
            <Icon name="check" size={17} strokeWidth={3} />
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}
