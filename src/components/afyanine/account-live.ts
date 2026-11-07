"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { io, type Socket } from "socket.io-client";
import type { careLive } from "@/lib/care-live";
type Json<T> = T extends Date ? string : T extends (infer U)[] ? Json<U>[] : T extends object ? { [K in keyof T]: Json<T[K]> } : T;
export type LiveSnapshot = Json<Awaited<ReturnType<typeof careLive>>> & { streaming?: boolean };
export type LiveRecord = NonNullable<LiveSnapshot["records"][string]>;
export type AccountUser = { id: string; email: string; user_metadata: { display_name: string; phone: string; afyanine_role: "MOTHER" | "CHW" } };
export async function requestJson<T>(url: string, method = "GET", body?: unknown): Promise<T> {
  const response = await fetch(url, { method, cache: "no-store", signal: AbortSignal.timeout(10000), headers: body === undefined ? undefined : { "Content-Type": "application/json" }, body: body === undefined ? undefined : JSON.stringify(body) });
  const result = await response.json();
  if (!response.ok) throw new Error(result.error ?? "Could not connect. Try again.");
  return result;
}
export const sessionChanged = () => window.dispatchEvent(new Event("afyanine-session"));
export function useAccount() {
  const [user, setUser] = useState<AccountUser | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    let active = true;
    const load = async () => {
      try { const result = await requestJson<{ user: AccountUser | null }>("/api/account"); if (active) setUser(result.user); }
      catch { if (active) setUser(null); }
      finally { if (active) setLoading(false); }
    };
    void load();
    window.addEventListener("afyanine-session", load);
    return () => { active = false; window.removeEventListener("afyanine-session", load); };
  }, []);
  return { user, loading };
}
export function useAccountLive() {
  const [data, setData] = useState<LiveSnapshot | null>(null);
  const [mode, setMode] = useState<"connecting" | "live" | "offline">("connecting");
  const [error, setError] = useState("");
  const [updatedAt, setUpdatedAt] = useState<number | null>(null);
  const socket = useRef<Socket | null>(null);
  const alive = useRef(true);
  const refresh = useCallback(async () => {
    if (socket.current?.connected) { socket.current.emit("refresh"); return; }
    try {
      const result = await requestJson<LiveSnapshot>("/api/account-live");
      if (alive.current) { setData(result); setUpdatedAt(Date.now()); setError(""); }
    } catch (e) { if (alive.current) { setError((e as Error).message); setMode("offline"); if ((e as Error).message === "SIGN_IN_REQUIRED") { setData(null); sessionChanged(); } } }
  }, []);
  useEffect(() => {
    alive.current = true;
    const kickoff = window.setTimeout(() => void refresh(), 0);
    let closed = false;
    const connect = async () => {
      try {
        const first = await requestJson<{ url: string | null }>("/api/socket-ticket");
        if (closed) return;
        const connection = io(first.url ?? undefined, {
          transports: ["websocket"], reconnection: true, timeout: 8000,
          auth: async cb => {
            try { const ticket = await requestJson<{ ticket: string }>("/api/socket-ticket"); cb({ ticket: ticket.ticket }); }
            catch { cb({ ticket: "" }); }
          },
        });
        socket.current = connection;
        connection.on("snapshot", (snapshot: LiveSnapshot) => { if (!closed) { setData(snapshot); setUpdatedAt(Date.now()); setMode(snapshot.streaming ? "live" : "offline"); setError(""); } });
        connection.on("disconnect", () => { if (!closed) setMode("offline"); });
        connection.on("connect_error", () => { if (!closed) setMode("offline"); });
        connection.on("live:offline", () => { if (!closed) setMode("offline"); });
        connection.on("access:revoked", () => { if (!closed) { setData(null); setMode("offline"); sessionChanged(); } });
      } catch { if (!closed) setMode("offline"); }
    };
    void connect();
    const interval = window.setInterval(() => { if (!socket.current?.connected) void refresh(); }, 15000);
    const focus = () => { void refresh(); if (socket.current && !socket.current.connected) socket.current.connect(); };
    window.addEventListener("focus", focus); window.addEventListener("online", focus);
    return () => { closed = true; alive.current = false; socket.current?.disconnect(); window.clearTimeout(kickoff); window.clearInterval(interval); window.removeEventListener("focus", focus); window.removeEventListener("online", focus); };
  }, [refresh]);
  const command = async (body: unknown) => {
    if (socket.current?.connected) {
      // A timeout can follow a committed write: never blindly repeat over HTTP.
      await new Promise<void>((resolve, reject) => socket.current!.timeout(12000).emit("command", body, (err: Error | null, result?: { error?: string }) => {
        if (err) reject(new Error("Save acknowledgement timed out. Refresh before trying again."));
        else if (result?.error) reject(new Error(result.error));
        else resolve();
      }));
    } else await requestJson("/api/care-workspace", "POST", body);
    await refresh();
  };
  return { data, mode, error, updatedAt, refresh, command };
}
