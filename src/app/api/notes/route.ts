import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/notes?space=Work  — list notes for a space
export async function GET(req: NextRequest) {
  try {
    const space = req.nextUrl.searchParams.get("space") || "Work";
    const notes = await db.note.findMany({
      where: { space },
      orderBy: [{ pinned: "desc" }, { createdAt: "desc" }],
      take: 200,
    });
    return NextResponse.json({ notes });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to list notes" },
      { status: 500 }
    );
  }
}

// POST /api/notes  { text, space?, pinned? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const text = (body?.text || "").toString().trim();
    if (!text) {
      return NextResponse.json({ error: "text is required" }, { status: 400 });
    }
    const space = (body?.space || "Work").toString();
    const pinned = Boolean(body?.pinned);
    const note = await db.note.create({
      data: { text, space, pinned },
    });
    return NextResponse.json({ note }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to create note" },
      { status: 500 }
    );
  }
}
