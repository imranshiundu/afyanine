"use client";

import { useEffect, useRef, useState } from "react";
type Alert = { id: string; kind: string; motherName: string; createdAt: string };
export function LiveAlerts({ alerts, live, chw, resolve }: { alerts: Alert[]; live: "connecting" | "connected" | "reconnecting"; chw: boolean; resolve: (id: string) => void }) {
  const [enabled, setEnabled] = useState(false);
  const [muted, setMuted] = useState<string[]>([]);
  const [error, setError] = useState("");
  const audio = useRef<AudioContext | null>(null);
  const ringing = chw && enabled && alerts.some(alert => !muted.includes(alert.id));
  useEffect(() => {
    if (!ringing) return;
    const beep = () => {
      const context = audio.current;
      if (!context || context.state !== "running") return;
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      oscillator.frequency.value = 880;
      gain.gain.setValueAtTime(0.12, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, context.currentTime + 0.5);
      oscillator.connect(gain); gain.connect(context.destination);
      oscillator.start(); oscillator.stop(context.currentTime + 0.5);
    };
    beep(); const timer = setInterval(beep, 1500);
    return () => clearInterval(timer);
  }, [ringing]);
  useEffect(() => () => { void audio.current?.close(); }, []);
  async function toggle() {
    if (enabled) { setEnabled(false); return; }
    try {
      audio.current ??= new AudioContext();
      await audio.current.resume();
      if (audio.current.state !== "running") throw new Error();
      setEnabled(true); setError("");
    } catch { setError("Sound is blocked by this browser. Keep the visual alert panel open."); }
  }
  return <section className="profile-card" aria-label="Live SOS alerts">
    <p role="status">{live === "connected" ? "Live · connected to database updates" : live === "connecting" ? "Connecting live updates…" : "Live connection interrupted · retrying; backup refresh every 15 seconds"}</p>
    {chw && <><button className="secondary-button" onClick={() => void toggle()}>{enabled ? "Disable alert sound" : "Enable alert sound"}</button><p className="account-hint">Keep this app open. Sound requires permission on each device; a closed or sleeping browser cannot ring. This does not place a phone call.</p></>}
    {error && <p role="alert">{error}</p>}
    <div aria-live="assertive">{alerts.map(alert => <div className="account-error" key={alert.id}><h3>SOS · {alert.motherName}</h3><p>{alert.kind} · {new Date(alert.createdAt).toLocaleTimeString()}</p>
      {chw && <button className="secondary-button" onClick={() => setMuted(ids => [...ids, alert.id])}>Silence on this device</button>}
      <button className="secondary-button" onClick={() => { if (window.confirm("Resolve this SOS? This does not dispatch an ambulance.")) resolve(alert.id); }}>Resolve SOS</button>
    </div>)}</div>
    <p className="account-hint">An SOS is shared only with approved CHWs who have Vitals access. Delivery and response are not guaranteed. In an emergency, <a href="tel:112">call 112</a>.</p>
  </section>;
}
