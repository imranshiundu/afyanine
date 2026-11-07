/**
 * AfyaNine API client — typed fetchers for the live backend.
 * Every fetcher returns `null` on failure so screens can fall back
 * to the bundled demo data and never break the prototype.
 */

export interface MotherSnapshot {
  mother: {
    code: string;
    firstName: string;
    fullName: string;
    device: string;
    sizeNote: string;
    week: number;
    totalWeeks: number;
    daysLeft: number;
    trimester: string;
  };
  appointment: { label: string; place: string; scheduledAt: string } | null;
  current: {
    systolic: number;
    diastolic: number;
    heartRate: number;
    heartLow: number;
    heartHigh: number;
    device: string;
    synced: string;
  };
  series: Record<
    "Hourly" | "Daily" | "Weekly",
    {
      labels: string[];
      systolic: number[];
      diastolic: number[];
      heart: number[];
      bpInsight: string;
      hrSummary: string;
    }
  >;
}

export interface Patient {
  id: string;
  initials: string;
  name: string;
  week: string;
  age: number;
  bp: string;
  systolic: number;
  diastolic: number;
  risk: "Normal" | "Watch" | "High Risk" | "Not recorded";
  color: string;
}

export interface PatientsPayload {
  patients: Patient[];
  chw: { firstName: string; stats: { patients: number; attention: number; visits: number } };
  emergency: { kind: string; who: string; where: string; motherCode: string } | null;
}

export interface PatientDetailPayload {
  patient: Patient;
  alert: {
    label: string;
    title: string;
    reason: string;
    latestBp: string;
    trend: string;
    trendLabel: string;
  } | null;
  trend: {
    axis: string[];
    series: number[];
    threshold: number;
    headline: string;
    status: string;
  };
  notes: Array<{ id: string; author: string; body: string; createdAt: string }>;
}

export interface MotherAccount {
  code: string;
  fullName: string;
  firstName: string;
  initials: string;
  color: string;
  age: number;
  week: number;
  risk: "Normal" | "Watch" | "High Risk";
  simulated: boolean;
}

async function get<T>(url: string): Promise<T | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

async function post<T>(url: string, body: unknown): Promise<T | null> {
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    if (!res.ok) return null;
    return (await res.json()) as T;
  } catch {
    return null;
  }
}

export const api = {
  mother: (code = "MW-1048") => get<MotherSnapshot>(`/api/mother?code=${code}`),
  mothers: () => get<{ mothers: MotherAccount[] }>("/api/mothers"),
  patients: () => get<PatientsPayload>("/api/patients"),
  patient: (code: string) => get<PatientDetailPayload>(`/api/patients/${code}`),
  saveNote: (code: string, body: string, author: string) =>
    post<{ note: PatientDetailPayload["notes"][number] }>(`/api/patients/${code}/notes`, { body, author }),
  raiseEmergency: (kind: string, motherCode = "MW-1048") =>
    post<{ emergency: { id: string } }>("/api/emergencies", { kind, motherCode }),
  resolveEmergency: () => post<{ resolved: number }>("/api/emergencies/resolve", {}),
};
