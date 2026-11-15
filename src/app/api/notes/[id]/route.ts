import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// PATCH /api/notes/:id  { done?, pinned?, text? }
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const data: Record<string, unknown> = {};
    if (typeof body?.done === "boolean") data.done = body.done;
    if (typeof body?.pinned === "boolean") data.pinned = body.pinned;
    if (typeof body?.text === "string") data.text = body.text.trim();
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "nothing to update" }, { status: 400 });
    }
    const note = await db.note.update({ where: { id }, data });
    return NextResponse.json({ note });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to update note" },
      { status: 500 }
    );
  }
}

// DELETE /api/notes/:id
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    await db.note.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to delete note" },
      { status: 500 }
    );
  }
}
