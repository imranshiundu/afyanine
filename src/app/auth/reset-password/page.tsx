"use client";

import { useEffect, useRef, useState, type FormEvent } from "react";
import Link from "next/link";
import { exchangeAuthCode, getSupabase } from "@/lib/supabase";
import { useLanguage } from "@/components/afyanine/language";

export default function ResetPassword() {
  const { t } = useLanguage();
  const [ready, setReady] = useState(false);
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("Checking your reset link…");
  const codeRef = useRef<string | null>(null);
  useEffect(() => {
    let active = true;
    Promise.resolve().then(async () => {
      const sb = getSupabase();
      if (!sb) throw new Error("Not configured");
      const code = codeRef.current ?? new URL(window.location.href).searchParams.get("code");
      codeRef.current = code;
      window.history.replaceState(null, "", "/auth/reset-password");
      if (code) {
        const { error } = await exchangeAuthCode(code);
        if (error) throw error;
        window.history.replaceState(null, "", "/auth/reset-password");
      }
      const { data, error } = await sb.auth.getUser();
      if (!data.user || error) throw new Error("No reset session");
      if (active) { setReady(true); setMessage("Choose a new password with at least 8 characters."); }
    }).catch(() => { if (active) setMessage("This reset link is unavailable or expired. Request a new one from sign in."); });
    return () => { active = false; };
  }, []);
  async function submit(event: FormEvent) {
    event.preventDefault();
    const sb = getSupabase();
    if (!sb || busy) return;
    setBusy(true);
    try {
      const { error } = await sb.auth.updateUser({ password });
      if (error) throw error;
      setReady(false); setPassword(""); setMessage("Password updated. You can return to your account.");
    } catch { setMessage("Could not update your password. Please retry or request a fresh link."); }
    finally { setBusy(false); }
  }
  return <div className="page"><div className="app-shell"><main className="screen standalone-screen"><section className="profile-card"><h1>{t("New password")}</h1><p role="status">{t(message)}</p>{ready && <form className="account-form" onSubmit={submit}><label>{t("New password")}<input type="password" minLength={8} autoComplete="new-password" required value={password} onChange={e => setPassword(e.target.value)} /></label><button className="primary-button" disabled={busy}>{t(busy ? "Saving…" : "Update password")}</button></form>}<Link className="secondary-button" href="/">{t("Return to AfyaNine")}</Link></section></main></div></div>;
}
