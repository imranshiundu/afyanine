import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Resolve the active SOS (most recent, or the one whose id is given).
 * The Emergency UPDATE row is broadcast in realtime so the CHW banner
 * clears on every open session.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const id: string | undefined = body?.id;

    if (id) {
      const found = await db.emergency.findUnique({ where: { id } });
      if (!found) {
        return NextResponse.json({ error: "emergency record not found" }, { status: 404 });
      }
      if (found.status !== "resolved") {
        await db.emergency.update({ where: { id }, data: { status: "resolved" } });
      }
      return NextResponse.json({ resolved: 1, emergency: { id, motherCode: found.motherId, kind: found.kind, createdAt: found.createdAt.toISOString() } });
    }

    const active = await db.emergency.findFirst({
      where: { status: "active" },
      orderBy: { createdAt: "desc" },
    });
    if (!active) return NextResponse.json({ resolved: 0, emergency: null });

    await db.emergency.update({ where: { id: active.id }, data: { status: "resolved" } });
    return NextResponse.json({ resolved: 1, emergency: { id: active.id, kind: active.kind, createdAt: active.createdAt.toISOString() } });
  } catch (err) {
    console.error("POST /api/emergencies/resolve failed:", err);
    return NextResponse.json({ error: "database unavailable" }, { status: 503 });
  }
}
