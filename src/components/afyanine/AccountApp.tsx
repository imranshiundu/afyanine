"use client";
import { useState, type FormEvent } from "react";
import { useAccountLive, requestJson, sessionChanged, type AccountUser, type LiveRecord, type LiveSnapshot } from "./account-live";
import { ChwDashboard } from "./screens/ChwDashboard";
import { Home } from "./screens/Home";
import { Vitals } from "./screens/Vitals";
import { BottomNav, Header, ThemeToggle } from "./chrome";
import { Icon } from "./Icon";
import { useSosSound } from "./useSosSound";
import { EMERGENCY_TYPES, type Screen } from "./data";
import type { MotherSnapshot, Patient, PatientsPayload } from "./api";
import type { Scope } from "@/lib/care-policy";
import "./account-pages.css";

const CATEGORIES: Scope[] = ["VITALS", "PREGNANCY", "VISITS", "NOTES", "CONTACTS"];
const initials = (name: string) => name.split(/\s+/).map(n => n[0]).slice(0, 2).join("").toUpperCase();
const risk = (record: LiveRecord | null): Patient["risk"] => {
  const vital = record?.vitals[0];
  return !vital ? "Not recorded" : vital.systolic >= 140 || vital.diastolic >= 90 ? "High Risk" : vital.systolic >= 130 || vital.diastolic >= 85 ? "Watch" : "Normal";
};
const week = (due?: string | null) => due ? Math.max(0, Math.min(42, Math.floor(40 - (new Date(due).getTime() - Date.now()) / 604800000))) : null;
function motherSnapshot(record: LiveRecord, name: string): MotherSnapshot {
  const readings = [...record.vitals].reverse(), current = record.vitals[0], due = record.mother.dueDate;
  const series = {
    labels: readings.map(r => new Date(r.measuredAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })),
    systolic: readings.map(r => r.systolic), diastolic: readings.map(r => r.diastolic), heart: readings.map(r => r.heartRate),
    bpInsight: `${readings.length} saved readings. ${current?.source === "SIMULATED_BAND" ? "Simulated bound-band data, not clinical measurements." : "Manually recorded data."}`,
    hrSummary: "Saved measurements",
  };
  const appointment = record.visits.filter(v => v.status === "SCHEDULED" && new Date(v.startsAt) > new Date()).sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0];
  return {
    mother: { code: record.mother.id, fullName: name, firstName: name.split(" ")[0], device: record.band?.serial ?? "No band", sizeNote: due ? "Based on your saved due date" : "Add a due date in Profile", week: week(due) ?? 0, totalWeeks: 40, daysLeft: due ? Math.max(0, Math.ceil((+new Date(due) - Date.now()) / 86400000)) : 0, trimester: due ? `Week ${week(due)}` : "Due date not recorded" },
    appointment: appointment ? { label: "NEXT VISIT", place: appointment.place, scheduledAt: appointment.startsAt } : null,
    current: { systolic: current?.systolic ?? 0, diastolic: current?.diastolic ?? 0, heartRate: current?.heartRate ?? 0, heartLow: current?.heartRate ?? 0, heartHigh: current?.heartRate ?? 0, device: record.band?.serial ?? "Manual records", synced: current ? new Date(current.measuredAt).toLocaleString() : "No readings yet" },
    series: { Hourly: series, Daily: series, Weekly: series },
  };
}
export function AccountApp({ user }: { user: AccountUser }) {
  const { data, mode, error, updatedAt, refresh, command } = useAccountLive();
  const [tab, setTab] = useState<Screen>(user.user_metadata.afyanine_role === "CHW" ? "chw" : "home");
  const [selected, setSelected] = useState("");
  const [adding, setAdding] = useState(false);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);
  const workspace = data?.workspace;
  const me = workspace?.me;
  const isChw = user.user_metadata.afyanine_role === "CHW";
  const alerts = workspace?.alerts ?? [];
  const sound = useSosSound(isChw && alerts.some(a => a.status === "raised"));
  const notify = (text: string) => setMessage(text);
  const run = async (body: unknown) => {
    if (busy) return;
    setBusy(true); setMessage("");
    try { await command(body); setMessage("Saved."); }
    catch (e) { setMessage((e as Error).message); throw e; }
    finally { setBusy(false); }
  };
  const perform = (body: unknown) => { void run(body).catch(() => {}); };
  const addMother = () => { setAdding(true); setTab("patients"); };
  const openPatient = (id: string) => { setSelected(id); setTab("patient"); };
  const patients: Patient[] = (workspace?.access ?? []).filter(g => g.active && g.viewerId === user.id).map(g => {
    const record = data?.records[g.motherId] ?? null, vital = record?.vitals[0];
    return { id: g.motherId, name: g.mother.displayName, initials: initials(g.mother.displayName), color: "#a8bba5", age: 0, week: record?.mother.dueDate ? `${week(record.mother.dueDate)} weeks` : "Due date not shared", bp: vital ? `${vital.systolic}/${vital.diastolic}` : "—", systolic: vital?.systolic ?? 0, diastolic: vital?.diastolic ?? 0, risk: risk(record) };
  });
  const payload: PatientsPayload = {
    patients, chw: { firstName: me?.displayName.split(" ")[0] ?? user.user_metadata.display_name.split(" ")[0], stats: { patients: patients.length, attention: patients.filter(p => p.risk === "High Risk" || p.risk === "Watch").length, visits: (workspace?.visits ?? []).filter(v => new Date(v.startsAt).toDateString() === new Date().toDateString() && v.status !== "CANCELLED").length } },
    emergency: alerts[0] ? { kind: alerts[0].kind, who: alerts[0].motherName, where: alerts[0].status === "ack" ? "Acknowledged · no dispatch confirmed" : "Awaiting acknowledgement", motherCode: alerts[0].motherId } : null,
  };
  const ownRecord = data?.records[user.id];
  const patientRecord = data?.records[selected];
  const logout = async () => { await requestJson("/api/account", "DELETE"); sessionChanged(); };
  const navigate = (next: Screen) => setTab(!isChw && next === "sos" && alerts.length ? "tracking" : next);
  const nav = isChw ? <ChwNav active={tab} navigate={navigate} add={addMother} /> : <BottomNav active={tab} navigate={navigate} onProfile={() => setTab("profile")} />;
  const header = (title: string) => <Header title={title} onBack={() => setTab(isChw ? "chw" : "home")} action={<ThemeToggle />} />;
  return <div className="page"><div className="app-shell account-shell">
    <div className="account-live-status" role="status"><span>{mode === "live" ? "● Live" : mode === "offline" ? "Offline · cached records" : "Connecting…"}{updatedAt ? ` · ${new Date(updatedAt).toLocaleTimeString()}` : ""}</span><button type="button" onClick={() => void refresh()}>Refresh</button></div>
    {error && <p className="account-error" role="alert">{error}</p>}
    {message && <p className="account-error" role="status">{message}</p>}
    {!me ? <main className="screen"><p>{error ? "Your saved account could not be loaded. No demo records are substituted." : "Loading your saved account…"}</p><button onClick={() => void refresh()}>Retry</button><button onClick={() => void logout()}>Sign out</button></main> : <>
      {isChw && tab === "chw" && <ChwDashboard payload={payload} navigate={next => { if (next === "tracking" && alerts[0]) openPatient(alerts[0].motherId); else setTab(next); }} openPatient={openPatient} notify={notify} onAddMother={addMother} onLogout={() => setTab("profile")} onResolve={() => { if (alerts[0]) perform({ action: "resolveAlert", alertId: alerts[0].id }); }}><section><button className="account-switch" onClick={() => void sound.enable().catch(() => notify("Audio permission was not granted. Visual SOS alerts remain available."))}>{sound.enabled ? "SOS sound enabled while app is open" : "Enable SOS sound"}</button>{alerts.map(alert => <article className="account-card" key={alert.id}><b>{alert.motherName} · {alert.kind}</b><p>{alert.status === "ack" ? "Acknowledged" : "Awaiting acknowledgement"} · {new Date(alert.createdAt).toLocaleString()}</p><div className="account-actions"><button disabled={busy || alert.status === "ack"} onClick={() => perform({ action: "ackAlert", alertId: alert.id })}>Acknowledge</button><button disabled={busy} onClick={() => perform({ action: "resolveAlert", alertId: alert.id })}>Resolve SOS</button></div><button onClick={() => openPatient(alert.motherId)}>Open patient</button></article>)}</section></ChwDashboard>}
      {isChw && tab === "patients" && <main className="screen account-page">{header("Patients")}<div className="section-title"><h2>My patients</h2><button onClick={addMother}>Add mother</button></div>{adding && <form className="account-fields" onSubmit={e => { e.preventDefault(); const email = String(new FormData(e.currentTarget).get("email")); void run({ action: "invite", email, kind: "CHW", scopes: CATEGORIES }).then(() => { setAdding(false); setMessage("Request saved. The mother must sign in and accept it."); }).catch(() => {}); }}><label>Mother’s email<input name="email" type="email" required autoComplete="off" placeholder="mother@example.com" /></label><p className="account-notice">No patient data is shared until she accepts the request in her account. Requests are in-app; email delivery is not configured.</p><button className="primary-button" disabled={busy}>Send connection request</button></form>}<PatientList patients={patients} open={openPatient} />{patients.length === 0 && <p className="account-notice">No connected mothers yet. Add a mother by email and wait for her approval.</p>}<h3>Sent requests</h3>{workspace.sent?.map(invite => <article className="account-card" key={invite.id}><b>{invite.targetEmail ?? invite.targetPhone}</b><p>{invite.status.toLowerCase()} · expires {new Date(invite.expiresAt).toLocaleDateString()}</p></article>)}{nav}</main>}
      {tab === "patient" && <main className="screen account-page">{header("Patient")}{patientRecord ? <><RecordCard record={patientRecord} /><button className="primary-button" onClick={() => setTab("visits")}>Visits and notes</button></> : <p className="account-notice">This record is unavailable or access has changed. Refresh to check your permissions.</p>}{nav}</main>}
      {tab === "visits" && <main className="screen account-page">{header("Visits")}{isChw && <form className="account-fields" onSubmit={e => { e.preventDefault(); const form = new FormData(e.currentTarget); const start = new Date(String(form.get("startsAt"))); void run({ action: "schedule", motherId: form.get("mother"), startsAt: start.toISOString(), endsAt: new Date(start.getTime() + 3600000).toISOString(), place: form.get("place") }).catch(() => {}); }}><label>Mother<select name="mother" required defaultValue={selected}><option value="">Select a connected mother</option>{patients.filter(p => data?.records[p.id]?.scopes.includes("VISITS")).map(p => <option value={p.id} key={p.id}>{p.name}</option>)}</select></label><label>Visit date and time (your device timezone)<input type="datetime-local" name="startsAt" required /></label><label>Location<input name="place" required minLength={2} maxLength={160} /></label><button className="primary-button" disabled={busy}>Schedule visit</button></form>}
        {!workspace.visits?.length && <p className="account-notice">No saved visits.</p>}{workspace.visits?.map(visit => {
          const detail = data?.records[visit.motherId]?.visits.find(v => v.id === visit.id);
          return <article key={visit.id} className="account-card"><h3>{visit.mother.displayName}</h3><p>{new Date(visit.startsAt).toLocaleString()} · {visit.place}</p><p>{visit.status.toLowerCase()} · {visit.chw.displayName}</p>{isChw && visit.status === "SCHEDULED" && <div className="account-actions"><button disabled={busy} onClick={() => perform({ action: "visitStatus", visitId: visit.id, status: "COMPLETED" })}>Mark completed</button><button disabled={busy} onClick={() => perform({ action: "visitStatus", visitId: visit.id, status: "CANCELLED" })}>Cancel visit</button></div>}{detail?.notes.map(note => <p key={note.id}><b>{note.author.displayName}</b>: {note.body}</p>)}{isChw && data?.records[visit.motherId]?.scopes.includes("NOTES") && <form className="account-fields" onSubmit={e => { e.preventDefault(); const form = e.currentTarget; void run({ action: "note", visitId: visit.id, body: new FormData(form).get("body") }).then(() => form.reset()).catch(() => {}); }}><label>Visit note<textarea name="body" required maxLength={4000} /></label><button disabled={busy}>Save note</button></form>}</article>;
        })}{nav}</main>}
      {tab === "profile" && <main className="screen account-page">{header("Profile")}<Profile user={user} data={data!} busy={busy} run={run} refresh={refresh} logout={logout} />{nav}</main>}
      {!isChw && tab === "home" && (ownRecord ? <Home snapshot={motherSnapshot(ownRecord, me.displayName)} navigate={navigate} notify={notify} onProfile={() => setTab("profile")} accountMode dueDateKnown={!!me.dueDate} onNotifications={() => setTab("profile")}>{!!workspace.incoming?.length && <button className="primary-button" onClick={() => setTab("profile")}>{workspace.incoming.length} connection request(s) · Review</button>}</Home> : <main className="screen account-page">{header(me.displayName)}<p className="account-notice">Your record is unavailable. No demo data is substituted.</p>{nav}</main>)}
      {!isChw && tab === "vitals" && (ownRecord?.vitals.length ? <Vitals snapshot={motherSnapshot(ownRecord, me.displayName)} navigate={navigate} notify={notify} accountMode><BandForm record={ownRecord} busy={busy} run={run} /></Vitals> : <main className="screen account-page">{header("My vitals")}<p className="account-notice">No saved readings. Bind a simulated band below to generate clearly labelled band data. No other records are simulated.</p><BandForm record={ownRecord} busy={busy} run={run} />{nav}</main>)}
      {!isChw && tab === "care" && <main className="screen account-page">{header("My care team")}<p className="account-notice">Your approved care contacts. Calls open your phone’s SIM dialler; AfyaNine does not place or pay for calls.</p>{workspace.access?.filter(g => g.active && g.motherId === user.id).map(g => <article className="account-card" key={g.id}><h3>{g.viewer.displayName}</h3><p>{g.viewer.institutionName || "Community health worker"} · {g.viewer.verifiedAt ? "Verified" : "Credentials not verified"}</p>{g.viewer.phone ? <a href={`tel:${g.viewer.phone}`}><Icon name="phone" /> Call {g.viewer.phone}</a> : <p>No phone number shared.</p>}</article>)}<a href="tel:999">Emergency services: 999</a>{nav}</main>}
      {!isChw && tab === "sos" && <main className="screen sos-screen">{header("Emergency SOS")}<h1>Is this an emergency?</h1><p className="account-notice">Sending SOS saves your request and shares emergency details with your approved CHWs and authorized operations staff. It does not automatically dispatch an ambulance. Call 999 or112 for immediate emergency services.</p>{EMERGENCY_TYPES.map(kind => <button key={kind.title} className="sos-option" disabled={busy} onClick={() => { void run({ action: "sos", kind: kind.title }).then(() => setTab("tracking")).catch(() => {}); }}><span className="emergency-icon"><Icon name={kind.icon} /></span><span className="sos-copy"><b>{kind.title}</b><small>Send and save SOS</small></span><Icon name="chevron" /></button>)}<div className="account-actions"><a href="tel:999">Call999</a><a href="tel:112">Call112</a></div></main>}
      {!isChw && tab === "tracking" && <main className="screen account-page">{header("SOS status")}{alerts.length ? alerts.map(alert => <article className="account-card" key={alert.id}><h2>{alert.kind}</h2><p>{alert.status === "ack" ? "Acknowledged by your care team" : "Saved · waiting for acknowledgement"}</p><p>Sent {new Date(alert.createdAt).toLocaleString()}</p><p>No ambulance dispatch or arrival time has been confirmed.</p><button disabled={busy} onClick={() => perform({ action: "resolveAlert", alertId: alert.id })}>Mark SOS resolved</button></article>) : <p className="account-notice">No active SOS. A previously active request may have been resolved by your care team.</p>}<div className="account-actions"><a href="tel:999">Call999</a><a href="tel:112">Call112</a></div>{nav}</main>}
    </>}
  </div></div>;
}
function ChwNav({ active, navigate, add }: { active: Screen; navigate: (screen: Screen) => void; add: () => void }) {
  return <nav className="chw-nav" aria-label="CHW navigation">{([{ tab: "chw", icon: "home", label: "Dashboard" }, { tab: "patients", icon: "people", label: "Patients" }] as const).map(item => <button key={item.tab} className={active === item.tab ? "active" : ""} onClick={() => navigate(item.tab)}><Icon name={item.icon} /><span>{item.label}</span></button>)}<button className="add-patient" aria-label="Add mother" onClick={add}><Icon name="plus" /></button>{([{ tab: "visits", icon: "calendar", label: "Visits" }, { tab: "profile", icon: "user", label: "Profile" }] as const).map(item => <button key={item.tab} className={active === item.tab ? "active" : ""} onClick={() => navigate(item.tab)}><Icon name={item.icon} /><span>{item.label}</span></button>)}</nav>;
}
function PatientList({ patients, open }: { patients: Patient[]; open: (id: string) => void }) {
  const [query, setQuery] = useState("");
  return <><div className="search-box"><Icon name="search" /><input aria-label="Search connected patients" placeholder="Search patients" value={query} onChange={e => setQuery(e.target.value)} /></div><div className="patient-list">{patients.filter(p => p.name.toLowerCase().includes(query.toLowerCase())).map(p => <button className="patient-row" key={p.id} onClick={() => open(p.id)}><span className="patient-avatar" style={{ background: p.color }}>{p.initials}</span><span className="patient-info"><h3>{p.name}</h3><p>{p.week} · BP {p.bp}</p></span><span className={`risk ${p.risk === "High Risk" ? "high" : p.risk === "Watch" ? "watch" : ""}`}>{p.risk}</span><Icon name="chevron" /></button>)}</div></>;
}
function RecordCard({ record }: { record: LiveRecord }) {
  const vital = record.vitals[0];
  return <article className="account-card"><h2>{record.mother.displayName}</h2><p>{record.mother.email ?? "Email not shared"}</p>{record.mother.phone && <a href={`tel:${record.mother.phone}`}><Icon name="phone" /> Call {record.mother.phone}</a>}<p>Due date: {record.mother.dueDate ? new Date(record.mother.dueDate).toLocaleDateString() : "Not recorded or not shared"}</p>{vital ? <><p>BP {vital.systolic}/{vital.diastolic} mmHg · HR {vital.heartRate} bpm</p><p>{new Date(vital.measuredAt).toLocaleString()} · {vital.source === "SIMULATED_BAND" ? "Simulated bound-band reading" : "Manual reading"}</p></> : <p>No recorded or shared vitals.</p>}</article>;
}
function BandForm({ record, busy, run }: { record: LiveRecord | null | undefined; busy: boolean; run: (body: unknown) => Promise<void> }) {
  return <article className="account-card"><h3>AfyaBand simulator</h3><p>Only readings generated after binding are simulated. No SOS, visits, patients, or operations activity is generated.</p>{record?.band ? <><p>Bound: {record.band.serial}</p><button disabled={busy} onClick={() => void run({ action: "unbindBand" }).catch(() => {})}>Unbind band</button></> : <form className="account-fields" onSubmit={e => { e.preventDefault(); void run({ action: "bindBand", serial: String(new FormData(e.currentTarget).get("serial")).toUpperCase() }).catch(() => {}); }}><label>Simulation band ID<input name="serial" placeholder="SIM-YOUR-BAND-ID" pattern="SIM-[A-Z0-9-]{4,40}" required /></label><button className="primary-button" disabled={busy || !record?.scopes.includes("VITALS")}>Bind simulated band</button>{!record?.scopes.includes("VITALS") && <p>Enable Vitals storage in Profile first.</p>}</form>}</article>;
}
function Profile({ user, data, busy, run, refresh, logout }: { user: AccountUser; data: LiveSnapshot; busy: boolean; run: (body: unknown) => Promise<void>; refresh: () => Promise<void>; logout: () => Promise<void> }) {
  const me = data.workspace.me!;
  const [scopes, setScopes] = useState<Scope[]>(me.storageScopes);
  const [notice, setNotice] = useState("");
  const saveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault(); const form = new FormData(event.currentTarget); setNotice("");
    try { await requestJson("/api/account-profile", "PATCH", { name: form.get("name"), phone: form.get("phone") }); await refresh(); setNotice("Profile saved."); }
    catch (e) { setNotice((e as Error).message); }
  };
  return <><p className="account-notice">{user.email} · {me.role === "CHW" ? "Community health worker" : "Mother"} · Email not verified</p>{notice && <p role="status">{notice}</p>}<form className="account-fields" onSubmit={e => void saveProfile(e)}><label>Name<input name="name" defaultValue={me.displayName} required minLength={2} maxLength={80} /></label><label>Phone<input name="phone" type="tel" defaultValue={me.phone ?? ""} required /></label><button className="primary-button">Save profile</button></form>
    {me.role === "MOTHER" && <><h3>Data storage consent</h3><p className="account-notice">Choose what is saved. Removing a category permanently deletes its stored records and related access; this cannot be undone.</p><div className="account-fields">{CATEGORIES.map(scope => <label className="consent-check" key={scope}><input type="checkbox" checked={scopes.includes(scope)} onChange={e => setScopes(prior => e.target.checked ? [...new Set([...prior, scope, ...(scope === "NOTES" ? ["VISITS" as Scope] : [])])] : prior.filter(s => s !== scope && !(scope === "VISITS" && s === "NOTES")))} />{scope.toLowerCase()}</label>)}<button disabled={busy} className="primary-button" onClick={() => { const removing = me.storageScopes.some(s => !scopes.includes(s)); if (!removing || window.confirm("Permanently delete data in removed categories and revoke that access?")) void run({ action: "consent", scopes, confirmDelete: removing }).catch(() => {}); }}>Save storage choices</button></div>
      {me.storageScopes.includes("PREGNANCY") && <form className="account-fields" onSubmit={e => { e.preventDefault(); void run({ action: "pregnancy", dueDate: new FormData(e.currentTarget).get("dueDate") }).catch(() => {}); }}><label>Expected due date<input name="dueDate" type="date" defaultValue={me.dueDate?.slice(0, 10)} required /></label><button disabled={busy}>Save due date</button></form>}
      <h3>Operations data sharing</h3><p className="account-notice">Optional: share your saved vitals and name with authorized operations staff. SOS always shares emergency details when you explicitly send it.</p><label className="account-notice"><input type="checkbox" checked={me.opsConsent} disabled={busy} onChange={e => void run({ action: "opsConsent", enabled: e.target.checked }).catch(() => {})} /> Share consented vitals with operations</label>
      <h3>Connection requests</h3>{data.workspace.incoming?.length ? data.workspace.incoming.map(invite => <article className="account-card" key={invite.id}><h3>{invite.requester.displayName}</h3><p>{invite.requester.institutionName || "Community health worker"} · credentials {invite.requester.verifiedAt ? "verified" : "not verified"}</p><p>Requests access to: {invite.scopes.map(s => s.toLowerCase()).join(", ")}. Accepting shares the categories selected above, including your phone/email when contacts is selected.</p><div className="account-actions"><button disabled={busy || !scopes.some(s => invite.scopes.includes(s))} onClick={() => void (async () => { const selected = scopes.filter(s => invite.scopes.includes(s)); await run({ action: "consent", scopes: [...new Set([...me.storageScopes, ...selected])] }); await run({ action: "respond", inviteId: invite.id, accept: true, scopes: selected }); })().catch(() => {})}>Accept selected categories</button><button disabled={busy} onClick={() => void run({ action: "respond", inviteId: invite.id, accept: false, scopes: [] }).catch(() => {})}>Decline</button></div></article>) : <p className="account-notice">No pending requests. Give your account email to your CHW.</p>}
      <h3>Connected care team</h3>{data.workspace.access?.filter(g => g.active).map(g => <article className="account-card" key={g.id}><b>{g.viewer.displayName}</b><p>{g.scopes.map(s => s.toLowerCase()).join(", ")}</p><button disabled={busy} onClick={() => { if (window.confirm("Revoke this connection? Scheduled visits with this CHW will be cancelled.")) void run({ action: "revoke", accessId: g.id }).catch(() => {}); }}>Revoke access</button></article>)}
    </>}
    <button className="account-switch" onClick={() => void logout()}>Sign out</button></>;
}
