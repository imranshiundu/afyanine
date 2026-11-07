import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { FLAGGED_CODE } from "@/lib/afyanine";

export const dynamic = "force-dynamic";

/** GET /api/emergencies — the active emergency (for the CHW banner). */
export async function GET() {
  try {
    const emergency = await db.emergency.findFirst({
      where: { status: "active", mother: { simulated: true } },
      orderBy: { createdAt: "desc" },
      include: { mother: true },
    });
    if (!emergency) return NextResponse.json({ emergency: null });
    return NextResponse.json({
      emergency: {
        kind: emergency.kind,
        who: `${emergency.mother.fullName} needs help`,
        where: "Kibera · Ambulance arriving in 8 min",
        motherCode: emergency.mother.code,
        createdAt: emergency.createdAt.toISOString(),
      },
    });
  } catch (error) {
    console.error("GET /api/emergencies failed", error);
    return NextResponse.json({ error: "Could not load emergency" }, { status: 500 });
  }
}

/** POST /api/emergencies — raise an SOS from the mother's phone. */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { motherCode?: string; kind?: string };
    const kind = (body.kind ?? "Emergency").trim().slice(0, 80);
    const motherCode = body.motherCode ?? FLAGGED_CODE;

    const mother = await db.mother.findUnique({ where: { code: motherCode } });
    if (!mother?.simulated) {
      return NextResponse.json({ error: `No mother found for ${motherCode}` }, { status: 404 });
    }

    // One live emergency at a time — resolve the previous ones.
    await db.emergency.updateMany({
      where: { motherId: mother.id, status: "active" },
      data: { status: "resolved" },
    });

    const emergency = await db.emergency.create({
      data: { motherId: mother.id, kind, status: "active" },
    });

    return NextResponse.json(
      { emergency: { id: emergency.id, kind: emergency.kind, createdAt: emergency.createdAt.toISOString() } },
      { status: 201 },
    );
  } catch (error) {
    console.error("POST /api/emergencies failed", error);
    return NextResponse.json({ error: "Could not raise emergency" }, { status: 500 });
  }
}
