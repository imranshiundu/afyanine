import { useState, type ReactNode } from "react";

type Screen = "login" | "home" | "care" | "sos" | "tracking" | "vitals" | "chw" | "patient";
type Role = "mother" | "chw";

const C = {
  ink: "#1A1A1A",
  lime: "#D8F03A",
  red: "#C62828",
  cream: "#F3F0E8",
  card: "#E4DFD5",
};

function Icon({
  name,
  size = 22,
  stroke = "currentColor",
  fill = "none",
  strokeWidth = 1.8,
}: {
  name: string;
  size?: number;
  stroke?: string;
  fill?: string;
  strokeWidth?: number;
}) {
  const paths: Record<string, ReactNode> = {
    heart: (
      <path d="M20.8 4.7a5.5 5.5 0 0 0-7.8 0L12 5.8l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8l1.1 1.1L12 21l7.8-7.4 1.1-1.1a5.5 5.5 0 0 0-.1-7.8Z" />
    ),
    mother: (
      <>
        <circle cx="12" cy="5.2" r="2.7" />
        <path d="M8.4 21v-5.4a5.5 5.5 0 0 1 2-4.3M14.1 8.9c2.1.9 3.5 3 3.5 5.4V21M10.1 12.1c4.5-.5 6.1 2.6 4.4 5.4-1.1 1.8-4.3 1.2-4.3-1.2" />
      </>
    ),
    people: (
      <>
        <circle cx="9" cy="7" r="3" />
        <circle cx="17.5" cy="8.5" r="2.2" />
        <path d="M3.5 20v-2a5.5 5.5 0 0 1 11 0v2M15 14a4.5 4.5 0 0 1 5.5 4.4V20" />
      </>
    ),
    phone: (
      <path
        d="M7.2 2.8 4.5 4.4c-1.1.6-.9 3.5 1.5 7.7s4.8 6 5.9 5.4l2.7-1.6-2.5-4.2-2.2 1.2c-.7-.5-1.3-1.3-1.9-2.3-.6-1-1-1.9-1.1-2.8l2.2-1.3-1.9-3.7Z"
        transform="translate(2 1)"
      />
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
        <path d="M8 13v-2a2 2 0 0 1 2-2h6M14 7l2 2-2 2" />
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
        <path d="M4 21V7h16v14M8 21v-4h8v4M9 11h6M12 8v6" />
        <path d="M7 7V3h10v4" />
      </>
    ),
    activity: <path d="M3 12h4l2.2-6 4.2 12 2.3-6H21" />,
    warning: (
      <>
        <path d="M10.3 3.6 2.2 18a2 2 0 0 0 1.8 3h16a2 2 0 0 0 1.8-3L13.7 3.6a2 2 0 0 0-3.4 0Z" />
        <path d="M12 9v4M12 17h.01" />
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
        <path d="M5 10v11h14V10M9 21v-7h6v7" />
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
        <path d="M4 6h16M4 12h16M4 18h16" />
        <circle cx="9" cy="6" r="2" fill={C.cream} />
        <circle cx="15" cy="12" r="2" fill={C.cream} />
        <circle cx="8" cy="18" r="2" fill={C.cream} />
      </>
    ),
    chevron: <path d="m9 18 6-6-6-6" />,
    ambulance: (
      <>
        <path d="M3 7h11v11H3zM14 11h4l3 4v3h-7z" />
        <circle cx="7" cy="19" r="2" fill={C.cream} />
        <circle cx="18" cy="19" r="2" fill={C.cream} />
        <path d="M7 10v5M4.5 12.5h5" />
      </>
    ),
    check: <path d="m5 12 4 4L19 6" />,
    plus: <path d="M12 5v14M5 12h14" />,
    more: (
      <>
        <circle cx="5" cy="12" r="1" fill="currentColor" />
        <circle cx="12" cy="12" r="1" fill="currentColor" />
        <circle cx="19" cy="12" r="1" fill="currentColor" />
      </>
    ),
    edit: (
      <>
        <path d="m4 20 4.2-1 10.5-10.5a2.1 2.1 0 0 0-3-3L5.2 16 4 20Z" />
        <path d="m14 7 3 3" />
      </>
    ),
  };
  return (
    <svg
      aria-hidden="true"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={fill}
      stroke={stroke}
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      {paths[name]}
    </svg>
  );
}

function Logo({ light = false }: { light?: boolean }) {
  return (
    <div className="logo">
      <span className={light ? "logo-mark light" : "logo-mark"}>
        <Icon
          name="heart"
          size={23}
          fill={light ? C.ink : C.lime}
          stroke={C.ink}
          strokeWidth={2.2}
        />
      </span>
      <span style={{ color: light ? "white" : C.ink }}>MamaWatch</span>
    </div>
  );
}

function Header({
  title,
  onBack,
  dark = false,
  action,
}: {
  title: string;
  onBack?: () => void;
  dark?: boolean;
  action?: ReactNode;
}) {
  return (
    <header className={`screen-header ${dark ? "dark" : ""}`}>
      {onBack ? (
        <button className="icon-button" onClick={onBack} aria-label="Go back">
          <Icon name="back" />
        </button>
      ) : (
        <span className="header-spacer" />
      )}
      <h2>{title}</h2>
      {action || <span className="header-spacer" />}
    </header>
  );
}

function Login({ navigate }: { navigate: (screen: Screen) => void }) {
  const [role, setRole] = useState<Role>("mother");
  const [language, setLanguage] = useState<"EN" | "SW">("EN");
  const [phone, setPhone] = useState("");
  const sw = language === "SW";
  return (
    <main className="screen login-screen">
      <div className="login-top">
        <div className="language-toggle">
          {(["EN", "SW"] as const).map((l) => (
            <button
              key={l}
              onClick={() => setLanguage(l)}
              className={language === l ? "active" : ""}
            >
              {l}
            </button>
          ))}
        </div>
        <Logo />
        <p className="eyebrow">{sw ? "AFYA YAKO. SAFARI YAKO." : "YOUR HEALTH. YOUR JOURNEY."}</p>
        <h1>{sw ? "Karibu, mama." : "Welcome, mama."}</h1>
        <p className="lead">
          {sw
            ? "Msaada unaoaminika kwa kila hatua ya safari yako ya ujauzito."
            : "Trusted support for every step of your pregnancy journey."}
        </p>
      </div>
      <section>
        <label className="field-label">{sw ? "Ninaingia kama" : "I am signing in as"}</label>
        <div className="role-grid">
          <button
            className={`role-card ${role === "mother" ? "selected" : ""}`}
            onClick={() => setRole("mother")}
          >
            <span className="role-icon">
              <Icon name="mother" size={28} />
            </span>
            <span>
              <b>{sw ? "Mimi ni Mama" : "I'm a Mother"}</b>
              <small>{sw ? "Fuatilia afya yako" : "Track your health"}</small>
            </span>
            <i>{role === "mother" && <Icon name="check" size={15} strokeWidth={3} />}</i>
          </button>
          <button
            className={`role-card ${role === "chw" ? "selected" : ""}`}
            onClick={() => setRole("chw")}
          >
            <span className="role-icon">
              <Icon name="people" size={28} />
            </span>
            <span>
              <b>{sw ? "Mimi ni CHW" : "I'm a CHW"}</b>
              <small>{sw ? "Hudumia jamii yako" : "Support your community"}</small>
            </span>
            <i>{role === "chw" && <Icon name="check" size={15} strokeWidth={3} />}</i>
          </button>
        </div>
        <label className="field-label" htmlFor="phone">
          {sw ? "Nambari ya simu" : "Phone number"}
        </label>
        <div className="phone-field">
          <span>+254</span>
          <input
            id="phone"
            inputMode="numeric"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            placeholder="712 345 678"
          />
        </div>
        <button
          className="primary-button"
          onClick={() => navigate(role === "mother" ? "home" : "chw")}
        >
          {sw ? "Endelea" : "Continue"} <Icon name="arrow" />
        </button>
        <p className="privacy">
          {sw
            ? "Kwa kuendelea, unakubali Masharti na Sera ya Faragha."
            : "By continuing, you agree to our Terms & Privacy Policy."}
        </p>
      </section>
    </main>
  );
}

function BottomNav({ active, navigate }: { active: string; navigate: (s: Screen) => void }) {
  return (
    <nav className="bottom-nav">
      <button className={active === "home" ? "active" : ""} onClick={() => navigate("home")}>
        <Icon name="home" />
        <span>Home</span>
      </button>
      <button className={active === "care" ? "active" : ""} onClick={() => navigate("care")}>
        <Icon name="pin" />
        <span>Care</span>
      </button>
      <button className="sos-nav" onClick={() => navigate("sos")}>
        <span>SOS</span>
      </button>
      <button className={active === "vitals" ? "active" : ""} onClick={() => navigate("vitals")}>
        <Icon name="activity" />
        <span>Vitals</span>
      </button>
      <button>
        <Icon name="user" />
        <span>Profile</span>
      </button>
    </nav>
  );
}

function Home({
  navigate,
  notify,
}: {
  navigate: (s: Screen) => void;
  notify: (s: string) => void;
}) {
  const actions = [
    ["pin", "Find care", "Nearby services", "care"],
    ["activity", "My vitals", "Wearable data", "vitals"],
    ["warning", "Danger signs", "Know the signs", "sos"],
    ["chat", "Talk to my CHP", "Get support", "notify"],
  ];
  return (
    <main className="screen with-nav">
      <div className="home-head">
        <div>
          <p>Good morning,</p>
          <h1>Wanjiku</h1>
        </div>
        <button className="notification">
          <Icon name="bell" />
          <i />
        </button>
      </div>
      <section className="pregnancy-card">
        <div className="week-ring">
          <svg viewBox="0 0 120 120">
            <circle cx="60" cy="60" r="52" />
            <circle className="progress" cx="60" cy="60" r="52" />
          </svg>
          <div>
            <small>WEEK</small>
            <b>28</b>
            <span>of 40</span>
          </div>
        </div>
        <div className="pregnancy-copy">
          <span className="tag">Third trimester</span>
          <h2>Your baby is growing beautifully.</h2>
          <p>About the size of an eggplant</p>
        </div>
      </section>
      <section className="appointment-card">
        <div className="appointment-title">
          <span className="square-icon">
            <Icon name="calendar" />
          </span>
          <div>
            <small>NEXT ANC VISIT</small>
            <h3>Tuesday, 18 June</h3>
            <p>10:30 · Kibera Health Centre</p>
          </div>
        </div>
        <div className="appointment-actions">
          <button onClick={() => notify("Opening directions to Kibera Health Centre")}>
            <Icon name="direction" size={17} /> Directions
          </button>
          <button onClick={() => notify("Reschedule request started")}>Reschedule</button>
        </div>
      </section>
      <div className="section-title">
        <h2>How can we help?</h2>
        <button onClick={() => navigate("care")}>See all</button>
      </div>
      <section className="quick-grid">
        {actions.map(([icon, title, sub, destination]) => (
          <button
            key={title}
            onClick={() =>
              destination === "notify"
                ? notify("Your CHP will call you shortly")
                : navigate(destination as Screen)
            }
          >
            <span>
              <Icon name={icon} />
            </span>
            <b>{title}</b>
            <small>{sub}</small>
          </button>
        ))}
      </section>
      <button className="emergency-button" onClick={() => navigate("sos")}>
        <span>
          <Icon name="phone" stroke="white" size={25} />
        </span>
        <div>
          <b>I need help now</b>
          <small>Emergency support, 24/7</small>
        </div>
        <Icon name="chevron" stroke="white" />
      </button>
      <BottomNav active="home" navigate={navigate} />
    </main>
  );
}

function FindCare({
  navigate,
  notify,
}: {
  navigate: (s: Screen) => void;
  notify: (s: string) => void;
}) {
  const [tab, setTab] = useState("Health centre");
  const [view, setView] = useState<"Map" | "List">("List");
  const facilities = [
    {
      name: "Kibera Health Centre",
      distance: "0.8 km",
      meta: "Open · Closes 8:00 PM",
      services: ["ANC", "Maternity"],
      time: "4 min",
    },
    {
      name: "Mbagathi Hospital",
      distance: "2.4 km",
      meta: "Open 24 hours",
      services: ["Emergency", "Maternity"],
      time: "9 min",
    },
    {
      name: "Ushirika Medical Clinic",
      distance: "3.1 km",
      meta: "Open · Closes 6:00 PM",
      services: ["ANC", "Pharmacy"],
      time: "12 min",
    },
  ];
  return (
    <main className="screen with-nav care-screen">
      <Header
        title="Find care"
        onBack={() => navigate("home")}
        action={
          <button className="icon-button">
            <Icon name="search" />
          </button>
        }
      />
      <div className="care-tabs">
        {["CHP", "Health centre", "Hospital", "Ambulance"].map((x) => (
          <button className={tab === x ? "active" : ""} onClick={() => setTab(x)} key={x}>
            {x}
          </button>
        ))}
      </div>
      <div className="map-preview">
        <div className="road r1" />
        <div className="road r2" />
        <div className="road r3" />
        <span className="map-pin p1">
          <Icon name="hospital" size={17} />
        </span>
        <span className="map-pin p2">
          <Icon name="hospital" size={17} />
        </span>
        <span className="you-dot" />
        <div className="view-toggle">
          {(["Map", "List"] as const).map((v) => (
            <button onClick={() => setView(v)} className={view === v ? "active" : ""} key={v}>
              {v}
            </button>
          ))}
        </div>
      </div>
      <div className="filter-row">
        <button className="filter-main">
          <Icon name="sliders" size={17} /> Filters
        </button>
        <button>Open now</button>
        <button>Maternity</button>
      </div>
      <div className="result-count">
        <b>{tab === "Ambulance" ? "4 services" : "12 places nearby"}</b>
        <span>Nearest first</span>
      </div>
      <div className="facility-list">
        {facilities.map((f, i) => (
          <button
            className="facility-card"
            key={f.name}
            onClick={() => notify(`Opening directions to ${f.name}`)}
          >
            <div className="facility-icon">
              <Icon name="hospital" size={25} />
            </div>
            <div className="facility-content">
              <div className="facility-title">
                <h3>{f.name}</h3>
                <span>{f.distance}</span>
              </div>
              <p className={i === 1 ? "open all" : "open"}>{f.meta}</p>
              <div>
                {f.services.map((s) => (
                  <span className="service-chip" key={s}>
                    {s}
                  </span>
                ))}
              </div>
              <small>
                <Icon name="direction" size={14} /> {f.time} drive
              </small>
            </div>
            <Icon name="chevron" size={18} />
          </button>
        ))}
      </div>
      <BottomNav active="care" navigate={navigate} />
    </main>
  );
}

function Sos({ navigate }: { navigate: (s: Screen) => void }) {
  const emergencies = [
    ["activity", "Bleeding", "Heavy or unexpected bleeding"],
    ["mother", "Labour", "Contractions or water broken"],
    ["warning", "Severe headache", "Or blurred vision"],
    ["activity", "Fits", "Shaking or loss of consciousness"],
    ["heart", "Baby not moving", "Less movement than usual"],
    ["more", "Other", "Something else feels wrong"],
  ];
  return (
    <main className="screen sos-screen">
      <section className="sos-header">
        <button onClick={() => navigate("home")} className="icon-button red-back">
          <Icon name="back" stroke="white" />
        </button>
        <div className="sos-symbol">
          <Icon name="plus" size={31} stroke="white" strokeWidth={2.5} />
        </div>
        <p>EMERGENCY HELP</p>
        <h1>
          Is this an
          <br />
          emergency?
        </h1>
        <span>Tell us what is happening. Help will be sent immediately.</span>
      </section>
      <section className="sos-options">
        <p className="field-label">CHOOSE ONE OPTION</p>
        {emergencies.map(([icon, title, sub]) => (
          <button key={title} onClick={() => navigate("tracking")}>
            <span className="emergency-icon">
              <Icon name={icon} size={23} />
            </span>
            <div>
              <b>{title}</b>
              <small>{sub}</small>
            </div>
            <Icon name="chevron" />
          </button>
        ))}
        <div className="emergency-call">
          <span>Need to speak to emergency services?</span>
          <div>
            <a href="tel:999">
              <Icon name="phone" size={17} /> Call 999
            </a>
            <i /> <a href="tel:112">Call 112</a>
          </div>
        </div>
      </section>
    </main>
  );
}

function Tracking({
  navigate,
  notify,
}: {
  navigate: (s: Screen) => void;
  notify: (s: string) => void;
}) {
  return (
    <main className="screen tracking-screen">
      <div className="tracking-map">
        <div className="map-label l1">KIBERA</div>
        <div className="map-label l2">JAMHURI</div>
        <div className="road tr1" />
        <div className="road tr2" />
        <div className="road tr3" />
        <div className="road tr4" />
        <svg className="route" viewBox="0 0 390 440" preserveAspectRatio="none">
          <path d="M72 365 C105 300, 91 250, 170 225 S220 150, 316 95" />
          <circle cx="72" cy="365" r="7" />
        </svg>
        <button className="tracking-back" onClick={() => navigate("home")}>
          <Icon name="back" />
        </button>
        <div className="eta-pill">
          <span>
            <Icon name="ambulance" size={20} />
          </span>
          <div>
            <small>ESTIMATED ARRIVAL</small>
            <b>8 minutes</b>
          </div>
        </div>
        <span className="destination-pin">
          <Icon name="pin" size={33} fill={C.red} stroke="white" />
        </span>
        <span className="ambulance-pin">
          <Icon name="ambulance" size={23} />
        </span>
      </div>
      <section className="tracking-sheet">
        <div className="grabber" />
        <div className="tracking-status">
          <span className="live-dot" />
          <b>Ambulance is on the way</b>
          <small>Updated just now</small>
        </div>
        <div className="driver-card">
          <span className="avatar">JM</span>
          <div>
            <small>ST. JOHN AMBULANCE</small>
            <h3>KCA 482M</h3>
            <p>Driver · Joseph Mwangi</p>
          </div>
          <button onClick={() => notify("Calling driver Joseph Mwangi")}>
            <Icon name="phone" size={20} />
            <span>Call</span>
          </button>
        </div>
        <div className="timeline">
          {["Request sent", "Accepted", "On the way", "Arrived", "Heading to hospital"].map(
            (x, i) => (
              <div className={i < 3 ? "done" : ""} key={x}>
                <span>{i < 3 && <Icon name="check" size={12} strokeWidth={3} />}</span>
                <b>{x}</b>
                {i === 0 && <small>10:42 AM</small>}
                {i === 1 && <small>10:43 AM</small>}
                {i === 2 && <em>Now</em>}
              </div>
            ),
          )}
        </div>
        <p className="tracking-note">Stay where you are if it is safe. Keep your phone nearby.</p>
      </section>
    </main>
  );
}

function LineChart({ danger = false, compact = false }: { danger?: boolean; compact?: boolean }) {
  return (
    <svg
      className={`line-chart ${compact ? "compact" : ""}`}
      viewBox="0 0 300 100"
      preserveAspectRatio="none"
    >
      <g className="chart-grid">
        <line x1="0" y1="20" x2="300" y2="20" />
        <line x1="0" y1="50" x2="300" y2="50" />
        <line x1="0" y1="80" x2="300" y2="80" />
      </g>
      <path
        className={danger ? "danger-area" : "chart-area"}
        d={
          danger
            ? "M0 75 C25 65 35 71 56 60 S90 68 112 52 S148 57 170 38 S205 48 226 24 S260 42 300 16 L300 100 L0 100Z"
            : "M0 63 C30 57 45 66 72 48 S110 60 134 44 S175 50 195 31 S235 45 255 29 S280 25 300 18 L300 100 L0 100Z"
        }
      />
      <path
        className={danger ? "danger-line" : "chart-line"}
        d={
          danger
            ? "M0 75 C25 65 35 71 56 60 S90 68 112 52 S148 57 170 38 S205 48 226 24 S260 42 300 16"
            : "M0 63 C30 57 45 66 72 48 S110 60 134 44 S175 50 195 31 S235 45 255 29 S280 25 300 18"
        }
      />
    </svg>
  );
}

function Vitals({ navigate }: { navigate: (s: Screen) => void }) {
  const [period, setPeriod] = useState("Hourly");
  return (
    <main className="screen vitals-screen">
      <Header
        title="My vitals"
        onBack={() => navigate("home")}
        action={
          <button className="icon-button">
            <Icon name="more" />
          </button>
        }
      />
      <div className="sync-state">
        <span />
        <p>
          <b>Live wearable connected</b>
          <small>Last synced just now</small>
        </p>
        <Icon name="check" size={16} />
      </div>
      <div className="period-tabs">
        {["Hourly", "Daily", "Weekly"].map((x) => (
          <button key={x} className={period === x ? "active" : ""} onClick={() => setPeriod(x)}>
            {x}
          </button>
        ))}
      </div>
      <section className="vital-card">
        <div className="vital-card-head">
          <div>
            <span className="vital-icon">
              <Icon name="activity" />
            </span>
            <p>
              <small>BLOOD PRESSURE</small>
              <b>
                118<em>/76</em>
              </b>
              <i>mmHg</i>
            </p>
          </div>
          <span className="status normal">Normal</span>
        </div>
        <LineChart />
        <div className="chart-axis">
          <span>6 AM</span>
          <span>9 AM</span>
          <span>12 PM</span>
          <span>NOW</span>
        </div>
        <p className="insight">
          <span>
            <Icon name="check" size={14} />
          </span>
          Your blood pressure is in a healthy range.
        </p>
      </section>
      <section className="vital-card heart-card">
        <div className="vital-card-head">
          <div>
            <span className="vital-icon">
              <Icon name="heart" fill={C.lime} />
            </span>
            <p>
              <small>HEART RATE</small>
              <b>82</b>
              <i>bpm</i>
            </p>
          </div>
          <span className="status normal">Normal</span>
        </div>
        <LineChart compact />
        <div className="chart-axis">
          <span>6 AM</span>
          <span>9 AM</span>
          <span>12 PM</span>
          <span>NOW</span>
        </div>
      </section>
      <div className="vitals-tip">
        <Icon name="activity" />
        <p>
          <b>Today’s readings look good</b>
          <small>Keep wearing your MamaBand throughout the day.</small>
        </p>
      </div>
      <button className="emergency-button vitals-emergency" onClick={() => navigate("sos")}>
        <span>
          <Icon name="phone" stroke="white" />
        </span>
        <div>
          <b>SOS — I need help</b>
          <small>Get emergency support now</small>
        </div>
        <Icon name="chevron" stroke="white" />
      </button>
    </main>
  );
}

const patients = [
  {
    initials: "WG",
    name: "Wanjiku Gathoni",
    week: "28 weeks",
    bp: "148/96",
    risk: "High Risk",
    high: true,
    color: "#B98F70",
  },
  {
    initials: "AM",
    name: "Amina Mohamed",
    week: "34 weeks",
    bp: "122/78",
    risk: "Normal",
    color: "#7A9084",
  },
  {
    initials: "NO",
    name: "Njeri Otieno",
    week: "22 weeks",
    bp: "116/74",
    risk: "Normal",
    color: "#A78471",
  },
  {
    initials: "FK",
    name: "Faith Kamau",
    week: "37 weeks",
    bp: "139/89",
    risk: "Watch",
    color: "#8A7775",
  },
  {
    initials: "SA",
    name: "Sarah Achieng",
    week: "18 weeks",
    bp: "118/76",
    risk: "Normal",
    color: "#A0926C",
  },
];

function ChwDashboard({ navigate }: { navigate: (s: Screen) => void }) {
  const [query, setQuery] = useState("");
  const filtered = patients.filter((p) => p.name.toLowerCase().includes(query.toLowerCase()));
  return (
    <main className="screen chw-screen">
      <div className="chw-head">
        <div>
          <p>TUESDAY, 18 JUNE</p>
          <h1>
            Good morning,
            <br />
            Grace
          </h1>
        </div>
        <button className="notification">
          <Icon name="bell" />
          <i />
        </button>
      </div>
      <button className="alert-banner" onClick={() => navigate("tracking")}>
        <span className="alert-icon">
          <Icon name="ambulance" size={25} stroke="white" />
        </span>
        <div>
          <small>ACTIVE EMERGENCY</small>
          <b>Wanjiku Gathoni needs help</b>
          <p>
            <Icon name="pin" size={14} /> Kibera · Ambulance arriving in 8 min
          </p>
        </div>
        <Icon name="chevron" stroke="white" />
      </button>
      <div className="stats-row">
        <div>
          <b>24</b>
          <span>Patients</span>
        </div>
        <div>
          <b className="red-text">3</b>
          <span>Need attention</span>
        </div>
        <div>
          <b>5</b>
          <span>Visits today</span>
        </div>
      </div>
      <div className="section-title patients-title">
        <h2>My patients</h2>
        <button>View all</button>
      </div>
      <div className="search-box">
        <Icon name="search" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search patients"
        />
        <button>
          <Icon name="sliders" size={18} />
        </button>
      </div>
      <div className="patient-list">
        {filtered.map((p) => (
          <button className="patient-row" key={p.name} onClick={() => navigate("patient")}>
            <span className="patient-avatar" style={{ background: p.color }}>
              {p.initials}
            </span>
            <div className="patient-info">
              <h3>{p.name}</h3>
              <p>
                {p.week} <i /> BP <b className={p.high ? "red-text" : ""}>{p.bp}</b>
              </p>
            </div>
            <span className={`risk ${p.high ? "high" : p.risk === "Watch" ? "watch" : ""}`}>
              {p.risk}
            </span>
            <Icon name="chevron" size={17} />
          </button>
        ))}
      </div>
      <nav className="chw-nav">
        <button className="active">
          <Icon name="home" />
          <span>Dashboard</span>
        </button>
        <button>
          <Icon name="people" />
          <span>Patients</span>
        </button>
        <button className="add-patient">
          <Icon name="plus" stroke={C.ink} strokeWidth={2.5} />
        </button>
        <button>
          <Icon name="calendar" />
          <span>Visits</span>
        </button>
        <button onClick={() => navigate("login")}>
          <Icon name="user" />
          <span>Profile</span>
        </button>
      </nav>
    </main>
  );
}

function PatientDetail({
  navigate,
  notify,
}: {
  navigate: (s: Screen) => void;
  notify: (s: string) => void;
}) {
  const [note, setNote] = useState("");
  return (
    <main className="screen patient-screen">
      <Header
        title="Patient details"
        onBack={() => navigate("chw")}
        action={
          <button className="icon-button">
            <Icon name="more" />
          </button>
        }
      />
      <section className="patient-profile">
        <span className="patient-avatar large">WG</span>
        <div>
          <h1>Wanjiku Gathoni</h1>
          <p>28 weeks pregnant · Age 29</p>
          <span>ID MW-1048</span>
        </div>
        <button onClick={() => notify("Calling Wanjiku Gathoni")}>
          <Icon name="phone" size={19} />
          <span>Call</span>
        </button>
      </section>
      <section className="ai-alert">
        <div className="ai-title">
          <span>
            <Icon name="warning" size={22} stroke="white" />
          </span>
          <div>
            <small>MAMAWATCH AI ALERT · TODAY, 10:36</small>
            <h2>High Risk: Possible Preeclampsia</h2>
          </div>
        </div>
        <p>
          Blood pressure has remained above 140/90 for the past 3 readings, with a rising trend.
        </p>
        <div>
          <span>
            <b>148/96</b>
            <small>Latest BP</small>
          </span>
          <i />
          <span>
            <b>+12%</b>
            <small>7-day increase</small>
          </span>
        </div>
        <button onClick={() => notify("Alert marked for urgent follow-up")}>
          Mark for urgent follow-up <Icon name="arrow" size={17} />
        </button>
      </section>
      <section className="bp-card">
        <div className="card-title">
          <div>
            <p>BLOOD PRESSURE TREND</p>
            <h2>Elevated and rising</h2>
          </div>
          <span className="status high">High</span>
        </div>
        <div className="bp-chart-wrap">
          <div className="bp-labels">
            <span>160</span>
            <span>140</span>
            <span>120</span>
            <span>100</span>
          </div>
          <LineChart danger />
        </div>
        <div className="chart-axis detail-axis">
          <span>12 Jun</span>
          <span>14 Jun</span>
          <span>16 Jun</span>
          <span>Today</span>
        </div>
        <div className="legend">
          <span>
            <i /> Systolic
          </span>
          <span>
            <i /> Healthy threshold
          </span>
        </div>
      </section>
      <section className="notes-card">
        <div className="card-title">
          <div>
            <p>VISIT NOTES</p>
            <h2>Add a note</h2>
          </div>
          <Icon name="edit" />
        </div>
        <textarea
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Add symptoms, observations or follow-up actions..."
        />
        <button
          className="primary-button"
          onClick={() => {
            notify(note ? "Note saved to patient record" : "Add a note before saving");
            if (note) setNote("");
          }}
        >
          Save note <Icon name="check" />
        </button>
      </section>
      <button className="outline-call" onClick={() => notify("Calling Wanjiku Gathoni")}>
        <Icon name="phone" /> Call patient
      </button>
    </main>
  );
}

export default function App() {
  const [screen, setScreen] = useState<Screen>("login");
  const [toast, setToast] = useState("");

  const navigate = (next: Screen) => {
    setScreen(next);
    document.querySelector(".app-shell")?.scrollTo({ top: 0, behavior: "smooth" });
  };
  const notify = (message: string) => {
    setToast(message);
    window.setTimeout(() => setToast(""), 2400);
  };

  return (
    <div className="page">
      <div className="app-shell">
        {screen === "login" && <Login navigate={navigate} />}
        {screen === "home" && <Home navigate={navigate} notify={notify} />}
        {screen === "care" && <FindCare navigate={navigate} notify={notify} />}
        {screen === "sos" && <Sos navigate={navigate} />}
        {screen === "tracking" && <Tracking navigate={navigate} notify={notify} />}
        {screen === "vitals" && <Vitals navigate={navigate} />}
        {screen === "chw" && <ChwDashboard navigate={navigate} />}
        {screen === "patient" && <PatientDetail navigate={navigate} notify={notify} />}
        {toast && (
          <div className="toast">
            <Icon name="check" size={17} strokeWidth={3} />
            {toast}
          </div>
        )}
      </div>
    </div>
  );
}
