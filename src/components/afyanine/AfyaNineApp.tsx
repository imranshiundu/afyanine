"use client";

import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import { Icon } from "./Icon";
import { BottomNav } from "./chrome";
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
import { Onboarding } from "./screens/Onboarding";
import { InstallReminder } from "./InstallReminder";
import { Profile, Logout } from "./screens/Profile";
import { AccountHome } from "./screens/AccountHome";
import { useAccount } from "./useAccount";
import { writeDemoSession, type DemoSession } from "./account-session";
import { getInstalledOnboardingSnapshot, getOnboardingServerSnapshot, subscribeInstalledOnboarding } from "./installed-onboarding";
import { CareWorkspace } from "./CareWorkspace";
import { useLanguage } from "./language";

const NAV_SCREENS: Screen[] = ["home", "care", "vitals", "profile"];

export function AfyaNine() {
  const needsOnboarding = useSyncExternalStore(
    subscribeInstalledOnboarding,
    getInstalledOnboardingSnapshot,
    getOnboardingServerSnapshot,
  );
  return needsOnboarding ? <Onboarding /> : <AccountGate />;
}

function AccountGate() {
  const { t } = useLanguage();
  const { user, loading, error } = useAccount();
  if (loading) return <div className="page"><div className="app-shell"><main className="screen standalone-screen"><p role="status">{t("Restoring your session…")}</p></main></div></div>;
  if (user) return <CareWorkspace key={user.id} user={user} />;
  return <AfyaNineExperience key="guest" user={null} demo={null} sessionError={error} />;
}

function AfyaNineExperience({ user, demo, sessionError }: { user: User | null; demo: DemoSession | null; sessionError: string }) {
  const router = useRouter();
  const [screen, setScreen] = useState<Screen>(user ? "home" : demo ? demo.role === "chw" ? "chw" : "home" : "login");
  const [stack, setStack] = useState<Screen[]>([]);
  const [role] = useState<Role>(demo?.role ?? "mother");
  const [motherCode] = useState<string>(demo?.code ?? "MW-1048");
  const [dir, setDir] = useState<"fwd" | "back">("fwd");
  const [emergencyType, setEmergencyType] = useState("");
  const [toast, setToast] = useState("");
  const toastTimer = useRef<number | null>(null);

  /* ---- live backend data (null → screens fall back to demo data) ---- */
  const [snapshot, setSnapshot] = useState<MotherSnapshot | null>(null);
  const [recordFailed, setRecordFailed] = useState(false);
  const [patients, setPatients] = useState<PatientsPayload | null>(null);
  const [patientId, setPatientId] = useState(FLAGGED.id);

  const loadPatients = useCallback(() => {
    if (demo?.role !== "chw") return;
    api.patients().then(setPatients);
  }, [demo]);

  const notify = (message: string) => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    setToast("");
    /* retrigger the toast animation even when the message repeats */
    window.requestAnimationFrame(() => setToast(message));
    toastTimer.current = window.setTimeout(() => setToast(""), 2400);
  };

  useEffect(() => {
    if (!demo) return;
    let active = true;
    const refresh = () => {
      if (document.visibilityState === "hidden") return;
      if (demo.role === "mother") api.mother(motherCode).then(result => {
        if (!active) return;
        setRecordFailed(!result);
        if (result) setSnapshot(result);
      });
      loadPatients();
    };
    refresh();
    const timer = window.setInterval(refresh, 30_000);
    window.addEventListener("focus", refresh);
    document.addEventListener("visibilitychange", refresh);
    return () => {
      active = false;
      window.clearInterval(timer);
      window.removeEventListener("focus", refresh);
      document.removeEventListener("visibilitychange", refresh);
    };
  }, [motherCode, demo, loadPatients]);

  /* Realtime: one channel refreshes whichever session is on screen.
     INSERTs (vitals, SOS, notes) → refresh; SOS resolve → clear. */
  useEffect(() => {
    if (!demo) return;
    const sb = getSupabase();
    if (!sb) return;
    let pending = false;
    let refreshTimer: number | undefined;
    let lastVitalsRefresh = 0;
    const refreshSoon = () => {
      if (pending) return;
      pending = true;
      refreshTimer = window.setTimeout(() => {
        pending = false;
        api.mother(motherCode).then(result => { setRecordFailed(!result); if (result) setSnapshot(result); });
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
      window.clearTimeout(refreshTimer);
      sb.removeChannel(channel);
    };
    // notify stays stable (setState wrapper); re-fetch handler reads role live
  }, [motherCode, role, loadPatients, demo]);

  /* Forward navigation: remember where we came from */
  const navigate = (next: Screen) => {
    setDir("fwd");
    setStack((s) => (screen === "login" ? s : [...s, screen]));
    setScreen(next);
    if (next === "chw") loadPatients(); // fresh register each visit
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
    if (!demo) return;
    setEmergencyType(title);
    api.raiseEmergency(title, motherCode).then(() => loadPatients());
  };

  /* CHW clears the active SOS → banner drops on both sides in realtime */
  const resolveEmergency = () => {
    if (!demo) return;
    api.resolveEmergency().then((res) => {
      notify(res && res.resolved > 0 ? "Ambulance dispatched · SOS resolved" : "No active SOS");
      loadPatients();
    });
  };

  const openPatient = (code: string) => {
    setPatientId(code);
    navigate("patient");
  };

  const signOut = async () => {
    if (user) {
      const sb = getSupabase();
      if (!sb) throw new Error("Authentication unavailable");
      const { error } = await sb.auth.signOut({ scope: "local" });
      if (error) throw error;
    }
    writeDemoSession(null);
    router.replace("/signed-out");
  };

  const generateReading = async () => {
    if (!demo) return false;
    const result = await api.generateReading(motherCode);
    if (!result) return false;
    setSnapshot(result);
    setRecordFailed(false);
    loadPatients();
    return true;
  };

  useEffect(() => {
    return () => {
      if (toastTimer.current) window.clearTimeout(toastTimer.current);
    };
  }, []);

  const unavailableRecord = <main className="screen with-nav account-home">
    <section className="profile-card"><h1>{recordFailed ? "Demo record unavailable" : "Loading your selected persona…"}</h1>
      <p role="status">{recordFailed ? `Could not load ${motherCode}. No other mother's readings will be substituted.` : `Restoring ${motherCode} from the fictional ward.`}</p>
      {recordFailed && <button className="secondary-button" onClick={() => { setRecordFailed(false); void api.mother(motherCode).then(result => { setRecordFailed(!result); if (result) setSnapshot(result); }); }}>Retry record</button>}
      <button className="secondary-button" onClick={() => navigate("profile")}>View profile</button>
    </section><BottomNav active={screen} navigate={navigate} onProfile={() => navigate("profile")} />
  </main>;

  return (
    <div className="page">
      <div className="app-shell">
        <div key={screen} className={`view ${dir}`}>
          {screen === "login" && <>{sessionError && <p role="alert" className="account-error">{sessionError}</p>}<Login /></>}
          {screen === "home" && user && <AccountHome user={user} navigate={navigate} />}
          {screen === "home" && !user && (snapshot ?
            <Home
              snapshot={snapshot}
              navigate={navigate}
              notify={notify}
              stale={recordFailed}
              onProfile={() => navigate("profile")}
            /> : unavailableRecord)}
          {screen === "care" && (
            <FindCare navigate={navigate} onProfile={() => navigate("profile")} chw={demo?.role === "chw"} />
          )}
          {screen === "sos" && user && <main className="screen standalone-screen"><button className="secondary-button" onClick={goBack}>Go back</button><section className="profile-card"><h1>Need urgent help?</h1><p>This prototype cannot dispatch an ambulance or alert a care worker. For an emergency in Kenya, call the emergency services directly.</p><a className="primary-button" href="tel:112">Call 112</a></section></main>}
          {screen === "sos" && !user && (
            <Sos goBack={goBack} navigate={navigate} onEmergencyPicked={raiseEmergency} />
          )}
          {screen === "tracking" && (
            <Tracking goBack={goBack} notify={notify} emergencyType={emergencyType} />
          )}
          {screen === "vitals" && (user ? <AccountHome user={user} navigate={navigate} vitals /> : snapshot ? <Vitals snapshot={snapshot} navigate={navigate} notify={notify} stale={recordFailed} /> : unavailableRecord)}
          {screen === "chw" && (
            <ChwDashboard
              payload={patients}
              navigate={navigate}
              openPatient={openPatient}
              notify={notify}
              onResolve={resolveEmergency}
              onLogout={() => navigate("profile")}
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
          {screen === "profile" && <Profile user={user} demo={demo} snapshot={snapshot} navigate={navigate} onGenerate={generateReading} />}
          {screen === "logout" && <Logout account={Boolean(user)} onConfirm={signOut} onCancel={() => navigate("profile")} />}
        </div>

        <InstallReminder raised={NAV_SCREENS.includes(screen) || screen === "chw"} suppressed={screen === "sos" || screen === "tracking" || screen === "logout"} />
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
