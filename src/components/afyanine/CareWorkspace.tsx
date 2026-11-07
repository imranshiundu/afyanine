"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import type { User } from "@supabase/supabase-js";
import type { CareAccount } from "@prisma/client";
import type { careRecord, careWorkspace } from "@/lib/care-workspace";
import { SCOPES, type Scope } from "@/lib/care-policy";
import { getSupabase } from "@/lib/supabase";
import { Header, ThemeToggle } from "./chrome";
import { Icon, type IconName } from "./Icon";
import { useLanguage } from "./language";
import { hasLanguagePreference } from "./language-store";
import { FindCare } from "./screens/FindCare";
import { InstallReminder } from "./InstallReminder";
import "./care-workspace.css";

type Wire<T> = T extends Date ? string : T extends Array<infer U> ? Wire<U>[] : T extends object ? { [K in keyof T]: Wire<T[K]> } : T;
type Ready = Exclude<Wire<Awaited<ReturnType<typeof careWorkspace>>>, { me: null }>;
type Payload = Omit<Partial<Ready>, "me"> & { me: Wire<CareAccount> | null };
type RecordData = Wire<Awaited<ReturnType<typeof careRecord>>>;
type Tab = "home" | "team" | "patients" | "visits" | "profile" | "care";
type Run = (command: Record<string, unknown>) => Promise<boolean>;

function Categories({ value, onChange, available = SCOPES }: { value: Scope[]; onChange: (next: Scope[]) => void; available?: readonly Scope[] }) {
  const { t } = useLanguage();
  return <fieldset className="team-categories"><legend>{t("Choose categories")}</legend>{SCOPES.map(scope => <label key={scope}><input type="checkbox" checked={value.includes(scope)} disabled={!available.includes(scope) || (scope === "NOTES" && !available.includes("VISITS"))} onChange={e => onChange(e.target.checked ? [...new Set([...value, scope, ...(scope === "NOTES" ? ["VISITS" as const] : [])])] : value.filter(item => item !== scope && !(scope === "VISITS" && item === "NOTES")))} />{t(scope)}</label>)}</fieldset>;
}
function ProfileForm({ me, run, name }: { me: Payload["me"]; run: Run; name: string }) {
  const { t, language, setLanguage } = useLanguage();
  const [displayName, setName] = useState(me?.displayName ?? name);
  const [phone, setPhone] = useState(me?.phone ?? "");
  const [role, setRole] = useState<"MOTHER" | "CHW" | "PARTNER">(me?.role ?? "MOTHER");
  const [institutionName, setInstitution] = useState(me?.institutionName ?? "");
  const [registrationNumber, setRegistration] = useState(me?.registrationNumber ?? "");
  const [institutionContact, setContact] = useState(me?.institutionContact ?? "");
  return <form className="profile-card account-form" onSubmit={e => { e.preventDefault(); void run({ action: "profile", displayName, phone, role, locale: language, institutionName, registrationNumber, institutionContact }); }}>
    <h2>{t(me ? "My profile" : "Set up your profile")}</h2>
    <label>{t("Display name")}<input required minLength={2} maxLength={80} value={displayName} onChange={e => setName(e.target.value)} autoComplete="name" /></label>
    <label>{t("Phone")}<input type="tel" maxLength={40} value={phone} onChange={e => setPhone(e.target.value)} autoComplete="tel" /></label>
    <p className="account-hint">{t("Your contacts are saved with your profile, not made public.")}</p>
    <label>{t("Role")}<select value={role} disabled={!!me} onChange={e => setRole(e.target.value as typeof role)}>{(["MOTHER", "CHW", "PARTNER"] as const).map(item => <option value={item} key={item}>{t(item)}</option>)}</select></label>
    {!me && <p className="account-hint">{t("Your role cannot be changed here after registration.")}</p>}
    {role === "CHW" && <><label>{t("Institution")}<input value={institutionName} required maxLength={150} onChange={e => setInstitution(e.target.value)} /></label><label>{t("Institution registration number")}<input value={registrationNumber} required maxLength={80} onChange={e => setRegistration(e.target.value)} /></label><label>{t("Institution contact")}<input value={institutionContact} required maxLength={120} onChange={e => setContact(e.target.value)} /></label></>}
    <label>{t("Language")}<select value={language} onChange={e => setLanguage(e.target.value as "EN" | "SW")}><option value="EN">English</option><option value="SW">Kiswahili</option></select></label>
    <button className="primary-button" type="submit">{t("Save profile")}</button>
  </form>;
}
function Consent({ me, run }: { me: NonNullable<Payload["me"]>; run: Run }) {
  const { t } = useLanguage();
  const [value, setValue] = useState<Scope[]>(me.storageScopes);
  return <section className="profile-card"><h2>{t("Storage consent")}</h2><p>{t("Choose categories to store. Sharing with other people is a separate decision.")}</p><Categories value={value} onChange={setValue} /><button className="primary-button" onClick={() => {
    const removed = me.storageScopes.some(scope => !value.includes(scope));
    if (removed && !window.confirm(t("Delete removed categories permanently? Deleting visits also deletes their notes."))) return;
    void run({ action: "consent", scopes: value, confirmDelete: removed });
  }}>{t("Save consent")}</button><button className="secondary-button danger-action" onClick={() => {
    if (window.confirm(t("Permanently delete your care data and revoke all connections? Your basic profile and Supabase sign-in account remain."))) void run({ action: "purge", confirmDelete: true });
  }}>{t("Delete care record")}</button></section>;
}
function InviteForm({ me, run }: { me: NonNullable<Payload["me"]>; run: Run }) {
  const { t } = useLanguage();
  const [email, setEmail] = useState("");
  const [value, setValue] = useState<Scope[]>([]);
  const chw = me.role === "CHW";
  return <form className="profile-card account-form" onSubmit={async e => { e.preventDefault(); if (await run({ action: "invite", email, kind: chw ? "CHW" : "PARTNER", scopes: value })) setEmail(""); }}>
    <h2>{t(chw ? "Request a mother connection" : "Invite your husband / partner")}</h2>
    <p>{t(chw ? "No access until the mother approves." : "Choose what your partner may view. Partners cannot edit records.")}</p>
    <label>{t("Recipient email")}<input type="email" required maxLength={254} value={email} onChange={e => setEmail(e.target.value)} /></label>
    <Categories value={value} onChange={setValue} available={chw ? SCOPES : me.storageScopes} />
    <button className="primary-button" disabled={!value.length || (chw && !me.verifiedAt)}>{t(chw ? "Send request" : "Send invitation")}</button>
    <p className="account-hint">{t("In-app requests only. No email or SMS is sent.")}</p>
    <p className="account-hint">{t("The recipient must sign in with that confirmed email to see the request.")}</p>
    {me.isDemo && <p className="account-hint">mother@care.example.test · partner@care.example.test</p>}
  </form>;
}
function Incoming({ invite, me, run }: { invite: NonNullable<Payload["incoming"]>[number]; me: NonNullable<Payload["me"]>; run: Run }) {
  const { t } = useLanguage();
  const [value, setValue] = useState<Scope[]>(invite.scopes.filter(scope => me.storageScopes.includes(scope)));
  return <section className="profile-card"><h3>{invite.requester.displayName}</h3><p>{t(invite.kind)} · {invite.requester.institutionName}</p>{invite.kind === "CHW" && <p>{t(invite.requester.verifiedAt ? "Active" : "Pending verification")} · {invite.requester.registrationNumber}</p>}
    {invite.kind === "CHW" && <p>{t("An approved CHW can schedule visits and add visit notes only in the categories you approve.")}</p>}
    {invite.kind === "CHW" ? <Categories value={value} onChange={setValue} available={invite.scopes.filter(scope => me.storageScopes.includes(scope))} /> : <p>{invite.scopes.map(t).join(" · ")} · {t("Read-only")}</p>}
    <div className="team-actions"><button className="primary-button" onClick={() => void run({ action: "respond", inviteId: invite.id, accept: true, scopes: value })}>{t(invite.kind === "CHW" ? "Approve selected access" : "Accept invitation")}</button><button className="secondary-button" onClick={() => void run({ action: "respond", inviteId: invite.id, accept: false, scopes: [] })}>{t("Decline")}</button></div>
  </section>;
}
function OwnRecordForms({ record, run }: { record: RecordData; run: Run }) {
  const { t } = useLanguage();
  const submit = (event: FormEvent<HTMLFormElement>, action: string) => {
    event.preventDefault(); const form = event.currentTarget;
    const fields: Record<string, unknown> = Object.fromEntries(new FormData(form));
    if (action === "vital") for (const key of ["systolic", "diastolic", "heartRate"]) fields[key] = Number(fields[key]);
    void run({ action, ...fields }).then(ok => { if (ok) form.reset(); });
  };
  return <>
    {record.scopes.includes("VITALS") && <form className="profile-card account-form" onSubmit={e => submit(e, "vital")}><h3>{t("Manual reading")}</h3>{([["systolic", "Systolic", 50, 300], ["diastolic", "Diastolic", 20, 200], ["heartRate", "Heart rate", 30, 250]] as const).map(([name, label, min, max]) => <label key={name}>{t(label)}<input name={name} type="number" min={min} max={max} required /></label>)}<button className="primary-button">{t("Add reading")}</button></form>}
    {record.scopes.includes("PREGNANCY") && <form className="profile-card account-form" onSubmit={e => submit(e, "pregnancy")}><label>{t("Due date")}<input name="dueDate" type="date" required /></label><button className="primary-button">{t("Save due date")}</button></form>}
    {record.scopes.includes("CONTACTS") && <form className="profile-card account-form" onSubmit={e => submit(e, "contact")}><h3>{t("Emergency contacts")}</h3>{[["name", "Name"], ["relationship", "Relationship"], ["phone", "Phone"], ["email", "Email"]].map(([name, label]) => <label key={name}>{t(label)}<input name={name} type={name === "email" ? "email" : name === "phone" ? "tel" : "text"} required={name !== "email"} maxLength={name === "email" ? 254 : 80} /></label>)}<p>{t("A contact entry does not grant app access or send an alert.")}</p><button className="primary-button">{t("Add contact")}</button></form>}
  </>;
}
function ScheduleForm({ motherId, run }: { motherId: string; run: Run }) {
  const { t } = useLanguage();
  return <form className="profile-card account-form" onSubmit={e => {
    e.preventDefault(); const form = e.currentTarget; const fields = new FormData(form);
    const start = new Date(`${fields.get("start")}:00+03:00`);
    if (!Number.isFinite(+start)) return;
    void run({ action: "schedule", motherId, startsAt: start.toISOString(), endsAt: new Date(+start + Number(fields.get("duration")) * 60000).toISOString(), place: fields.get("place") });
  }}><h3>{t("Schedule a visit")}</h3><label>{t("Start (Nairobi / EAT)")}<input type="datetime-local" name="start" required /></label><label>{t("Duration")}<select name="duration"><option value="30">30 min</option><option value="60">60 min</option><option value="90">90 min</option></select></label><label>{t("Place")}<input name="place" required maxLength={160} /></label><button className="primary-button">{t("Schedule")}</button></form>;
}

export function CareWorkspace({ user = null, demo = false, initialActor = "mother", initialTab = "home" }: { user?: User | null; demo?: boolean; initialActor?: "mother" | "chw" | "partner" | "admin"; initialTab?: Tab }) {
  const router = useRouter();
  const { t, language, locale, setLanguage } = useLanguage();
  const [actor, setActor] = useState<string>(initialActor);
  const [data, setData] = useState<Payload | null>(null);
  const [record, setRecord] = useState<RecordData | null>(null);
  const [selected, setSelected] = useState("");
  const [tab, setTab] = useState<Tab>(initialTab);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [failure, setFailure] = useState(false);
  const initialized = useRef("");
  const generation = useRef(0);
  const endpoint = demo ? `/api/demo/care-workspace?actor=${encodeURIComponent(actor)}` : "/api/care-workspace";
  const request = useCallback(async (command?: Record<string, unknown>, motherId?: string) => {
    const headers: Record<string, string> = {};
    if (!demo) {
      const session = await getSupabase()?.auth.getSession();
      if (!session?.data.session?.access_token) throw new Error("SIGN_IN_REQUIRED");
      headers.Authorization = `Bearer ${session.data.session.access_token}`;
    }
    if (command) headers["Content-Type"] = "application/json";
    const response = await fetch(endpoint + (motherId ? `${demo ? "&" : "?"}mother=${encodeURIComponent(motherId)}` : ""), { method: command ? "POST" : "GET", headers, body: command ? JSON.stringify(command) : undefined, cache: "no-store" });
    let body; try { body = await response.json(); } catch { throw new Error("WORKSPACE_UNAVAILABLE"); }
    if (!response.ok) throw new Error(body.error ?? "WORKSPACE_UNAVAILABLE");
    return body;
  }, [demo, endpoint]);
  const reload = useCallback(async () => {
    const version = generation.current;
    try {
      const result = await request() as Payload;
      if (version !== generation.current) return;
      setData(result); setFailure(false);
      setMessage(previous => ["WORKSPACE_UNAVAILABLE", "SIGN_IN_REQUIRED"].includes(previous) ? "" : previous);
      if (result.me && initialized.current !== result.me.id) {
        initialized.current = result.me.id;
        if (!demo || !hasLanguagePreference()) setLanguage(result.me.locale === "SW" ? "SW" : "EN");
      }
    } catch (error) { if (version === generation.current) { setRecord(null); setData(null); setFailure(true); setMessage(error instanceof Error ? error.message : "WORKSPACE_UNAVAILABLE"); } }
  }, [request, demo, setLanguage]);
  useEffect(() => {
    generation.current++; const version = generation.current;
    // Delay the initial external fetch so StrictMode cleanup cancels its replay.
    const initial = setTimeout(() => void reload(), 0);
    const refresh = () => { if (document.visibilityState === "visible" && version === generation.current) void reload(); };
    const timer = setInterval(refresh, 15000);
    window.addEventListener("focus", refresh);
    return () => { generation.current++; clearTimeout(initial); clearInterval(timer); window.removeEventListener("focus", refresh); };
  }, [reload]);
  const me = data?.me;
  const patients = (data?.access ?? []).filter(item => item.active && item.viewerId === me?.id);
  const patientsKey = patients.map(item => item.motherId + item.scopes.join(",")).join("|");
  const activeId = me?.role === "MOTHER" ? me.id : patients.some(item => item.motherId === selected) ? selected : patients[0]?.motherId ?? "";
  useEffect(() => {
    if (!activeId) return;
    let active = true;
    request(undefined, activeId).then(value => { if (active) setRecord(value); }).catch(() => { if (active) setRecord(null); });
    return () => { active = false; };
    // Data refresh rechecks permission; all patient-selection changes clear old data.
  }, [activeId, patientsKey, data, request]);
  const run: Run = async command => {
    if (busy) return false;
    setBusy(true); setMessage("");
    try { await request(command); await reload(); setMessage("Saved."); return true; }
    catch (error) { setMessage(error instanceof Error ? error.message : "WORKSPACE_UNAVAILABLE"); return false; }
    finally { setBusy(false); }
  };
  const date = (value: string) => new Date(value).toLocaleString(locale, { timeZone: "Africa/Nairobi", dateStyle: "medium", timeStyle: "short" });
  const signOut = async () => {
    if (!window.confirm(t("Sign out of this device?"))) return;
    setBusy(true);
    try {
      if (!demo) { const result = await getSupabase()?.auth.signOut({ scope: "local" }); if (!result || result.error) throw new Error("SIGN_IN_REQUIRED"); }
      router.replace(demo ? "/" : "/signed-out");
    } catch { setMessage("WORKSPACE_UNAVAILABLE"); setBusy(false); }
  };
  const navigation: [Tab, string, IconName][] = [["home", me?.role === "CHW" ? "Dashboard" : "Home", "home"], [me?.role === "MOTHER" ? "team" : "patients", me?.role === "MOTHER" ? "Care team" : "Patients", "people"], ["visits", "Visits", "calendar"], ["care", "Care", "pin"], ["profile", "Profile", "user"]];
  const showRecord = record && record.mother.id === activeId && <>
    <section className="profile-card"><h2>{record.mother.displayName}</h2><p>{t("Sharing is checked on every request.")}</p><p>{record.scopes.map(t).join(" · ") || "—"}</p>{record.mother.dueDate && <p>{t("Due date")}: {new Date(record.mother.dueDate).toLocaleDateString(locale, { timeZone: "Africa/Nairobi" })}</p>}{record.mother.phone && <p>{t("Phone")}: {record.mother.phone}</p>}
      {record.scopes.includes("VITALS") && <><h3>{t("Vitals")}</h3>{!record.vitals.length && <p>{t("No readings recorded")}</p>}{record.vitals.slice(0, 10).map(reading => <p key={reading.id}><strong>{reading.systolic}/{reading.diastolic} mmHg</strong> · {reading.heartRate} bpm<small className="team-meta">{date(reading.measuredAt)} · {t("Manual reading")}</small></p>)}</>}
      {record.contacts.map(contact => <p key={contact.id}>{contact.name} · {contact.relationship} · {contact.phone}</p>)}
    </section>
    {me?.role === "MOTHER" && <OwnRecordForms record={record} run={run} />}
    {me?.role === "CHW" && record.scopes.includes("VISITS") && patients.some(item => item.kind === "CHW" && item.motherId === activeId) && <ScheduleForm motherId={activeId} run={run} />}
    {record.visits.map(visit => <section className="profile-card" key={visit.id}><h3>{date(visit.startsAt)}</h3><p>{visit.place} · {t(visit.status)} · {visit.chw.displayName}</p>
      {((me?.id === visit.chwId || me?.id === visit.motherId) && visit.status === "SCHEDULED") && <div className="team-actions">
        {me?.id === visit.chwId && new Date(visit.startsAt) <= new Date() && <button className="secondary-button" onClick={() => void run({ action: "visitStatus", visitId: visit.id, status: "COMPLETED" })}>{t("Complete visit")}</button>}
        <button className="secondary-button" onClick={() => void run({ action: "visitStatus", visitId: visit.id, status: "CANCELLED" })}>{t("Cancel visit")}</button>
      </div>}
      {visit.notes?.map(note => <blockquote key={note.id}>{note.body}<small className="team-meta">{note.author.displayName} · {date(note.createdAt)}</small></blockquote>)}
      {me?.id === visit.chwId && me.verifiedAt && patients.some(item => item.kind === "CHW" && item.motherId === activeId) && record.scopes.includes("NOTES") && visit.status !== "CANCELLED" && <form className="account-form" onSubmit={e => { e.preventDefault(); const form = e.currentTarget; void run({ action: "note", visitId: visit.id, body: new FormData(form).get("body") }).then(ok => { if (ok) form.reset(); }); }}><label>{t("Visit note")}<textarea required name="body" maxLength={4000} /></label><p className="account-hint">{t("Notes are saved with your identity and visible to the mother.")}</p><button className="primary-button">{t("Add note")}</button></form>}
    </section>)}
  </>;
  return <div className="page"><div className="app-shell care-workspace-shell">
    {demo && <div className="team-demo-banner"><b>{t("Fictional care-team workspace")}</b><p>{t("Fictional actors and database records only. Not real account authentication.")}</p><p>{t("Public demo: do not enter real contact or health information. Anyone can switch these fictional personas.")}</p><label>{t("Demo actor")}<select value={actor} disabled={busy} onChange={e => { generation.current++; setData(null); setRecord(null); setSelected(""); setMessage(""); setActor(e.target.value); setTab("home"); }}>{[["mother", "Mother"], ["chw", "CHW"], ["partner", "Partner"], ["admin", "Verifier"]].map(([value, label]) => <option value={value} key={value}>{t(label)}</option>)}</select></label></div>}
    {tab === "care" ? <FindCare embedded navigate={screen => setTab(screen === "profile" ? "profile" : "home")} onProfile={() => setTab("profile")} chw={me?.role === "CHW"} /> : <main className="screen with-nav team-main">
      <Header title={t(tab === "home" ? me?.role === "CHW" ? "Dashboard" : "My care" : tab === "team" ? "Care team" : tab === "patients" ? "Patients" : tab === "visits" ? "Visits" : "My profile")} action={<ThemeToggle />} />
      <div className="team-status" aria-live="polite">{busy ? t("Please wait…") : message ? t(message) : null}</div>
      <fieldset className="team-workspace-fields" disabled={busy}>
      {failure ? <section className="profile-card"><button className="primary-button" onClick={() => void reload()}>{t("Refresh")}</button><button className="secondary-button" onClick={() => void signOut()}>{t(demo ? "End demo" : "Sign out")}</button></section> : !data ? <p role="status">{t("Loading…")}</p> : !me ? <ProfileForm me={null} name={typeof user?.user_metadata?.display_name === "string" ? user.user_metadata.display_name : ""} run={run} /> : <>
        {!data.clinicalEnabled && <p className="account-notice">{t("Clinical storage requires operator activation. Profile and connection setup remain available.")}</p>}
        {!!data.incoming?.length && tab !== "team" && <section className="account-notice" role="status"><b>{t("You have pending care requests")}: {data.incoming.length}</b><button className="secondary-button" onClick={() => setTab("team")}>{t("Review requests")}</button></section>}
        {tab === "home" && <><section className="team-welcome"><span className="eyebrow">{t(me.role)}</span><h1>{me.displayName}</h1><p>{me.institutionName}</p>{me.role === "CHW" && <p>{t(me.verifiedAt ? "Verified since" : "Pending verification")} {me.verifiedAt ? date(me.verifiedAt) : ""}</p>}</section>
          {data.stats && <section className="team-stats">{[[data.stats.activeMothers, "Active mothers"], [data.stats.completedVisits, "Recorded completed visits"], [data.stats.scheduledVisits, "Upcoming visits"]].map(([count, label]) => <div key={label}><strong>{count}</strong><span>{t(String(label))}</span></div>)}<p>{t("Measured work, not claimed clinical outcomes.")}</p></section>}
          <button className="secondary-button" onClick={() => setTab("team")}>{t("Inbox")} · {data.incoming?.length ?? 0}</button>
          <p className="account-hint">{t("This app does not dispatch emergency services.")} <a href="tel:112">{t("Call 112")}</a></p>
          {me.role === "MOTHER" && showRecord}
        </>}
        {(tab === "team" || (tab === "home" && me.role !== "MOTHER")) && <><h2>{t("Inbox")}</h2>{!data.incoming?.length && <p>{t("No pending requests")}</p>}{data.incoming?.map(invite => <Incoming key={invite.id} invite={invite} me={me} run={run} />)}{(me.role === "MOTHER" || me.role === "CHW") && <InviteForm me={me} run={run} />}<h2>{t("Your connections")}</h2>{data.access?.map(grant => <section className="profile-card" key={grant.id}><h3>{me.id === grant.motherId ? grant.viewer.displayName : grant.mother.displayName}</h3><p>{t(grant.kind)} · {t(grant.active ? "Active" : "Revoked")}</p><p>{grant.scopes.map(t).join(" · ")}</p>{me.role === "MOTHER" && grant.active && <button className="secondary-button danger-action" onClick={() => { if (window.confirm(t(grant.kind === "CHW" ? "Revoke this connection and cancel its scheduled visits?" : "Revoke this partner’s read-only access?"))) void run({ action: "revoke", accessId: grant.id }); }}>{t("Revoke access")}</button>}</section>)}<h2>{t("Sent requests")}</h2>{data.sent?.map(invite => <p key={invite.id}>{invite.targetEmail} · {t(invite.status)}</p>)}</>}
        {tab === "patients" && <><div className="team-patient-list">{!patients.length && <p>{t("No accepted connections yet")}</p>}{patients.map(grant => <button key={grant.id} className={`profile-card${activeId === grant.motherId ? " selected" : ""}`} onClick={() => setSelected(grant.motherId)}><b>{grant.mother.displayName}</b><small>{grant.scopes.map(t).join(" · ")}{grant.kind === "PARTNER" ? ` · ${t("Read-only")}` : ""}</small><span>{t("Open record")} →</span></button>)}</div>{showRecord}</>}
        {tab === "visits" && <>{!data.visits?.length && <p>{t("No visits recorded")}</p>}{data.visits?.map(visit => <button key={visit.id} className="profile-card team-visit-summary" onClick={() => { setSelected(visit.motherId); setTab(me.role === "MOTHER" ? "home" : "patients"); }}><b>{visit.mother.displayName}</b><p>{date(visit.startsAt)} · {visit.place}</p><span>{t(visit.status)} · {visit.chw.displayName}</span></button>)}</>}
        {tab === "profile" && <><ProfileForm me={me} run={run} name="" /><section className="profile-card"><p>{t("Email")}: {me.email}</p><p>{t("Joined")}: {date(me.createdAt)}</p>{me.role === "CHW" && <><p>{t("Registered institution")}: {me.institutionName}</p><p>{t(me.verifiedAt ? "Verified since" : "Pending verification")}: {me.verifiedAt ? date(me.verifiedAt) : "—"}</p><p>{t("Verification does not grant access. Each mother must approve.")}</p></>}</section>{me.role === "MOTHER" && <Consent key={me.storageScopes.join(",")} me={me} run={run} />}<button className="secondary-button danger-action" onClick={() => void signOut()}>{t(demo ? "End demo" : "Sign out")}</button><h2>{t("Activity history")}</h2>{!data.audit?.length && <p>{t("No activity recorded")}</p>}{data.audit?.map(event => <p key={event.id} className="team-audit">{t(event.action)}<small>{date(event.createdAt)} · {event.scopes.map(t).join(" · ")}</small></p>)}</>}
        {data.admin && (tab === "home" || tab === "profile") && <section className="profile-card"><h2>{t("CHW verification")}</h2><p>{t("Review identity and institutional registration outside the app before approving.")}</p>{data.reviews?.map(candidate => <section className="team-review" key={candidate.id}><h3>{candidate.displayName}</h3><p>{candidate.institutionName} · {candidate.registrationNumber} · {candidate.institutionContact}</p><button className="secondary-button" onClick={() => void run({ action: "verify", accountId: candidate.id, verified: !candidate.verifiedAt })}>{t(candidate.verifiedAt ? "Withdraw verification" : "Verify CHW and institution")}</button></section>)}</section>}
      </>}
      </fieldset>
    </main>}
    {me && <nav className="bottom-nav team-nav" aria-label={t("Primary")}>{navigation.map(([value, label, icon]) => <button key={value} type="button" className={tab === value || (tab === "team" && value === "patients") ? "active" : ""} aria-current={tab === value ? "page" : undefined} onClick={() => setTab(value)}><Icon name={icon} size={21} /><span>{t(label)}</span></button>)}</nav>}
    <InstallReminder raised suppressed={tab === "profile" || demo} />
  </div></div>;
}
