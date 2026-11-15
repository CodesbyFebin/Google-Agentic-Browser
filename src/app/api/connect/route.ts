import { NextRequest, NextResponse } from "next/server";

// The Connect panel is a concept demo: scopes, quota meters and consent are
// simulated. We keep the consent log in-memory on the server (per process),
// so the "granted / denied" history the user builds persists for the session
// without needing a database table.

type ConsentEntry = { time: string; scope: string; decision: "granted" | "denied"; who: string };
const consentLog: ConsentEntry[] = [
  { time: "10:02", scope: "gmail.readonly", decision: "granted", who: "You" },
  { time: "10:02", scope: "calendar.events", decision: "granted", who: "You" },
  { time: "10:02", scope: "drive.file", decision: "granted", who: "You" },
];

export async function GET() {
  return NextResponse.json({ log: consentLog });
}

// POST /api/connect { scope, decision }
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const scope = (body?.scope || "").toString().trim();
    const decision: "granted" | "denied" =
      body?.decision === "granted" ? "granted" : "denied";
    if (!scope) {
      return NextResponse.json({ error: "scope is required" }, { status: 400 });
    }
    const entry: ConsentEntry = {
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      scope,
      decision,
      who: "You",
    };
    consentLog.unshift(entry);
    if (consentLog.length > 40) consentLog.pop();
    return NextResponse.json({ entry }, { status: 201 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Consent log failed" },
      { status: 500 }
    );
  }
}
