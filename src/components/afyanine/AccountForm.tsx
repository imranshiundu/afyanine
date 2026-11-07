"use client";

import { useState, type FormEvent } from "react";
import { getSupabase, isAuthConfigured } from "@/lib/supabase";
import { Icon } from "./Icon";

export function AccountForm({ language }: { language: "EN" | "SW" }) {
  const [mode, setMode] = useState<"signin" | "signup" | "recover">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const sw = language === "SW";
  const configured = isAuthConfigured();
  const change = (next: typeof mode) => { setMode(next); setError(""); setMessage(""); setPassword(""); };

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const sb = getSupabase();
    if (!sb || busy) return;
    setBusy(true); setMessage(""); setError("");
    try {
      if (mode === "recover") {
        const result = await sb.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/auth/reset-password` });
        if (result.error) throw result.error;
        setMessage(sw ? "Ikiwa akaunti ipo, utapokea kiungo cha kuweka nenosiri jipya." : "If an account exists, you’ll receive a password-reset link.");
      } else if (mode === "signup") {
        const result = await sb.auth.signUp({
          email: email.trim(), password,
          options: { data: { display_name: name.trim().slice(0, 80) }, emailRedirectTo: `${window.location.origin}/auth/callback` },
        });
        if (result.error) throw result.error;
        setPassword("");
        if (!result.data.session) setMessage(sw ? "Angalia barua pepe yako kuthibitisha akaunti." : "Check your email to confirm your account, then sign in.");
      } else {
        const result = await sb.auth.signInWithPassword({ email: email.trim(), password });
        if (result.error) throw result.error;
        setPassword("");
      }
    } catch {
      setError(sw ? "Haikufaulu. Hakikisha taarifa zako, au jaribu tena baadaye." : "That didn’t work. Check your details and connection, or try again shortly.");
    } finally { setBusy(false); }
  }

  return (
    <form className="account-form" onSubmit={submit}>
      <h2>{mode === "signup" ? (sw ? "Fungua akaunti" : "Create your account") : mode === "recover" ? (sw ? "Weka upya nenosiri" : "Reset your password") : (sw ? "Ingia kwenye akaunti" : "Sign in to your account")}</h2>
      {!configured && <p className="account-notice" role="status">{sw ? "Supabase haijaandaliwa katika mazingira haya. Unaweza kutumia akaunti za kubuni kwenye Wodi ya majaribio." : "Account sign-in needs Supabase configuration. You can still explore fictional accounts in Test ward."}</p>}
      {mode === "signup" && <label> {sw ? "Jina la kuonyeshwa" : "Display name"}<input value={name} onChange={e => setName(e.target.value)} autoComplete="name" maxLength={80} required disabled={busy} /></label>}
      <label>{sw ? "Barua pepe" : "Email"}<input type="email" value={email} onChange={e => setEmail(e.target.value)} autoComplete="email" required disabled={busy} /></label>
      {mode !== "recover" && <label>{sw ? "Nenosiri" : "Password"}
        <span className="password-input"><input type={show ? "text" : "password"} value={password} onChange={e => setPassword(e.target.value)} autoComplete={mode === "signup" ? "new-password" : "current-password"} required minLength={mode === "signup" ? 8 : 1} disabled={busy} />
          <button type="button" aria-label={show ? (sw ? "Ficha nenosiri" : "Hide password") : (sw ? "Onyesha nenosiri" : "Show password")} aria-pressed={show} onClick={() => setShow(!show)}>{show ? (sw ? "Ficha" : "Hide") : (sw ? "Onyesha" : "Show")}</button></span>
      </label>}
      {mode === "signup" && <p className="account-hint">{sw ? "Tumia herufi angalau 8. Akaunti haikupi ruhusa ya mhudumu wala kuunganisha na mama wa majaribio." : "Use at least 8 characters. This account does not grant clinician access or link you to a Test Ward mother."}</p>}
      {error && <p className="account-error" role="alert">{error}</p>}
      {message && <p className="account-notice" role="status">{message}</p>}
      <button className="primary-button" type="submit" disabled={!configured || busy}>{busy ? (sw ? "Tafadhali subiri…" : "Please wait…") : mode === "signup" ? (sw ? "Fungua akaunti" : "Create account") : mode === "recover" ? (sw ? "Tuma kiungo" : "Send reset link") : (sw ? "Ingia" : "Sign in")}<Icon name="arrow" /></button>
      <div className="account-links">
        {mode !== "signin" && <button type="button" onClick={() => change("signin")}>{sw ? "Rudi kuingia" : "Back to sign in"}</button>}
        {mode === "signin" && <><button type="button" onClick={() => change("recover")}>{sw ? "Umesahau nenosiri?" : "Forgot password?"}</button><button type="button" onClick={() => change("signup")}>{sw ? "Fungua akaunti" : "Create account"}</button></>}
      </div>
      <p className="account-hint">{sw ? "Supabase Auth hushughulikia taarifa za kuingia. Mfano huu haupokei taarifa halisi za afya." : "Credentials are handled by Supabase Auth. This prototype does not accept real health records."}</p>
    </form>
  );
}
