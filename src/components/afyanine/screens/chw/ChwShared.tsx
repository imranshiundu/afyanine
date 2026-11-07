import type { Appointment, ChwDestination } from "./types";

const iconPaths: Record<string, React.ReactNode> = {
  home: (
    <>
      <path d="m3 11 9-8 9 8" />
      <path d="M5 10v11h14V10M9 21v-7h6v7" />
    </>
  ),
  people: (
    <>
      <circle cx="9" cy="7" r="3" />
      <circle cx="17.5" cy="8.5" r="2.2" />
      <path d="M3.5 20v-2a5.5 5.5 0 0 1 11 0v2M15 14a4.5 4.5 0 0 1 5.5 4.4V20" />
    </>
  ),
  plus: <path d="M12 5v14M5 12h14" />,
  calendar: (
    <>
      <rect x="3" y="5" width="18" height="16" rx="3" />
      <path d="M8 3v4M16 3v4M3 10h18" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4.5 21a7.5 7.5 0 0 1 15 0" />
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
  chevron: <path d="m9 18 6-6-6-6" />,
  search: (
    <>
      <circle cx="10.5" cy="10.5" r="6.5" />
      <path d="m16 16 5 5" />
    </>
  ),
  sliders: (
    <>
      <path d="M4 6h16M4 12h16M4 18h16" />
      <circle cx="9" cy="6" r="2" fill="#F3F0E8" />
      <circle cx="15" cy="12" r="2" fill="#F3F0E8" />
      <circle cx="8" cy="18" r="2" fill="#F3F0E8" />
    </>
  ),
  check: <path d="m5 12 4 4L19 6" />,
  hospital: (
    <>
      <path d="M4 21V7h16v14M8 21v-4h8v4M9 11h6M12 8v6" />
      <path d="M7 7V3h10v4" />
    </>
  ),
  phone: (
    <path
      d="M7.2 2.8 4.5 4.4c-1.1.6-.9 3.5 1.5 7.7s4.8 6 5.9 5.4l2.7-1.6-2.5-4.2-2.2 1.2c-.7-.5-1.3-1.3-1.9-2.3-.6-1-1-1.9-1.1-2.8l2.2-1.3-1.9-3.7Z"
      transform="translate(2 1)"
    />
  ),
  edit: (
    <>
      <path d="m4 20 4.2-1 10.5-10.5a2.1 2.1 0 0 0-3-3L5.2 16 4 20Z" />
      <path d="m14 7 3 3" />
    </>
  ),
};

export function ChwIcon({
  name,
  size = 22,
  strokeWidth = 1.8,
}: {
  name: string;
  size?: number;
  strokeWidth?: number;
}) {
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {iconPaths[name]}
    </svg>
  );
}

export function ChwNav({
  active,
  navigate,
  notify,
}: {
  active: "dashboard" | "patients" | "visits" | "profile";
  navigate: (screen: ChwDestination) => void;
  notify: (message: string) => void;
}) {
  return (
    <nav className="chw-nav">
      <button className={active === "dashboard" ? "active" : ""} onClick={() => navigate("chw")}>
        <ChwIcon name="home" />
        <span>Dashboard</span>
      </button>
      <button
        className={active === "patients" ? "active" : ""}
        onClick={() => navigate("chwPatients")}
      >
        <ChwIcon name="people" />
        <span>Patients</span>
      </button>
      <button className="add-patient" onClick={() => notify("New patient registration opened")}>
        <ChwIcon name="plus" strokeWidth={2.5} />
      </button>
      <button className={active === "visits" ? "active" : ""} onClick={() => navigate("chwVisits")}>
        <ChwIcon name="calendar" />
        <span>Visits</span>
      </button>
      <button
        className={active === "profile" ? "active" : ""}
        onClick={() => navigate("chwProfile")}
      >
        <ChwIcon name="user" />
        <span>Profile</span>
      </button>
    </nav>
  );
}

export function ChwPageHeader({ eyebrow, title }: { eyebrow: string; title: string }) {
  return (
    <div className="chw-page-head">
      <div>
        <p>{eyebrow}</p>
        <h1>{title}</h1>
      </div>
      <button className="notification">
        <ChwIcon name="bell" />
        <i />
      </button>
    </div>
  );
}

export function ScheduleCard({
  appointment,
  onClick,
}: {
  appointment: Appointment;
  onClick: () => void;
}) {
  return (
    <button className="schedule-card" onClick={onClick}>
      <div className="schedule-time">
        <b>{appointment.time}</b>
        <span />
      </div>
      <div className="schedule-person">
        <div>
          <h3>{appointment.name}</h3>
          <span className={appointment.urgent ? "visit-status urgent" : "visit-status"}>
            {appointment.status}
          </span>
        </div>
        <p>{appointment.type}</p>
        <small>
          <ChwIcon name="pin" size={12} /> {appointment.location}
        </small>
      </div>
      <ChwIcon name="chevron" size={17} />
    </button>
  );
}
