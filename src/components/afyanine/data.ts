import type { IconName } from "./Icon";

export type Screen =
  | "login"
  | "home"
  | "care"
  | "sos"
  | "tracking"
  | "vitals"
  | "chw"
  | "patient";

export type Role = "mother" | "chw";
export type Lang = "EN" | "SW";

/* ------------------------------------------------------------------ */
/* Mother: pregnancy snapshot                                          */
/* ------------------------------------------------------------------ */

export const PREGNANCY = {
  week: 28,
  totalWeeks: 40,
  trimester: "Third trimester",
  headline: "Your baby is growing beautifully.",
  size: "About the size of an eggplant",
} as const;

export const ANC_VISIT = {
  label: "NEXT ANC VISIT",
  date: "Tuesday, 18 June",
  detail: "10:30 · Kibera Health Centre",
  place: "Kibera Health Centre",
} as const;

export const QUICK_ACTIONS: Array<{
  icon: IconName;
  title: string;
  sub: string;
  dest: Screen | "chp-call";
}> = [
  { icon: "pin", title: "Find care", sub: "Nearby services", dest: "care" },
  { icon: "activity", title: "My vitals", sub: "Wearable data", dest: "vitals" },
  { icon: "warning", title: "Danger signs", sub: "Know the signs", dest: "sos" },
  { icon: "chat", title: "Talk to my CHP", sub: "Get support", dest: "chp-call" },
];

/* ------------------------------------------------------------------ */
/* 03 — Find care                                                      */
/* ------------------------------------------------------------------ */

export const CARE_TABS = ["CHP", "Health centre", "Hospital", "Ambulance"] as const;
export type CareTab = (typeof CARE_TABS)[number];

export interface Facility {
  icon: IconName;
  name: string;
  distance: string;
  meta: string;
  open: boolean;
  services: string[];
  drive: string;
}

export const FACILITIES: Record<CareTab, Facility[]> = {
  CHP: [
    {
      icon: "mother",
      name: "Grace Wanjiru · CHP",
      distance: "0.3 km",
      meta: "On duty · Until 6:00 PM",
      open: true,
      services: ["Home visits", "ANC referrals"],
      drive: "2 min",
    },
    {
      icon: "mother",
      name: "Aisha Okello · CHP",
      distance: "1.1 km",
      meta: "On duty · Until 5:00 PM",
      open: true,
      services: ["Home visits", "Health talks"],
      drive: "5 min",
    },
  ],
  "Health centre": [
    {
      icon: "hospital",
      name: "Kibera Health Centre",
      distance: "0.8 km",
      meta: "Open · Closes 8:00 PM",
      open: true,
      services: ["ANC", "Maternity"],
      drive: "4 min",
    },
    {
      icon: "hospital",
      name: "Ushirika Medical Clinic",
      distance: "3.1 km",
      meta: "Open · Closes 6:00 PM",
      open: true,
      services: ["ANC", "Pharmacy"],
      drive: "12 min",
    },
  ],
  Hospital: [
    {
      icon: "hospital",
      name: "Mbagathi Hospital",
      distance: "2.4 km",
      meta: "Open 24 hours",
      open: true,
      services: ["Emergency", "Maternity"],
      drive: "9 min",
    },
    {
      icon: "hospital",
      name: "Kenyatta National Hospital",
      distance: "4.9 km",
      meta: "Open 24 hours",
      open: true,
      services: ["Emergency", "Maternity", "NICU"],
      drive: "18 min",
    },
  ],
  Ambulance: [
    {
      icon: "ambulance",
      name: "St John Ambulance Kenya",
      distance: "2.4 km",
      meta: "Open 24 hours",
      open: true,
      services: ["Emergency", "Basic life support"],
      drive: "9 min",
    },
    {
      icon: "ambulance",
      name: "Nairobi County EMS",
      distance: "3.8 km",
      meta: "Open 24 hours",
      open: true,
      services: ["Emergency", "Inter-facility"],
      drive: "14 min",
    },
  ],
};

/* ------------------------------------------------------------------ */
/* 04 — SOS                                                            */
/* ------------------------------------------------------------------ */

export const EMERGENCY_TYPES: Array<{
  icon: IconName;
  title: string;
  sub: string;
}> = [
  { icon: "droplet", title: "Bleeding", sub: "Heavy or unexpected bleeding" },
  { icon: "mother", title: "Labour", sub: "Contractions or water broken" },
  { icon: "warning", title: "Severe headache", sub: "Or blurred vision" },
  { icon: "zap", title: "Fits", sub: "Shaking or loss of consciousness" },
  { icon: "heart", title: "Baby not moving", sub: "Less movement than usual" },
  { icon: "more", title: "Other", sub: "Something else feels wrong" },
];

/* ------------------------------------------------------------------ */
/* 05 — Live tracking                                                  */
/* ------------------------------------------------------------------ */

export const AMBULANCE = {
  service: "ST. JOHN AMBULANCE",
  plate: "KCA 482M",
  driver: "Joseph Mwangi",
  initials: "JM",
  eta: "8 minutes",
  status: "Ambulance is on the way",
  updated: "Updated just now",
} as const;

export const TIMELINE: Array<{
  label: string;
  meta?: string;
  done?: boolean;
  live?: boolean;
}> = [
  { label: "Request sent", meta: "10:42 AM", done: true },
  { label: "Accepted", meta: "10:43 AM", done: true },
  { label: "On the way", meta: "Now", done: true, live: true },
  { label: "Arrived" },
  { label: "Heading to hospital" },
];

/* ------------------------------------------------------------------ */
/* 07 — CHW patient register                                           */
/* ------------------------------------------------------------------ */

export type RiskLevel = "Normal" | "Watch" | "High Risk";

export interface Patient {
  id: string;
  initials: string;
  name: string;
  week: string;
  age: number;
  bp: string;
  systolic: number;
  diastolic: number;
  risk: RiskLevel;
  color: string;
}

export const PATIENTS: Patient[] = [
  {
    id: "MW-1048",
    initials: "WG",
    name: "Wanjiku Gathoni",
    week: "28 weeks",
    age: 29,
    bp: "148/96",
    systolic: 148,
    diastolic: 96,
    risk: "High Risk",
    color: "#B98F70",
  },
  {
    id: "MW-1032",
    initials: "AM",
    name: "Amina Mohamed",
    week: "34 weeks",
    age: 26,
    bp: "122/78",
    systolic: 122,
    diastolic: 78,
    risk: "Normal",
    color: "#7A9084",
  },
  {
    id: "MW-1051",
    initials: "NO",
    name: "Njeri Otieno",
    week: "22 weeks",
    age: 31,
    bp: "116/74",
    systolic: 116,
    diastolic: 74,
    risk: "Normal",
    color: "#A78471",
  },
  {
    id: "MW-0987",
    initials: "FK",
    name: "Faith Kamau",
    week: "37 weeks",
    age: 24,
    bp: "139/89",
    systolic: 139,
    diastolic: 89,
    risk: "Watch",
    color: "#8A7775",
  },
  {
    id: "MW-1102",
    initials: "SA",
    name: "Sarah Achieng",
    week: "18 weeks",
    age: 27,
    bp: "118/76",
    systolic: 118,
    diastolic: 76,
    risk: "Normal",
    color: "#A0926C",
  },
];

export const CHW = {
  firstName: "Grace",
  date: "TUESDAY, 18 JUNE",
  stats: { patients: 24, attention: 3, visits: 5 },
  emergency: {
    label: "ACTIVE EMERGENCY",
    who: "Wanjiku Gathoni needs help",
    where: "Kibera · Ambulance arriving in 8 min",
  },
} as const;

/* ------------------------------------------------------------------ */
/* 08 — Patient detail (the flagged patient)                           */
/* ------------------------------------------------------------------ */

export const FLAGGED = PATIENTS[0];

export const AI_ALERT = {
  label: "AFYANINE AI ALERT · TODAY, 10:36",
  title: "High Risk: Possible Preeclampsia",
  reason:
    "Blood pressure has remained above 140/90 for the past 3 readings, with a rising trend.",
  latestBp: "148/96",
  trend: "+12%",
  trendLabel: "7-day increase",
} as const;

export const BP_TREND = {
  label: "BLOOD PRESSURE TREND",
  headline: "Elevated and rising",
  status: "High" as const,
  axis: ["12 Jun", "14 Jun", "16 Jun", "Today"],
  yLabels: ["160", "140", "120", "100"],
};

/* ------------------------------------------------------------------ */
/* 01 — Login copy (EN / SW)                                           */
/* ------------------------------------------------------------------ */

export const LOGIN_COPY = {
  EN: {
    eyebrow: "YOUR HEALTH. YOUR JOURNEY.",
    welcome: "Welcome, mama.",
    lead: "Trusted support for every step of your pregnancy journey.",
    signInAs: "I am signing in as",
    mother: "I'm a Mother",
    motherSub: "Track your health",
    chw: "I'm a CHW",
    chwSub: "Support your community",
    phone: "Phone number",
    cta: "Continue",
    privacy: "By continuing, you agree to our Terms & Privacy Policy.",
  },
  SW: {
    eyebrow: "AFYA YAKO. SAFARI YAKO.",
    welcome: "Karibu, mama.",
    lead: "Msaada unaoaminika kwa kila hatua ya safari yako ya ujauzito.",
    signInAs: "Ninaingia kama",
    mother: "Mimi ni Mama",
    motherSub: "Fuatilia afya yako",
    chw: "Mimi ni CHW",
    chwSub: "Hudumia jamii yako",
    phone: "Nambari ya simu",
    cta: "Endelea",
    privacy: "Kwa kuendelea, unakubali Masharti na Sera ya Faragha.",
  },
} as const;

export const BRAND = {
  tagline: "Nine months. One journey. Connected care.",
} as const;
