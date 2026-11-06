const PREGNANCY_PATHS = {
  safe: {
    area:
      "M0 63 C30 57 45 66 72 48 S110 60 134 44 S175 50 195 31 S235 45 255 29 S280 25 300 18 L300 100 L0 100Z",
    line:
      "M0 63 C30 57 45 66 72 48 S110 60 134 44 S175 50 195 31 S235 45 255 29 S280 25 300 18",
  },
  danger: {
    area:
      "M0 75 C25 65 35 71 56 60 S90 68 112 52 S148 57 170 38 S205 48 226 24 S260 42 300 16 L300 100 L0 100Z",
    line:
      "M0 75 C25 65 35 71 56 60 S90 68 112 52 S148 57 170 38 S205 48 226 24 S260 42 300 16",
  },
} as const;

export function LineChart({
  danger = false,
  compact = false,
  label,
}: {
  danger?: boolean;
  compact?: boolean;
  label?: string;
}) {
  const paths = danger ? PREGNANCY_PATHS.danger : PREGNANCY_PATHS.safe;
  return (
    <svg
      className={`line-chart${compact ? " compact" : ""}`}
      viewBox="0 0 300 100"
      preserveAspectRatio="none"
      role={label ? "img" : undefined}
      aria-label={label}
      aria-hidden={label ? undefined : true}
    >
      <g className="chart-grid">
        <line x1="0" y1="20" x2="300" y2="20" />
        <line x1="0" y1="50" x2="300" y2="50" />
        <line x1="0" y1="80" x2="300" y2="80" />
      </g>
      <path className={danger ? "danger-area" : "chart-area"} d={paths.area} />
      <path className={danger ? "danger-line" : "chart-line"} d={paths.line} />
    </svg>
  );
}

export function WeekRing({ week, totalWeeks }: { week: number; totalWeeks: number }) {
  const radius = 52;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.min(week / totalWeeks, 1);
  const offset = circumference * (1 - progress);
  return (
    <div className="week-ring" role="img" aria-label={`Week ${week} of ${totalWeeks}`}>
      <svg viewBox="0 0 120 120">
        <circle cx="60" cy="60" r={radius} />
        <circle
          className="progress"
          cx="60" cy="60" r={radius}
          strokeDasharray={circumference.toFixed(1)}
          strokeDashoffset={offset.toFixed(1)}
        />
      </svg>
      <div>
        <small>WEEK</small>
        <b>{week}</b>
        <span>of {totalWeeks}</span>
      </div>
    </div>
  );
}
