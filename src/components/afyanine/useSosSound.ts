"use client";
import { useEffect, useRef, useState } from "react";
export function useSosSound(ringing: boolean) {
  const audio = useRef<AudioContext | null>(null);
  const [enabled, setEnabled] = useState(false);
  const enable = async () => {
    audio.current ??= new AudioContext();
    await audio.current.resume();
    setEnabled(audio.current.state === "running");
  };
  useEffect(() => {
    if (!enabled || !ringing) return;
    const ring = () => {
      const ctx = audio.current;
      if (!ctx || ctx.state !== "running") return;
      for (let n = 0; n < 2; n++) {
        const oscillator = ctx.createOscillator(), gain = ctx.createGain();
        oscillator.type = "sine"; oscillator.frequency.value = n ? 880 : 660;
        gain.gain.setValueAtTime(0, ctx.currentTime + n * .3);
        gain.gain.linearRampToValueAtTime(.12, ctx.currentTime + n * .3 + .03);
        gain.gain.linearRampToValueAtTime(0, ctx.currentTime + n * .3 + .25);
        oscillator.connect(gain).connect(ctx.destination);
        oscillator.start(ctx.currentTime + n * .3); oscillator.stop(ctx.currentTime + n * .3 + .28);
      }
    };
    ring(); const timer = setInterval(ring, 4000);
    return () => clearInterval(timer);
  }, [enabled, ringing]);
  useEffect(() => () => { void audio.current?.close(); }, []);
  return { enabled, enable };
}
