# MamaWatch CHW pages

This folder is a portable Community Health Worker feature. Each tab is an individual React page and can be copied into another React application.

## Files

| File                   | Purpose                                                                  |
| ---------------------- | ------------------------------------------------------------------------ |
| `ChwDashboardPage.tsx` | Today's schedule and a preview of mothers assigned to the CHW.           |
| `ChwPatientsPage.tsx`  | Full patient registry with search and risk filtering.                    |
| `ChwVisitsPage.tsx`    | Appointment list, visit selection, and notes shared with a mother.       |
| `ChwProfilePage.tsx`   | CHW identity, institution, service area, registration, and impact data.  |
| `ChwShared.tsx`        | Shared navigation, header, schedule card, and dependency-free SVG icons. |
| `mock-data.ts`         | All temporary CHW, patient, appointment, and note records.               |
| `types.ts`             | TypeScript contracts for the UI and future API.                          |
| `index.ts`             | Public exports for easy importing.                                       |

The pages use the existing CHW classes in `src/index.css`. Copy the CHW CSS section as well when moving these pages to another project.

## Page props

Every page receives:

```ts
type ChwPageProps = {
  navigate: (screen: ChwDestination) => void;
  notify: (message: string) => void;
};
```

`ChwVisitsPage` additionally receives:

```ts
{
  notes: Record<string, string>;
  saveNote: (appointmentId: string, note: string) => void;
}
```

Replace `navigate` with your router, for example `navigate("/chw/patients")`, and replace `notify` with your toast system.

## Mock data reference

### `mockChwProfile`

Represents one authenticated CHW.

- `id`: stable internal primary key.
- `initials`: avatar fallback.
- `name`, `email`, `phone`: personal/contact details.
- `registrationId`: official or organization-issued CHW identifier.
- `institution`: registered clinic or health facility.
- `areasServed`: neighborhoods or administrative service areas.
- `mothersAssigned`: current caseload count. In production, derive this from active patient assignments rather than storing it.
- `mothersSeen`, `visitsLogged`: dashboard totals. Prefer aggregate queries.
- `activeSince`, `yearsActive`: display values. Store one `activeSince` date and calculate years.

### `mockPatients`

Represents mothers assigned to the CHW.

- `id`: patient primary key.
- `chwId`: relationship to the assigned CHW.
- `name`, `initials`: identity/display fields.
- `week`: display-only pregnancy week. In production, store an estimated delivery date and calculate gestational age.
- `bp`: latest blood pressure display. In production, store readings in a separate vitals table.
- `risk`: current `Normal`, `Watch`, or `High Risk` classification.
- `high`: temporary UI convenience; derive from `risk`.
- `color`: avatar fallback color; optional preference.

### `mockAppointments`

Represents scheduled CHW visits.

- `id`: appointment primary key.
- `patientId`: relationship to a mother.
- `chwId`: relationship to the assigned health worker.
- `scheduledAt`: ISO 8601 date and time including the Kenya timezone offset.
- `time`: display-only formatted time; derive it from `scheduledAt`.
- `name`, `initials`: denormalized mock display data; populate from `patientId` in production.
- `type`: purpose of the appointment.
- `location`: home area or facility.
- `status`: `Upcoming`, `In progress`, `Completed`, or `Cancelled`.
- `urgent`: prioritization flag.

### `initialMockVisitNotes`

An object keyed by appointment ID. It is intentionally shaped for simple React state. In a database, each note should be its own record with author, patient, appointment, timestamps, sharing status, and audit history.

## Recommended database model

Use PostgreSQL or another relational database because appointments, patient assignments, and notes have strong relationships.

```sql
create table institutions (
  id uuid primary key,
  name text not null,
  county text,
  sub_county text
);

create table users (
  id uuid primary key,
  email text unique not null,
  phone text,
  role text not null check (role in ('mother', 'chw', 'admin')),
  created_at timestamptz not null default now()
);

create table chw_profiles (
  user_id uuid primary key references users(id),
  institution_id uuid references institutions(id),
  full_name text not null,
  registration_id text unique not null,
  active_since date not null
);

create table chw_service_areas (
  id uuid primary key,
  chw_id uuid references chw_profiles(user_id),
  area_name text not null
);

create table patient_profiles (
  user_id uuid primary key references users(id),
  full_name text not null,
  estimated_delivery_date date,
  risk_level text not null default 'Normal'
);

create table patient_assignments (
  id uuid primary key,
  patient_id uuid references patient_profiles(user_id),
  chw_id uuid references chw_profiles(user_id),
  active boolean not null default true,
  assigned_at timestamptz not null default now()
);

create table appointments (
  id uuid primary key,
  patient_id uuid references patient_profiles(user_id),
  chw_id uuid references chw_profiles(user_id),
  scheduled_at timestamptz not null,
  visit_type text not null,
  location text,
  status text not null,
  urgent boolean not null default false,
  created_at timestamptz not null default now()
);

create table visit_notes (
  id uuid primary key,
  appointment_id uuid references appointments(id),
  patient_id uuid references patient_profiles(user_id),
  author_chw_id uuid references chw_profiles(user_id),
  body text not null,
  visible_to_mother boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table vital_readings (
  id uuid primary key,
  patient_id uuid references patient_profiles(user_id),
  systolic integer,
  diastolic integer,
  heart_rate integer,
  recorded_at timestamptz not null
);
```

Add indexes on `patient_assignments.chw_id`, `appointments(chw_id, scheduled_at)`, `appointments.patient_id`, `visit_notes.patient_id`, and `vital_readings(patient_id, recorded_at)`.

## API contract

Suggested authenticated endpoints:

```text
GET    /api/chw/me
GET    /api/chw/me/dashboard?date=2024-06-18
GET    /api/chw/me/patients?query=&risk=&page=1
GET    /api/chw/me/appointments?from=&to=
GET    /api/patients/:patientId
POST   /api/appointments/:appointmentId/notes
PATCH  /api/appointments/:appointmentId/notes/:noteId
GET    /api/mothers/me/visit-notes
```

The backend must obtain the CHW ID from the authenticated session, not a client-supplied query parameter. Before returning or changing a record, verify that the patient is actively assigned to that CHW.

Example note request:

```json
{
  "body": "Continue resting and repeat blood pressure this evening.",
  "visibleToMother": true
}
```

Example response:

```json
{
  "id": "note_uuid",
  "appointmentId": "appointment_uuid",
  "patientId": "patient_uuid",
  "author": { "id": "chw_uuid", "name": "Grace Otieno" },
  "body": "Continue resting and repeat blood pressure this evening.",
  "visibleToMother": true,
  "createdAt": "2024-06-18T08:55:00+03:00"
}
```

## Replacing mocks with a backend

1. Add authentication and expose the signed-in user's role and ID.
2. Replace imports from `mock-data.ts` with query hooks or server-loaded props.
3. Fetch dashboard data as one aggregated response to avoid several sequential requests.
4. Fetch patients with server-side search, risk filtering, and pagination.
5. Fetch appointments by date range using ISO timestamps.
6. Replace `saveNote` React state with a POST request.
7. On success, update the local query cache and show the returned note.
8. On the mother side, fetch only notes where `patient_id` matches the signed-in mother and `visible_to_mother = true`.
9. Add loading, empty, error, and retry states before production.
10. Add an immutable audit log for note creation and editing.

Example frontend adapter:

```ts
export async function saveVisitNote(appointmentId: string, body: string) {
  const response = await fetch(`/api/appointments/${appointmentId}/notes`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({ body, visibleToMother: true }),
  });

  if (!response.ok) throw new Error("Could not save visit note");
  return response.json();
}
```

## Security and maternal health data

- Treat all patient, pregnancy, vitals, location, and notes as sensitive health data.
- Require authentication on every endpoint.
- Enforce role-based and assignment-based authorization on the server.
- Encrypt data in transit and at rest.
- Keep access and edit audit logs.
- Avoid exposing records in analytics, logs, URLs, or client error reports.
- Define retention, consent, correction, and deletion procedures suitable for Kenyan law and the deploying health organization.
- Never let an AI-generated risk label replace a qualified clinical decision.

## Payload CMS mapping

If using Payload, create collections for `Users`, `Institutions`, `CHWProfiles`, `PatientProfiles`, `PatientAssignments`, `Appointments`, `VisitNotes`, and `VitalReadings`. Use relationship fields for the foreign keys above. Add collection access functions that compare `req.user.id` with the appointment CHW or patient. Add a `beforeChange` hook on visit notes to set `authorCHW` from the session and an `afterChange` hook to notify the mother when `visibleToMother` is true.
