import { useState } from "react";
import { ChwDashboardPage } from "./chw/ChwDashboardPage";
import { ChwPatientsPage } from "./chw/ChwPatientsPage";
import { ChwVisitsPage } from "./chw/ChwVisitsPage";
import { ChwProfilePage } from "./chw/ChwProfilePage";
import { ChwNav } from "./chw/ChwShared";
import type { VisitNotes } from "./chw/types"; 

interface ChwDashboardProps {
  payload: any;
  navigate: (screen: string) => void;
  openPatient: (id: string) => void;
  notify: (msg: string) => void;
  onResolve: () => void;
  onLogout: () => void;
}

export function ChwDashboard({
  payload,
  navigate,
  openPatient,
  notify,
  onResolve,
  onLogout,
}: ChwDashboardProps) {
  // 1. Tab State
  const [activeTab, setActiveTab] = useState<"dashboard" | "patients" | "visits" | "profile">("dashboard");

  // 2. Local State for Hackathon Visit Notes
  const [notes, setNotes] = useState<VisitNotes>({});
  const saveNote = (id: string, note: string) => {
    setNotes((prev) => ({ ...prev, [id]: note }));
  };

  // 3. The Navigation Interceptor
  // This catches internal CHW routes and turns them into tab switches.
  // Anything else (like "patient" or "login") gets bubbled up to app.tsx.
  const handleInternalNavigation = (dest: string) => {
    if (dest === "chw") setActiveTab("dashboard");
    else if (dest === "chwPatients") setActiveTab("patients");
    else if (dest === "chwVisits") setActiveTab("visits");
    else if (dest === "chwProfile") setActiveTab("profile");
    else navigate(dest); 
  };

  return (
    <div className="chw-layout" style={{ height: "100%", display: "flex", flexDirection: "column" }}>
      
      {/* Scrollable Content Area */}
      <div className="chw-content" style={{ flexGrow: 1, overflowY: "auto" }}>
        
        {activeTab === "dashboard" && (
          <ChwDashboardPage
            navigate={handleInternalNavigation}
            notify={notify}
            openPatient={openPatient}
          />
        )}

        {activeTab === "patients" && (
          <ChwPatientsPage
            navigate={handleInternalNavigation}
            notify={notify}
            openPatient={openPatient}
          />
        )}

        {activeTab === "visits" && (
          <ChwVisitsPage
            navigate={handleInternalNavigation}
            notify={notify}
            notes={notes}
            saveNote={saveNote}
            openPatient={openPatient}
          />
        )}

        {activeTab === "profile" && (
          <ChwProfilePage 
          navigate={handleInternalNavigation}
          notify={notify}
          onLogout={onLogout}/>
        )}
      </div>

      {/* Fixed Bottom Navigation */}
      <ChwNav 
        active={activeTab} 
        navigate={handleInternalNavigation as any} 
        notify={notify} 
      />
    </div>
  );
}