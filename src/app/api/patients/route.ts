import { NextResponse } from "next/server";
import { patientsPayload } from "@/lib/afyanine";

export const dynamic = "force-dynamic";

/** GET /api/patients — CHW register: patients, practice stats, active emergency. */
export async function GET() {
  try {
    const payload = await patientsPayload();
    return NextResponse.json(payload);
  } catch (error) {
    console.error("GET /api/patients failed", error);
    return NextResponse.json({ error: "Could not load patients" }, { status: 500 });
  }
}
