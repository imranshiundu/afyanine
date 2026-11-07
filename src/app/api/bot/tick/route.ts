import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { tick } from "@/lib/bot-sim.mjs";

export const dynamic = "force-dynamic";

/**
 * Mini bot — one simulation step.
 * 1. self-healing: creates any missing test-mother account
 * 2. realistic vitals per persona (diurnal curve, Nairobi time)
 * 3. occasional CHW note
 * 4. SOS drill from the preeclampsia persona (never while one is active)
 * Safe to call from any scheduler; every mutation is broadcast by Supabase realtime.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const forceSos = Boolean(body?.forceSos);
    const forceMother = typeof body?.forceMother === "string" ? body.forceMother : undefined;
    const report = await tick(db, { forceSos, forceMother });
    return NextResponse.json({ ...report, tick: new Date().toISOString() });
  } catch (err) {
    console.error("POST /api/bot/tick failed:", err);
    return NextResponse.json({ error: "database unavailable" }, { status: 503 });
  }
}
