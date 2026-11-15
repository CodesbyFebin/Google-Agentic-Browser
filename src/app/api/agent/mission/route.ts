import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// A single MissionEvent is what the client pushes to the recorder.
// We mirror the browser-data.ts MissionStep type, plus a runtime `at` stamp.
export type MissionEvent = {
  a: string; // agent id
  t: string; // kind: plan | act | think | gate | pay | done | deny
  page: string;
  url: string;
  msg: string;
  cost?: number;
  twin?: boolean;
  at: string; // seconds since start, string for JSON safety
};

// POST /api/agent/mission — persist a finished mission run.
// Body: { goal, steps: MissionEvent[], receipt, usdcSpent, gates, denied, twin, space }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const goal = (body?.goal || "").toString().trim();
    const steps = Array.isArray(body?.steps) ? body.steps : [];
    if (!goal) {
      return NextResponse.json({ error: "goal is required" }, { status: 400 });
    }
    const receipt = (body?.receipt || "").toString();
    const usdcSpent = Number(body?.usdcSpent) || 0;
    const gates = Number(body?.gates) || 0;
    const denied = Boolean(body?.denied);
    const twin = Boolean(body?.twin);
    const space = (body?.space || "Research").toString();

    const run = await db.agentRun.create({
      data: {
        goal,
        steps: JSON.stringify(steps),
        receipt,
        usdcSpent,
        gates,
        denied,
        twin,
        space,
      },
    });
    return NextResponse.json({ run }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to record mission run" },
      { status: 500 }
    );
  }
}

// GET /api/agent/mission?space=Research — list past runs.
export async function GET(req: NextRequest) {
  try {
    const space = req.nextUrl.searchParams.get("space") || undefined;
    const where = space ? { space } : undefined;
    const runs = await db.agentRun.findMany({
      where,
      orderBy: { createdAt: "desc" },
      take: 30,
    });
    return NextResponse.json({
      runs: runs.map((r) => ({
        ...r,
        steps: JSON.parse(r.steps),
      })),
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to list runs" },
      { status: 500 }
    );
  }
}
