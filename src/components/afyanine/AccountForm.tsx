"use client";

import { useState, type FormEvent } from "react";
import { Icon } from "./Icon";

export function AccountForm({ language, role }: { language: "EN" | "SW"; role: "mother" | "chw" }) {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const sw = language === "SW";
  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;
    setBusy(true); setError("");
    try {
      const response = await fetch("/api/account", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ mode, email, password, ...(mode === "signup" ? { phone, name, role: role === "chw" ? "CHW" : "MOTHER" } : {}) }) });
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setPassword("");
      window.dispatchEvent(new Event("afyanine:account"));
    } catch (err) { setError(err instanceof Error ? err.message : "Please try again."); }
    finally { setBusy(false); }
  }
  return <form className="account-form" onSubmit={submit}>
    <h2>{mode === "signup" ? (sw ? "Fungua akaunti" : "Create your account") : (sw ? "Ingia kwenye akaunti" : "Sign in to your account")}</h2>
    {mode === "signup" && <label>{sw ? "Jina" : "Display name"}<input required minLength={2} maxLength={80} autoComplete="name" value={name} onChange={e => setName(e.target.value)} disabled={busy} /></label>}
    <label>{sw ? "Barua pepe" : "Email"}<input type="email" required maxLength={254} autoComplete="email" value={email} onChange={e => setEmail(e.target.value)} disabled={busy} /></label>
    {mode === "signup" && <label>{sw ? "Nambari ya simu" : "Phone number"}<input type="tel" required autoComplete="tel" placeholder="+254712345678" maxLength={25} value={phone} onChange={e => setPhone(e.target.value)} disabled={busy} /></label>}
    <label>{sw ? "Nenosiri" : "Password"}<input type="password" minLength={10} maxLength={128} required autoComplete={mode === "signup" ? "new-password" : "current-password"} value={password} onChange={e => setPassword(e.target.value)} disabled={busy} /></label>
    {error && <p className="account-error" role="alert">{error}</p>}
    <button className="primary-button" disabled={busy}>{busy ? (sw ? "Tafadhali subiri…" : "Please wait…") : mode === "signup" ? (sw ? "Fungua akaunti" : "Create account") : (sw ? "Ingia" : "Sign in")}<Icon name="arrow" /></button>
    <div className="account-links"><button type="button" disabled={busy} onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setError(""); setPassword(""); }}>{mode === "signup" ? (sw ? "Rudi kuingia" : "Back to sign in") : (sw ? "Fungua akaunti" : "Create account")}</button></div>
    <p className="account-hint">{sw ? "Tumia nenosiri lenye herufi angalau 10. Ukiisahau, wasiliana na kliniki yako. Barua pepe na simu hazijathibitishwa kwa ujumbe." : "Use at least 10 characters. Passwords are securely hashed. Forgotten password? Contact your clinic; self-service recovery is not yet available. Email and phone are not message-verified."}</p>
  </form>;
}
