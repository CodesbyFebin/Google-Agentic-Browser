import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/history?space=Work&q=
export async function GET(req: NextRequest) {
  try {
    const space = req.nextUrl.searchParams.get("space") || undefined;
    const q = req.nextUrl.searchParams.get("q") || undefined;
    const where: Record<string, unknown> = {};
    if (space) where.space = space;
    if (q) where.title = { contains: q };
    const items = await db.historyItem.findMany({
      where,
      orderBy: { visitedAt: "desc" },
      take: 60,
    });
    return NextResponse.json({ items });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to list history" },
      { status: 500 }
    );
  }
}

// POST /api/history  { title, domain, url, space?, fav? }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const title = (body?.title || "").toString().trim();
    const domain = (body?.domain || "").toString().trim();
    const url = (body?.url || body?.domain || "").toString();
    if (!title || !domain) {
      return NextResponse.json(
        { error: "title and domain are required" },
        { status: 400 }
      );
    }
    const space = (body?.space || "Work").toString();
    const fav = (body?.fav || "A").toString();
    const item = await db.historyItem.create({
      data: { title, domain, url, space, fav },
    });
    return NextResponse.json({ item }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to record history" },
      { status: 500 }
    );
  }
}
