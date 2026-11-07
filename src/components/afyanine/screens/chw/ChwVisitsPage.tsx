import { useState } from "react";
import { ChwIcon, ChwPageHeader } from "./ChwShared"; // Removed ChwNav import
import { mockAppointments } from "./mock-data";
import type { ChwPageProps, VisitNotes } from "./types";

interface ChwVisitsPageProps extends ChwPageProps {
  notes: VisitNotes;
  saveNote: (appointmentId: string, note: string) => void;
  openPatient: (id: string) => void; // Added drill-down function for the note panel
}

export function ChwVisitsPage({ navigate, notify, notes, saveNote, openPatient }: ChwVisitsPageProps) {
  const [selectedId, setSelectedId] = useState(mockAppointments[0].id);
  const selected = mockAppointments.find((appointment) => appointment.id === selectedId)!;
  const [draft, setDraft] = useState(notes[selectedId] || "");

  const selectVisit = (id: string) => {
    setSelectedId(id);
    setDraft(notes[id] || "");
  };

  return (
    <main className="screen chw-screen visits-screen" style={{ paddingBottom: "80px" }}>
      <ChwPageHeader eyebrow="TUESDAY, 18 JUNE" title="Visits & notes" />
      <div className="date-strip">
        {[
          ["M", "17"],
          ["T", "18"],
          ["W", "19"],
          ["T", "20"],
          ["F", "21"],
        ].map(([day, date]) => (
          <button key={`${day}-${date}`} className={date === "18" ? "active" : ""}>
            <span>{day}</span>
            <b>{date}</b>
          </button>
        ))}
      </div>
      <div className="section-title chw-section-title visits-title">
        <div>
          <p>{mockAppointments.length} APPOINTMENTS</p>
          <h2>Today’s schedule</h2>
        </div>
      </div>
      <div className="visits-list">
        {mockAppointments.map((appointment) => (
          <button
            key={appointment.id}
            className={selectedId === appointment.id ? "active" : ""}
            onClick={() => selectVisit(appointment.id)}
          >
            <span>{appointment.time}</span>
            <div>
              <b>{appointment.name}</b>
              <small>{appointment.type}</small>
            </div>
            {notes[appointment.id] && <ChwIcon name="check" size={15} strokeWidth={3} />}
          </button>
        ))}
      </div>
      <section className="visit-note-panel">
        <div className="visit-note-head">
          <span className="patient-avatar">{selected.initials}</span>
          <div>
            <small>VISIT NOTE FOR</small>
            <h3>{selected.name}</h3>
            <p>{selected.type}</p>
          </div>
          {/* Changed navigate("patient") to openPatient using the appointment's tied ID */}
          <button onClick={() => openPatient((selected as any).patientId || selected.id)}>
            <ChwIcon name="chevron" size={18} />
          </button>
        </div>
        <label htmlFor="visit-note">Notes shared with mother</label>
        <textarea
          id="visit-note"
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="Add observations, advice, medication or next steps..."
        />
        <div className="note-sharing">
          <ChwIcon name="check" size={14} />
          <span>The selected mother can view this note in her care updates</span>
        </div>
        <button
          className="primary-button"
          onClick={() => {
            if (!draft.trim()) {
              notify("Add a note before saving");
              return;
            }
            saveNote(selectedId, draft.trim());
            notify("Visit note saved and shared with mother");
          }}
        >
          Save visit note <ChwIcon name="check" size={18} />
        </button>
      </section>
      {/* Removed ChwNav component from here */}
    </main>
  );
}