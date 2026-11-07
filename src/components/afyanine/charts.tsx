"use client";

import { useEffect, useState } from "react";
import { useCountUp, useMounted } from "./useMotion";

/* ------------------------------------------------------------------ */
/* Path helpers                                                        */
/* ------------------------------------------------------------------ */

type Pt = [number, number];

/** Catmull-Rom → cubic Bézier for soft, organic chart curves. */
function smoothPath(pts: Pt[]): string {
  if (pts.length < 2) return "";
  let d = `M ${pts[0][0]} ${pts[0][1]}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)];
    const p1 = pts[i];
    const p2 = pts[i + 1];
    const p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1x = p1[0] + (p2[0] - p0[0]) / 6;
    const c1y = p1[1] + (p2[1] - p0[1]) / 6;
    const c2x = p2[0] - (p3[0] - p1[0]) / 6;
    const c2y = p2[1] - (p3[1] - p1[1]) / 6;
    d += ` C ${c1x.toFixed(1)} ${c1y.toFixed(1)}, ${c2x.toFixed(1)} ${c2y.toFixed(1)}, ${p2[0].toFixed(1)} ${p2[1].toFixed(1)}`;
  }
  return d;
}

const W = 300;
const H = 100;
const PAD = 8;

function toPoints(data: number[], min: number, max: number): Pt[] {
  const span = Math.max(max - min, 1);
  return data.map((v, i) => [
    (i / Math.max(data.length - 1, 1)) * W,
    PAD + (1 - (v - min) / span) * (H - PAD * 2),
  ]);
}

/* ------------------------------------------------------------------ */
/* Sparkline — interactive, draw-in animated                           */
/* ------------------------------------------------------------------ */

export interface SparklineProps {
  data: number[];
  labels: string[];
  secondary?: number[];
  unit?: string;
  /** y axis floor/ceiling — keep consistent across range switches */
  min?: number;
  max?: number;
  danger?: boolean;
  threshold?: number | null;
  thresholdLabel?: string;
  /** show HTML dots + pressable tooltips */
  interactive?: boolean;
  ariaLabel: string;
}

export function Sparkline({
  data,
  labels,
  secondary,
  unit = "mmHg",
  min,
  max,
  danger = false,
  threshold = null,
  thresholdLabel,
  interactive = true,
  ariaLabel,
}: SparklineProps) {
  const lo = min ?? Math.min(...data, threshold ?? Infinity) - 6;
  const hi = max ?? Math.max(...data, threshold ?? -Infinity) + 6;
  const pts = toPoints(data, lo, hi);
  const line = smoothPath(pts);
  const area = `${line} L ${W} ${H} L 0 ${H} Z`;
  const [active, setActive] = useState<number | null>(null);

  const thresholdY = threshold != null ? toPoints([threshold], lo, hi)[0][1] : null;
  const n = data.length;

  return (
    <div className="spark">
      <svg
        className="spark-svg"
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        role="img"
        aria-label={ariaLabel}
      >
        <g className="spark-grid">
          <line x1="0" y1={H * 0.25} x2={W} y2={H * 0.25} />
          <line x1="0" y1={H * 0.5} x2={W} y2={H * 0.5} />
          <line x1="0" y1={H * 0.75} x2={W} y2={H * 0.75} />
        </g>
        <path className={danger ? "spark-area-danger" : "spark-area"} d={area} />
        {thresholdY != null && (
          <>
            <line className="spark-threshold" x1="0" y1={thresholdY} x2={W} y2={thresholdY} />
            {thresholdLabel && (
              <text className="spark-threshold-label" x="4" y={thresholdY - 4}>
                {thresholdLabel}
              </text>
            )}
          </>
        )}
        <path
          className={danger ? "spark-line-danger" : "spark-line"}
          d={line}
          pathLength={1}
        />
      </svg>

      {interactive && (
        <>
          <div className="spark-dots" aria-hidden="true">
            {pts.map(([x, y], i) => (
              <span
                key={i}
                className={`spark-dot${i === n - 1 ? " live" : danger ? " danger" : ""}`}
                style={{
                  left: `${(x / W) * 100}%`,
                  top: `${(y / H) * 100}%`,
                  animationDelay: `${180 + i * 70}ms`,
                }}
              />
            ))}
          </div>
          <div className="spark-hit" role="group" aria-label="Data points">
            {pts.map(([x, y], i) => (
              <button
                key={i}
                type="button"
                aria-label={`${labels[i]}: ${data[i]}${secondary ? ` over ${secondary[i]}` : ""} ${unit}`}
                aria-pressed={active === i}
                onMouseEnter={() => setActive(i)}
                onMouseLeave={() => setActive((a) => (a === i ? null : a))}
                onFocus={() => setActive(i)}
                onBlur={() => setActive((a) => (a === i ? null : a))}
                onClick={() => setActive((a) => (a === i ? null : i))}
                style={{
                  left: `${(x / W) * 100}%`,
                  top: `${(y / H) * 100}%`,
                }}
              />
            ))}
          </div>
          {active != null && (
            <div
              className={`spark-tip${danger ? " danger" : ""}`}
              role="status"
              style={{
                left: `${Math.min(Math.max((pts[active][0] / W) * 100, 9), 91)}%`,
                top: `${Math.max((pts[active][1] / H) * 100 - 4, 0)}%`,
              }}
            >
              <small>{labels[active]}</small>
              <b>
                {data[active]}
                {secondary ? <em>/{secondary[active]}</em> : null}
                <span> {secondary ? "mmHg" : unit}</span>
              </b>
            </div>
          )}
        </>
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Axis strip                                                          */
/* ------------------------------------------------------------------ */

export function ChartAxis({ labels, indent = false }: { labels: string[]; indent?: boolean }) {
  return (
    <div className={`chart-axis${indent ? " indent" : ""}`} aria-hidden="true">
      {labels.map((l) => (
        <span key={l}>{l}</span>
      ))}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* ECG — continuously scrolling heartbeat wave                         */
/* ------------------------------------------------------------------ */

export function EcgWave() {
  /* Five cycles side by side; the group slides left by one 60-unit
     cycle, producing a seamless infinite heartbeat. */
  const cycle =
    "M0 34 h26 q4 -7 8 0 h12 l3.5 6 l5.5 -22 l5.5 30 l3.5 -14 h10 q7 -11 14 0 h26";
  const path = [0, 60, 120, 180, 240, 300]
    .map((dx) => cycle.replace(/^M0 /, `M${dx} `))
    .join(" ");
  return (
    <svg
      className="ecg"
      viewBox="0 0 360 60"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <g className="ecg-run">
        <path d={path} pathLength={1} />
      </g>
      <line className="ecg-now" x1="336" y1="4" x2="336" y2="56" />
    </svg>
  );
}

/* ------------------------------------------------------------------ */
/* Week ring — draws in on mount, counts up                            */
/* ------------------------------------------------------------------ */

export function WeekRing({ week, totalWeeks }: { week: number; totalWeeks: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(week / totalWeeks, 1);
  const target = circumference * (1 - progress);
  const mounted = useMounted();
  const shown = useCountUp(week, 1100);

  return (
    <div className="week-ring" role="img" aria-label={`Week ${week} of ${totalWeeks}`}>
      <svg viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} />
        <circle
          className="progress"
          cx="60" cy="60" r={radius}
          style={{
            strokeDasharray: circumference.toFixed(1),
            strokeDashoffset: (mounted ? target : circumference).toFixed(1),
          }}
        />
      </svg>
      <div>
        <small>WEEK</small>
        <b>{shown}</b>
        <span>of {totalWeeks}</span>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Blood pressure category meter                                       */
/* ------------------------------------------------------------------ */

export function BpMeter({
  systolic,
  scale,
  categories,
}: {
  systolic: number;
  scale: { min: number; max: number };
  categories: Array<{ key: string; label: string; from: number; to: number }>;
}) {
  const span = scale.max - scale.min;
  const mounted = useMounted();
  const pct = (v: number) => (Math.min(Math.max(v, scale.min), scale.max) - scale.min) / span;

  return (
    <div className="bp-meter">
      <div className="bp-meter-track">
        {categories.map((c) => (
          <div key={c.key} className={`bp-seg ${c.key}`} style={{ width: `${(pct(c.to + 1) - pct(c.from)) * 100}%` }}>
            <span>{c.label}</span>
          </div>
        ))}
        <div
          className="bp-marker"
          style={{ left: `${(mounted ? pct(systolic) : 0) * 100}%` }}
          role="img"
          aria-label={`Your systolic reading is ${systolic}, in the normal zone`}
        >
          <b>{systolic}</b>
          <i aria-hidden="true" />
        </div>
      </div>
      <div className="bp-meter-scale" aria-hidden="true">
        <span>{scale.min} mmHg</span>
        <span>mmHg, systolic</span>
      </div>
    </div>
  );
}
