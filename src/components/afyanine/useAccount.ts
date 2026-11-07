"use client";

import { useEffect, useState } from "react";
export type AccountUser = { id: string; email: string; user_metadata: { display_name: string; afyanine_role: string; phone: string } };
export function useAccount() {
  const [user, setUser] = useState<AccountUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  useEffect(() => {
    let active = true;
    const refresh = async () => {
      try {
        const response = await fetch("/api/account", { cache: "no-store" });
        if (response.status !== 401 && !response.ok) throw new Error();
        const body = await response.json();
        if (active) { setUser(body.user ?? null); setError(""); }
      } catch { if (active) setError("Could not restore your session. Please retry."); }
      finally { if (active) setLoading(false); }
    };
    void refresh();
    window.addEventListener("afyanine:account", refresh);
    window.addEventListener("focus", refresh);
    return () => { active = false; window.removeEventListener("afyanine:account", refresh); window.removeEventListener("focus", refresh); };
  }, []);
  return { user, loading, error };
}
