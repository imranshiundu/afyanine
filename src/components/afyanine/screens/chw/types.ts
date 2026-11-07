export type ChwDestination =
  | "chw"
  | "chwPatients"
  | "chwVisits"
  | "chwProfile"
  | "patient"
  | "login";

export type RiskLevel = "Normal" | "Watch" | "High Risk";

export interface Patient {
  id: string;
  initials: string;
  name: string;
  week: string;
  bp: string;
  risk: RiskLevel;
  high: boolean;
  color: string;
  chwId: string;
}

export interface Appointment {
  id: string;
  patientId: string;
  chwId: string;
  scheduledAt: string;
  time: string;
  name: string;
  initials: string;
  type: string;
  location: string;
  status: "In progress" | "Upcoming" | "Completed" | "Cancelled";
  urgent: boolean;
}

export interface ChwProfile {
  id: string;
  initials: string;
  name: string;
  email: string;
  phone: string;
  registrationId: string;
  institution: string;
  areasServed: string[];
  mothersAssigned: number;
  mothersSeen: number;
  visitsLogged: number;
  activeSince: string;
  yearsActive: number;
}

export type VisitNotes = Record<string, string>;

export interface ChwPageProps {
  navigate: (screen: ChwDestination) => void;
  notify: (message: string) => void;
}
