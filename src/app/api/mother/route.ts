import { NextResponse } from "next/server";
import { motherSnapshot, FLAGGED_CODE } from "@/lib/afyanine";

export const dynamic = "force-dynamic";

/** GET /api/mother?code=MW-1048 — pregnancy + vitals snapshot for the mother screens. */
export async function GET(request: Request) {
  const code = new URL(request.url).searchParams.get("code") ?? FLAGGED_CODE;
  try {
    const snapshot = await motherSnapshot(code);
    if (!snapshot) {
      return NextResponse.json({ error: `No mother found for ${code}` }, { status: 404 });
    }
    return NextResponse.json(snapshot);
  } catch (error) {
    console.error("GET /api/mother failed", error);
    return NextResponse.json({ error: "Could not load snapshot" }, { status: 500 });
  }
}
