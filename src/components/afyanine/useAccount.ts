"use client";

import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabase, isAuthConfigured } from "@/lib/supabase";
import { writeDemoSession } from "./account-session";

export function useAccount() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(isAuthConfigured);
  const [error, setError] = useState("");
  useEffect(() => {
    const sb = getSupabase();
    if (!sb) return;
    let active = true;
    // Browser session is UI state only. All profile operations are authorized
    // by Supabase Auth; this local session does not grant clinical API access.
    const { data: { subscription } } = sb.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event === "SIGNED_IN" || event === "SIGNED_OUT") writeDemoSession(null);
      setUser(session?.user ?? null);
      setLoading(false);
    });
    sb.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      setUser(error ? null : data.session?.user ?? null);
      setError(error ? "Your session could not be restored. Please sign in again." : "");
      setLoading(false);
    }).catch(() => {
      if (active) { setError("Could not reach authentication. Please retry sign-in."); setLoading(false); }
    });
    return () => { active = false; subscription.unsubscribe(); };
  }, []);
  return { user, loading, error };
}
