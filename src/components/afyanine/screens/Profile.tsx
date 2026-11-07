"use client";

import { useState, type FormEvent } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabase } from "@/lib/supabase";
import { BottomNav, Header, ThemeToggle } from "../chrome";
import { Icon } from "../Icon";
import type { Screen } from "../data";
import type { DemoSession } from "../account-session";
import type { MotherSnapshot } from "../api";

export function Profile({ user, demo, snapshot, navigate, onGenerate }: {
  user: User | null; demo: DemoSession | null; snapshot: MotherSnapshot | null;
  navigate: (screen: Screen) => void; onGenerate: () => Promise<boolean>;
}) {
  const storedName = typeof user?.user_metadata?.display_name === "string" ? user.user_metadata.display_name : "";
  const [name, setName] = useState(storedName);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const title = user ? storedName || "Your account" : demo?.role === "chw" ? "Grace · fictional CHW" : snapshot?.mother.fullName ?? "Fictional mother";
  async function save(event: FormEvent) {
    event.preventDefault();
    const sb = getSupabase();
    if (!sb || busy || !user) return;
    setBusy(true); setMessage(""); setError("");
    try {
      const { error } = await sb.auth.updateUser({ data: { display_name: name.trim().slice(0, 80) } });
      if (error) throw error;
      setMessage("Profile saved.");
    } catch { setError("Profile could not be saved. Check your session and try again."); }
    finally { setBusy(false); }
  }
  return (
    <main className="screen with-nav profile-screen">
      <Header title="My profile" onBack={() => navigate(demo?.role === "chw" ? "chw" : "home")} action={<ThemeToggle />} />
      <section className="profile-hero"><span className="profile-avatar"><Icon name="user" size={38} /></span><h1>{title}</h1><p>{user ? "Supabase account" : "Test Ward · fictional data only"}</p></section>
      {user ? <form className="account-form profile-card" onSubmit={save}>
        <label>Display name<input value={name} maxLength={80} onChange={e => setName(e.target.value)} autoComplete="name" required /></label>
        <dl className="profile-details"><div><dt>Email</dt><dd>{user.email ?? "Not available"}</dd></div><div><dt>Email status</dt><dd>{user.email_confirmed_at ? "Confirmed" : "Awaiting confirmation"}</dd></div><div><dt>Joined</dt><dd>{new Date(user.created_at).toLocaleDateString("en-KE")}</dd></div></dl>
        <p className="account-hint">A clinical record has not been linked. This profile does not grant CHW access.</p>
        {message && <p role="status">{message}</p>}{error && <p className="account-error" role="alert">{error}</p>}
        <button className="primary-button" disabled={busy} type="submit">{busy ? "Saving…" : "Save profile"}</button>
      </form> : <section className="profile-card">
        <dl className="profile-details"><div><dt>Persona</dt><dd>{demo?.role === "chw" ? "Community health worker" : "Mother"}</dd></div><div><dt>Ward ID</dt><dd>{demo?.role === "chw" ? "Fictional ward" : demo?.code}</dd></div><div><dt>Session</dt><dd>Restored on reload in this tab</dd></div></dl>
        <p>These are simulated records, not a medical service. The ward refreshes every 30 seconds while this tab is visible.</p>
        {demo?.role === "mother" && <><p>Generate at most one fictional reading every 30 seconds.</p><button className="secondary-button" disabled={busy} onClick={async () => { setBusy(true); const ok = await onGenerate(); setMessage(ok ? "Latest fictional reading loaded." : "Could not generate a reading. Please retry."); setBusy(false); }}> {busy ? "Updating…" : "Generate fictional reading"}</button></>}
        {message && <p role="status">{message}</p>}
      </section>}
      <button className="secondary-button danger-action" onClick={() => navigate("logout")}><Icon name="back" size={18} />{user ? "Sign out of this device" : "End demo session"}</button>
      <BottomNav active="profile" navigate={navigate} onProfile={() => navigate("profile")} chw={demo?.role === "chw"} />
    </main>
  );
}

export function Logout({ account, onConfirm, onCancel }: { account: boolean; onConfirm: () => Promise<void>; onCancel: () => void }) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  return <main className="screen logout-screen"><Header title="Sign out" onBack={onCancel} /><section className="profile-card"><Icon name="user" size={42} /><h1>{account ? "Sign out of this device?" : "End this demo session?"}</h1><p>{account ? "Your profile stays in Supabase. You’ll need your email and password to sign in again." : "The selected fictional persona will be cleared from this tab."}</p><button type="button" className="primary-button" disabled={busy} onClick={async () => { setBusy(true); setError(""); try { await onConfirm(); } catch { setError("Could not sign out. Check your connection and try again."); setBusy(false); } }}>{busy ? "Signing out…" : "Confirm sign out"}</button><button className="secondary-button" disabled={busy} onClick={onCancel}>Stay signed in</button>{error && <p className="account-error" role="alert">{error}</p>}</section></main>;
}
