import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { motherSnapshot } from "@/lib/afyanine";

export async function POST(request: Request) {
  const body = await request.json().catch(() => null);
  const code = typeof body?.code === "string" ? body.code : "";
  if (!/^MW-\d{4}$/.test(code)) return NextResponse.json({ error: "Choose a fictional mother." }, { status: 400 });
  try {
    const found = await db.$transaction(async tx => {
      // Shared across instances: at most one generated reading per persona/30s.
      await tx.$queryRaw`SELECT 1 AS acquired FROM pg_advisory_xact_lock(hashtext(${code}))`;
      const mother = await tx.mother.findFirst({
        where: { code, simulated: true }, include: { readings: { orderBy: { takenAt: "desc" }, take: 1 } },
      });
      if (!mother) return false;
      const previous = mother.readings[0];
      if (!previous || Date.now() - previous.takenAt.getTime() >= 30_000) {
        const noise = () => Math.floor(Math.random() * 5) - 2;
        await tx.vitalReading.create({ data: {
          motherId: mother.id, takenAt: new Date(), source: "User-triggered fictional simulation",
          systolic: Math.min(160, Math.max(95, (previous?.systolic ?? 110) + noise())),
          diastolic: Math.min(100, Math.max(60, (previous?.diastolic ?? 70) + noise())),
          heartRate: Math.min(110, Math.max(60, (previous?.heartRate ?? 75) + noise())),
        } });
      }
      return true;
    });
    if (!found) return NextResponse.json({ error: "Fictional persona not found." }, { status: 404 });
    return NextResponse.json(await motherSnapshot(code), { headers: { "Cache-Control": "no-store" } });
  } catch {
    return NextResponse.json({ error: "Simulation unavailable. Please retry." }, { status: 503 });
  }
}
