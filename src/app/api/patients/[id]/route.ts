import { NextResponse } from "next/server";
import { patientDetail } from "@/lib/afyanine";

export const dynamic = "force-dynamic";

/** GET /api/patients/[id] — patient detail: profile, AI alert, BP trend, notes. */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const detail = await patientDetail(id);
    if (!detail) {
      return NextResponse.json({ error: `No patient found for ${id}` }, { status: 404 });
    }
    return NextResponse.json(detail);
  } catch (error) {
    console.error(`GET /api/patients/${id} failed`, error);
    return NextResponse.json({ error: "Could not load patient" }, { status: 500 });
  }
}
