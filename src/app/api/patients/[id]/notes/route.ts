import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/** POST /api/patients/[id]/notes — save a CHW visit note. */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  try {
    const body = (await request.json()) as { body?: string; author?: string };
    const text = (body.body ?? "").trim();
    if (!text) {
      return NextResponse.json({ error: "Note body is required" }, { status: 400 });
    }

    const mother = await db.mother.findUnique({ where: { code: id } });
    if (!mother) {
      return NextResponse.json({ error: `No patient found for ${id}` }, { status: 404 });
    }

    const note = await db.visitNote.create({
      data: {
        motherId: mother.id,
        author: (body.author ?? "Grace Wanjiru").trim() || "Grace Wanjiru",
        body: text.slice(0, 2000),
      },
    });

    return NextResponse.json(
      {
        note: {
          id: note.id,
          author: note.author,
          body: note.body,
          createdAt: note.createdAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error(`POST /api/patients/${id}/notes failed`, error);
    return NextResponse.json({ error: "Could not save note" }, { status: 500 });
  }
}
