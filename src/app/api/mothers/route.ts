import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { pregnancyOf, riskOf, FLAGGED_CODE, initialsOf } from "@/lib/afyanine";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const mothers = await db.mother.findMany({
      where: { simulated: true },
      include: { readings: { orderBy: { takenAt: "desc" }, take: 1 } },
      orderBy: { code: "asc" },
    });

    const accounts = mothers
      .map((m) => {
        const r = m.readings[0];
        if (!r) return null;
        const preg = pregnancyOf(m);
        return {
          code: m.code,
          fullName: m.fullName,
          firstName: m.firstName,
          initials: initialsOf(m.fullName),
          color: m.color,
          age: m.age,
          week: preg.week,
          risk: riskOf(r.systolic, r.diastolic),
          simulated: m.simulated,
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        const rank = (p: NonNullable<(typeof accounts)[number]>) =>
          (p.code === FLAGGED_CODE ? -10 : 0) +
          (p.risk === "High Risk" ? -3 : p.risk === "Watch" ? -2 : 0);
        return rank(a!) - rank(b!) || a!.code.localeCompare(b!.code);
      });

    return NextResponse.json({ mothers: accounts });
  } catch (err) {
    console.error("GET /api/mothers failed:", err);
    return NextResponse.json({ error: "database unavailable" }, { status: 503 });
  }
}
