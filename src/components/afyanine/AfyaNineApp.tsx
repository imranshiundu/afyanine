"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Icon } from "./Icon";
import { api, type MotherSnapshot, type PatientsPayload } from "./api";
import { getSupabase, REALTIME_CHANNEL } from "@/lib/supabase";
import { Login } from "./screens/Login";
import { Home } from "./screens/Home";
import { FindCare } from "./screens/FindCare";
import { Sos } from "./screens/Sos";
import { Tracking } from "./screens/Tracking";
import { Vitals } from "./screens/Vitals";
import { ChwDashboard } from "./screens/ChwDashboard";
import { PatientDetail } from "./screens/PatientDetail";
import { FLAGGED } from "./data";
import type { Role, Screen } from "./data";

const NAV_SCREENS: Screen[] = ["home", "care", "vitals"];

export function AfyaNine() {
  const [screen, setScreen] = useState<Screen>("login");
  const [stack, setStack] = useState<Screen[]>([]);
  const [role, setRole] = useState<Role>("mother");
  const [motherCode, setMotherCode] = useState<string>("MW-1048");
  const [dir, setDir] = useState<"fwd" | "back">("fwd");
  const [emergencyType, setEmergencyType] = useState("");
  const [toast, setToast] = useState("");
  const toastTimer = useRef<number | null>(null);

  /* ---- live backend data (null → screens fall back to demo data) ---- */
  const [snapshot, setSnapshot] = useState<MotherSnapshot | null>(null);
  const [patients, setPatients] = useState<PatientsPayload | null>(null);
  const [patientId, setPatientId] = useState(FLAGGED.id);

  const loadPatients = useCallback(() => {
    api.patients().then(setPatients);
  }, []);

  const notify = (message: string) => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    setToast("");
    /* retrigger the toast animation even when the message repeats */
    window.requestAnimationFrame(() => setToast(message));
    toastTimer.current = window.setTimeout(() => setToast(""), 2400);
  };

  useEffect(() => {
    let active = true;
    api.mother(motherCode).then((result) => {
      if (active) setSnapshot(result);
    });
    return () => {
      active = false;
    };
  }, [motherCode]);
  useEffect(() => {
    loadPatients();
  }, [loadPatients]);

  /* Realtime: one channel refreshes whichever session is on screen.
     INSERTs (vitals, SOS, notes) → refresh; SOS resolve → clear. */
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    let pending = false;
    let lastVitalsRefresh = 0;
    const refreshSoon = () => {
      if (pending) return;
      pending = true;
      window.setTimeout(() => {
        pending = false;
        api.mother(motherCode).then(setSnapshot);
        loadPatients();
      }, 700);
    };
    const channel = sb
      .channel(REALTIME_CHANNEL)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "VitalReading" }, () => {
        if (Date.now() - lastVitalsRefresh < 1500) return;
        lastVitalsRefresh = Date.now();
        refreshSoon();
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "Emergency" }, () => {
        loadPatients();
        if (role === "chw") notify("SOS received from the register");
      })
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "Emergency" }, (payload) => {
        loadPatients();
        const status = (payload.new as { status?: string }).status;
        if (status === "resolved") notify("SOS resolved");
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "VisitNote" }, refreshSoon)
      .subscribe();
    return () => {
      sb.removeChannel(channel);
    };
    // notify stays stable (setState wrapper); re-fetch handler reads role live
  }, [motherCode, role, loadPatients]);

  /* Forward navigation: remember where we came from */
  const navigate = (next: Screen) => {
    setDir("fwd");
    setStack((s) => (screen === "login" ? s : [...s, screen]));
    setScreen(next);
    if (next === "chw") loadPatients(); // fresh register each visit
  };

  /* Entry points (login) reset the whole journey */
  const enter = async (chosen: Role, code?: string) => {
    if (chosen === "mother" && code) {
      const selected = await api.mother(code);
      if (!selected) throw new Error("Test account unavailable");
      setSnapshot(selected);
      setMotherCode(code);
    }
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

  /* SOS pick → persist the emergency so the CHW banner lights up */
  const raiseEmergency = (title: string) => {
    setEmergencyType(title);
    api.raiseEmergency(title, motherCode).then(() => loadPatients());
  };

  /* CHW clears the active SOS → banner drops on both sides in realtime */
  const resolveEmergency = () => {
    api.resolveEmergency().then((res) => {
      notify(res && res.resolved > 0 ? "Ambulance dispatched · SOS resolved" : "No active SOS");
      loadPatients();
    });
  };

  const openPatient = (code: string) => {
    setPatientId(code);
    navigate("patient");
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
            <Home
              snapshot={snapshot}
              navigate={navigate}
              notify={notify}
              onProfile={() => notify(`Signed in as ${snapshot?.mother.firstName ?? "Mother"} · Mother`)}
            />
          )}
          {screen === "care" && (
            <FindCare navigate={navigate} notify={notify} onProfile={() => notify(`Signed in as ${snapshot?.mother.firstName ?? "Mother"} · Mother`)} />
          )}
          {screen === "sos" && (
            <Sos goBack={goBack} navigate={navigate} onEmergencyPicked={raiseEmergency} />
          )}
          {screen === "tracking" && (
            <Tracking goBack={goBack} notify={notify} emergencyType={emergencyType} />
          )}
          {screen === "vitals" && <Vitals snapshot={snapshot} navigate={navigate} notify={notify} />}
          {screen === "chw" && (
            <ChwDashboard
              payload={patients}
              navigate={navigate}
              openPatient={openPatient}
              notify={notify}
              onResolve={resolveEmergency}
              onLogout={() => {
                setDir("back");
                setStack([]);
                setScreen("login");
              }}
            />
          )}
          {screen === "patient" && (
            <PatientDetail
              key={patientId}
              patientId={patientId}
              navigate={navigate}
              notify={notify}
            />
          )}
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
