import type { IconName } from "./Icon";

export type Screen =
  | "login"
  | "home"
  | "care"
  | "sos"
  | "tracking"
  | "vitals"
  | "chw"
  | "patient"
  | "patients"
  | "visits"
  | "profile";

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
  daysLeft: 84,
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
  alwaysOpen: boolean;
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
      alwaysOpen: false,
      services: ["Home visits", "ANC referrals"],
      drive: "2 min",
    },
    {
      icon: "mother",
      name: "Aisha Okello · CHP",
      distance: "1.1 km",
      meta: "On duty · Until 5:00 PM",
      open: true,
      alwaysOpen: false,
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
      alwaysOpen: false,
      services: ["ANC", "Maternity"],
      drive: "4 min",
    },
    {
      icon: "hospital",
      name: "Ushirika Medical Clinic",
      distance: "3.1 km",
      meta: "Open · Closes 6:00 PM",
      open: true,
      alwaysOpen: false,
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
      alwaysOpen: true,
      services: ["Emergency", "Maternity"],
      drive: "9 min",
    },
    {
      icon: "hospital",
      name: "Kenyatta National Hospital",
      distance: "4.9 km",
      meta: "Open 24 hours",
      open: true,
      alwaysOpen: true,
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
      alwaysOpen: true,
      services: ["Emergency", "Basic life support"],
      drive: "9 min",
    },
    {
      icon: "ambulance",
      name: "Nairobi County EMS",
      distance: "3.8 km",
      meta: "Open 24 hours",
      open: true,
      alwaysOpen: true,
      services: ["Emergency", "Inter-facility"],
      drive: "14 min",
    },
  ],
};

export const CARE_FILTERS: Array<{ id: string; label: string }> = [
  { id: "open", label: "Open now" },
  { id: "maternity", label: "Maternity services" },
  { id: "anc", label: "Antenatal care (ANC)" },
  { id: "always", label: "Open 24 hours" },
];

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
  status: "Ambulance is on the way",
  updated: "Updated just now",
} as const;

export interface TimelineStep {
  label: string;
  meta?: string;
}

export const TIMELINE: TimelineStep[] = [
  { label: "Request sent", meta: "10:42 AM" },
  { label: "Accepted", meta: "10:43 AM" },
  { label: "On the way", meta: "10:44 AM" },
  { label: "Arrived" },
  { label: "Heading to hospital" },
];

/* Live progression script: how the trip unfolds on screen */
export const TRACKING_STAGES: Array<{
  status: string;
  eta: string;
  note: string;
  doneSteps: number;
}> = [
  {
    status: "Ambulance is on the way",
    eta: "8 minutes",
    note: "Updated just now",
    doneSteps: 3,
  },
  {
    status: "Ambulance is close by",
    eta: "3 minutes",
    note: "Updated 1 min ago",
    doneSteps: 3,
  },
  {
    status: "Ambulance has arrived",
    eta: "Now",
    note: "Updated just now",
    doneSteps: 4,
  },
  {
    status: "Heading to hospital",
    eta: "12 min to Kibera Health Centre",
    note: "Updated just now",
    doneSteps: 5,
  },
];

/* ------------------------------------------------------------------ */
/* 06 — Vitals (redesigned)                                            */
/* ------------------------------------------------------------------ */

export type VitalsRange = "Hourly" | "Daily" | "Weekly";

export interface VitalsSeries {
  labels: string[];
  systolic: number[];
  diastolic: number[];
  heart: number[];
  bpInsight: string;
  hrSummary: string;
}

export const VITALS: Record<VitalsRange, VitalsSeries> = {
  Hourly: {
    labels: ["6 AM", "8 AM", "10 AM", "12 PM", "2 PM", "NOW"],
    systolic: [112, 114, 116, 115, 117, 118],
    diastolic: [68, 70, 72, 71, 74, 76],
    heart: [76, 81, 78, 84, 79, 82],
    bpInsight: "Steady and healthy — 6 mmHg below this morning’s peak.",
    hrSummary: "Resting range 76–84 bpm",
  },
  Daily: {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    systolic: [116, 114, 119, 117, 121, 116, 118],
    diastolic: [72, 70, 76, 73, 79, 72, 76],
    heart: [78, 76, 80, 79, 83, 77, 82],
    bpInsight: "Averaging 117/74 this week — inside the healthy band.",
    hrSummary: "Weekly average 79 bpm",
  },
  Weekly: {
    labels: ["W23", "W24", "W25", "W26", "W27", "W28"],
    systolic: [108, 110, 112, 114, 116, 118],
    diastolic: [64, 66, 68, 70, 72, 76],
    heart: [74, 75, 77, 78, 80, 82],
    bpInsight: "Mild, expected rise through the third trimester.",
    hrSummary: "Trending with your pregnancy, all normal",
  },
};

export const VITALS_CURRENT = {
  systolic: 118,
  diastolic: 76,
  heartRate: 82,
  heartLow: 64,
  heartHigh: 96,
  device: "AfyaBand",
  synced: "just now",
  weightKg: 68.2,
  weightDelta: "+0.4 this week",
  sleep: "7h 20m",
  sleepDeep: "Deep sleep 2h 05m",
  kicks: 32,
  kicksSince: "since 8 AM",
} as const;

/* Systolic scale used by the category meter */
export const BP_SCALE = { min: 80, max: 160, threshold: 140 } as const;

export const BP_CATEGORIES: Array<{
  key: "low" | "normal" | "elevated" | "high";
  label: string;
  from: number;
  to: number;
}> = [
  { key: "low", label: "Low", from: 80, to: 89 },
  { key: "normal", label: "Normal", from: 90, to: 129 },
  { key: "elevated", label: "Elevated", from: 130, to: 139 },
  { key: "high", label: "High", from: 140, to: 160 },
];

export function bpCategory(sys: number): "low" | "normal" | "elevated" | "high" {
  if (sys < 90) return "low";
  if (sys < 130) return "normal";
  if (sys < 140) return "elevated";
  return "high";
}

export const MINI_METRICS: Array<{
  icon: IconName;
  label: string;
  value: string;
  unit?: string;
  sub: string;
  toast: string;
}> = [
  {
    icon: "scale",
    label: "Weight",
    value: "68.2",
    unit: "kg",
    sub: "+0.4 this week",
    toast: "On track — at week 28, about 0.5 kg a week is healthy.",
  },
  {
    icon: "moon",
    label: "Sleep",
    value: "7h 20m",
    unit: "",
    sub: "Deep sleep 2h 05m",
    toast: "Great rest. Sleeping on your side boosts blood flow to baby.",
  },
  {
    icon: "baby",
    label: "Baby kicks",
    value: "32",
    unit: "today",
    sub: "Counted since 8 AM",
    toast: "32 kicks is a strong, healthy pattern for week 28.",
  },
] as Array<{ icon: IconName; label: string; value: string; unit: string; sub: string; toast: string }>;

/* ------------------------------------------------------------------ */
/* 07 — CHW patient register                                           */
/* ------------------------------------------------------------------ */

export type RiskLevel = "Normal" | "Watch" | "High Risk" | "Not recorded";

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
  series: [128, 132, 136, 134, 141, 145, 148],
  threshold: 140,
};

/* ------------------------------------------------------------------ */
/* Shared: CHP contact, notifications                                  */
/* ------------------------------------------------------------------ */

export const CHP_CONTACT = {
  name: "Grace Wanjiru",
  role: "Community Health Promoter · Kibera",
  initials: "GW",
  hours: "On duty until 6:00 PM",
  prompts: [
    { label: "Book a home visit", toast: "Grace will confirm your home visit shortly" },
    { label: "Ask about swelling", toast: "Sent. Grace typically replies within 10 minutes" },
    { label: "Nutrition advice", toast: "Sent. A nutrition tip sheet is on its way" },
  ],
} as const;

export const NOTIFICATIONS = [
  {
    icon: "calendar" as IconName,
    title: "ANC visit tomorrow",
    body: "10:30 AM · Kibera Health Centre. Bring your clinic book.",
    time: "2h ago",
    tone: "lime" as const,
  },
  {
    icon: "check" as IconName,
    title: "Vitals checked by AfyaNine AI",
    body: "Yesterday’s readings look normal. Keep it up, mama!",
    time: "Yesterday",
    tone: "plain" as const,
  },
  {
    icon: "chat" as IconName,
    title: "Grace shared a health tip",
    body: "Try iron-rich foods like beans and dark greens this week.",
    time: "2 days ago",
    tone: "plain" as const,
  },
];

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
    phoneHint: "Enter the number linked to your AfyaNine account",
    cta: "Continue",
    privacy: "By continuing, you agree to our Terms & Privacy Policy.",
    otpSent: (phone: string) => `Sending a code to +254 ${phone}`,
    tabSignIn: "Sign in",
    tabTest: "Test ward",
    testLead: "Pick a demo account and explore with live AfyaBand data.",
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
    phoneHint: "Weka nambari iliyounganishwa na akaunti yako ya AfyaNine",
    cta: "Endelea",
    privacy: "Kwa kuendelea, unakubali Masharti na Sera ya Faragha.",
    otpSent: (phone: string) => `Tunatuma nambari kwa +254 ${phone}`,
    tabSignIn: "Ingia",
    tabTest: "Wodi ya majaribio",
    testLead: "Chagua akaunti ya majaribio na utumie data hai za AfyaBand.",
  },
} as const;

export const BRAND = {
  tagline: "Nine months. One journey. Connected care.",
} as const;
