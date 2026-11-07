"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

/* Respect the visitor's reduced-motion preference in JS-driven motion */
function prefersReducedMotion(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

/**
 * Animates a number from 0 → target with an ease-out curve.
 * Returns the current value; when reduced motion is requested the
 * value snaps straight to the target.
 */
export function useCountUp(target: number, duration = 900, decimals = 0): number {
  const [value, setValue] = useState(() => (prefersReducedMotion() ? target : 0));
  const raf = useRef<number | null>(null);

  useEffect(() => {
    const reduce = prefersReducedMotion();
    const start = performance.now();
    const durationMs = reduce ? 0 : duration;
    /* First frame lands inside the rAF callback — no synchronous setState */
    const tick = (now: number) => {
      const t = durationMs === 0 ? 1 : Math.min((now - start) / durationMs, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setValue(Number((target * eased).toFixed(decimals)));
      if (t < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => {
      if (raf.current) cancelAnimationFrame(raf.current);
    };
  }, [target, duration, decimals]);

  return value;
}

/**
 * Flips to true one frame after mount — used to trigger CSS
 * transitions (ring draw-in, marker pop) without layout thrash.
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    const id = window.requestAnimationFrame(() => setMounted(true));
    return () => window.cancelAnimationFrame(id);
  }, []);
  return mounted;
}

/**
 * Steps through a scripted journey on an interval (live tracking).
 * Pauses when the tab is hidden; stops at the final stage.
 */
export function useStageProgress(totalStages: number, intervalMs: number, active: boolean): number {
  const [stage, setStage] = useState(0);

  useEffect(() => {
    if (!active) return;
    const timer = window.setInterval(() => {
      setStage((s) => {
        if (s + 1 >= totalStages || document.hidden) return s;
        return s + 1;
      });
    }, intervalMs);
    return () => window.clearInterval(timer);
  }, [totalStages, intervalMs, active]);

  return stage;
}

/** Inline style helper for stagger children: style={stagger(i)} */
export function stagger(index: number): CSSProperties {
  return { "--i": index } as CSSProperties;
}
