"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { exchangeAuthCode } from "@/lib/supabase";

export default function Callback() {
  const router = useRouter();
  const [message, setMessage] = useState("Confirming your account…");
  const codeRef = useRef<string | null>(null);
  useEffect(() => {
    let active = true;
    const code = codeRef.current ?? new URL(window.location.href).searchParams.get("code");
    codeRef.current = code;
    window.history.replaceState(null, "", "/auth/callback");
    Promise.resolve().then(async () => {
      if (!code) throw new Error("Missing code");
      const { error } = await exchangeAuthCode(code);
      if (error) throw error;
      if (active) { window.history.replaceState(null, "", "/auth/callback"); router.replace("/"); }
    }).catch(() => { if (active) setMessage("That link could not be verified. It may have expired or been opened in another browser. Please return to sign in and try again."); });
    return () => { active = false; };
  }, [router]);
  return <div className="page"><div className="app-shell"><main className="screen standalone-screen"><section className="profile-card"><h1>Account confirmation</h1><p role="status">{message}</p><Link className="secondary-button" href="/">Back to sign in</Link></section></main></div></div>;
}
