import type { CSSProperties, ReactNode } from "react";

type IconName =
  | "heart"
  | "mother"
  | "people"
  | "phone"
  | "arrow"
  | "back"
  | "bell"
  | "pin"
  | "calendar"
  | "direction"
  | "clock"
  | "hospital"
  | "activity"
  | "warning"
  | "chat"
  | "home"
  | "user"
  | "search"
  | "sliders"
  | "chevron"
  | "ambulance"
  | "check"
  | "plus"
  | "more"
  | "edit"
  | "droplet"
  | "zap"
  | "moon"
  | "scale"
  | "baby"
  | "x"
  | "sparkles"
  | "route"
  | "sun";

const PATHS: Record<IconName, ReactNode> = {
  heart: (
    <path d="M20.8 4.7a5.5 5.5 0 0 0-7.8 0L12 5.8l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.4 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
  ),
  mother: (
    <>
      <circle cx="12" cy="5.2" r="2.7" />
      <path d="M8.4 21v-5.4a5.5 5.5 0 0 1 2-4.3" />
      <path d="M14.1 8.9c2.1.9 3.5 3 3.5 5.4V21" />
      <path d="M10.1 12.1c4.5-.5 6.1 2.6 4.4 5.4-1.1 1.8-4.3 1.2-4.3-1.2" />
    </>
  ),
  people: (
    <>
      <circle cx="9" cy="7" r="3" />
      <circle cx="17.5" cy="8.5" r="2.2" />
      <path d="M3.5 20v-2a5.5 5.5 0 0 1 11 0v2" />
      <path d="M15 14a4.5 4.5 0 0 1 5.5 4.4V20" />
    </>
  ),
  phone: (
    <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6A19.79 19.79 0 0 1 2.12 4.18 2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.13.96.36 1.9.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.91.34 1.85.57 2.81.7A2 2 0 0 1 22 16.92Z" />
  ),
  arrow: (
    <>
      <path d="M5 12h14" />
      <path d="m14 7 5 5-5 5" />
    </>
  ),
  back: (
    <>
      <path d="M19 12H5" />
      <path d="m10 17-5-5 5-5" />
    </>
  ),
  bell: (
    <>
      <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" />
      <path d="M10 21h4" />
    </>
  ),
  pin: (
    <>
      <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
      <circle cx="12" cy="10" r="2.4" />
    </>
  ),
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </>
  ),
  direction: (
    <>
      <path d="m12 2 9 9-9 9-9-9 9-9Z" />
      <path d="M8 13v-2a2 2 0 0 1 2-2h6" />
      <path d="m14 7 2 2-2 2" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  hospital: (
    <>
      <path d="M4 21V7h16v14" />
      <path d="M8 21v-4h8v4" />
      <path d="M9 11h6M12 8v6" />
      <path d="M7 7V3h10v4" />
    </>
  ),
  activity: <path d="M3 12h4l2.2-6 4.2 12 2.3-6H21" />,
  warning: (
    <>
      <path d="M10.3 3.6 2.2 18a2 2 0 0 0 1.8 3h16a2 2 0 0 0 1.8-3L13.7 3.6a2 2 0 0 0-3.4 0Z" />
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
    </>
  ),
  chat: (
    <>
      <path d="M21 15a4 4 0 0 1-4 4H8l-5 3V7a4 4 0 0 1 4-4h10a4 4 0 0 1 4 4Z" />
      <path d="M8 9h8M8 13h5" />
    </>
  ),
  home: (
    <>
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v11h14V10" />
      <path d="M9 21v-7h6v7" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
    </>
  ),
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m16 16 5 5" />
    </>
  ),
  sliders: (
    <>
      <path d="M4 6h4.5M13.5 6H20" />
      <circle cx="11" cy="6" r="2.2" />
      <path d="M4 12h7.5M17.5 12H20" />
      <circle cx="15" cy="12" r="2.2" />
      <path d="M4 18h2.5M12.5 18H20" />
      <circle cx="10" cy="18" r="2.2" />
    </>
  ),
  chevron: <path d="m9 18 6-6-6-6" />,
  ambulance: (
    <>
      <path d="M3 7h11v11H3z" />
      <path d="M14 11h4l3 4v3h-7" />
      <circle cx="7" cy="19" r="1.8" />
      <circle cx="18" cy="19" r="1.8" />
      <path d="M7 10v5M4.5 12.5h5" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  more: (
    <>
      <circle cx="5" cy="12" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="12" cy="12" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="19" cy="12" r="0.6" fill="currentColor" stroke="none" />
    </>
  ),
  edit: (
    <>
      <path d="m4 20 4.2-1L18.7 8.5a2.1 2.1 0 0 0-3-3L5.2 16 4 20Z" />
      <path d="m14 7 3 3" />
    </>
  ),
  droplet: <path d="M12 2.7s6.5 7.1 6.5 11.3a6.5 6.5 0 0 1-13 0C5.5 9.8 12 2.7 12 2.7Z" />,
  zap: <path d="M13 2 3 14h7l-1 8 11-13h-8l1-7Z" />,
  moon: <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8Z" />,
  scale: (
    <>
      <rect x="3.5" y="4" width="17" height="16" rx="3" />
      <path d="M7.5 9a4.5 4.5 0 0 1 9 0" />
      <path d="m12 9 2.4 3.2" />
    </>
  ),
  baby: (
    <>
      <circle cx="12" cy="5.4" r="2.4" />
      <path d="M12 7.8v4.4" />
      <path d="M8.8 10.6h6.4" />
      <path d="M10.4 12.2 9.2 20" />
      <path d="M13.6 12.2l1.2 7.8" />
      <path d="M9.2 20h3" />
    </>
  ),
  x: (
    <>
      <path d="M18 6 6 18" />
      <path d="m6 6 12 12" />
    </>
  ),
  sparkles: (
    <>
      <path d="M12 4.5 13.6 9 18 10.6 13.6 12.2 12 16.7 10.4 12.2 6 10.6 10.4 9Z" />
      <path d="M18.5 15.5l.7 1.8 1.8.7-1.8.7-.7 1.8-.7-1.8-1.8-.7 1.8-.7Z" />
    </>
  ),
  route: (
    <>
      <circle cx="6" cy="19" r="2.2" />
      <circle cx="18" cy="5" r="2.2" />
      <path d="M8.2 19H15a3.5 3.5 0 0 0 0-7H9a3.5 3.5 0 0 1 0-7h6.8" />
    </>
  ),
  sun: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M4.6 4.6l1.4 1.4M18 18l1.4 1.4M2.5 12h2M19.5 12h2M4.6 19.4 6 18M18 6l1.4-1.4" />
    </>
  ),
};

export function Icon({
  name,
  size = 24,
  fill = "none",
  stroke = "currentColor",
  strokeWidth = 2.1,
  label,
  className,
}: {
  name: IconName;
  size?: number;
  fill?: string;
  stroke?: string;
  strokeWidth?: number;
  label?: string;
  className?: string;
}) {
  /* fill/stroke go through style so CSS variables (var(--lime)) are supported */
  const style: CSSProperties = { fill, stroke };
  return (
    <svg
      aria-hidden={label ? undefined : true}
      aria-label={label}
      role={label ? "img" : undefined}
      className={`app-icon${className ? ` ${className}` : ""}`}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      style={style}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {PATHS[name]}
    </svg>
  );
}

export type { IconName };
