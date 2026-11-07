import { ChwIcon, ScheduleCard } from "./ChwShared"; // Removed ChwNav import
import { mockAppointments, mockPatients } from "./mock-data";
import type { ChwPageProps } from "./types";

// Extend the existing types to include your custom drill-down function
interface DashboardProps extends ChwPageProps {
  openPatient: (id: string) => void;
}

export function ChwDashboardPage({ navigate, openPatient }: DashboardProps) {
  return (
    <main className="screen chw-screen" style={{ paddingBottom: "80px" }}> 
      {/* paddingBottom ensures content isn't hidden behind the fixed wrapper Nav */}
      <div className="chw-head">
        <div>
          <p>TUESDAY, 18 JUNE</p>
          <h1>
            Good morning,
            <br />
            Grace
          </h1>
        </div>
        <button className="notification">
          <ChwIcon name="bell" />
          <i />
        </button>
      </div>

      <section className="day-summary">
        <div>
          <small>TODAY’S COVERAGE</small>
          <h2>{mockAppointments.length} mothers to see</h2>
          <p>First visit starts at 8:30 AM</p>
        </div>
        <span className="day-progress">
          <i />
          <b>1 of {mockAppointments.length}</b>
        </span>
      </section>

      <div className="section-title chw-section-title">
        <div>
          <p>YOUR SCHEDULE</p>
          <h2>Today’s appointments</h2>
        </div>
        {/* This navigate call will be intercepted by the wrapper */}
        <button onClick={() => navigate("chwVisits")}>View all</button>
      </div>

      <div className="dashboard-schedule">
        {mockAppointments.slice(0, 3).map((appointment) => (
          <ScheduleCard
            key={appointment.id}
            appointment={appointment}
            onClick={() => navigate("chwVisits")}
          />
        ))}
      </div>

      <div className="section-title chw-section-title patient-preview-title">
        <div>
          <p>REGISTERED TO YOU</p>
          <h2>My mothers</h2>
        </div>
        <button onClick={() => navigate("chwPatients")}>See all {mockPatients.length}</button>
      </div>

      <div className="patient-preview-grid">
        {mockPatients.slice(0, 3).map((patient) => (
          // Use openPatient with the specific ID here!
          <button key={patient.id} onClick={() => openPatient(patient.id)}>
            <span className="patient-avatar" style={{ background: patient.color }}>
              {patient.initials}
            </span>
            <div>
              <b>{patient.name.split(" ")[0]}</b>
              <small>{patient.week}</small>
            </div>
            <span
              className={`risk ${patient.high ? "high" : patient.risk === "Watch" ? "watch" : ""}`}
            >
              {patient.risk}
            </span>
          </button>
        ))}
      </div>
      {/* Removed <ChwNav /> from here */}
    </main>
  );
}