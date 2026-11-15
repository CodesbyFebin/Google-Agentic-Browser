import { NextResponse } from "next/server";

type RecordItem = { id: string; collection: string; value: unknown; createdAt: string };
const store = globalThis as typeof globalThis & { __agentpalRecords?: Map<string, RecordItem> };
const records = (store.__agentpalRecords ??= new Map<string, RecordItem>());

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const action = String(body?.action ?? "");
    const args = body?.args ?? {};
    if (action === "records.create") {
      const collection = String(args.collection ?? "");
      const id = String(args.idempotency_key ?? crypto.randomUUID());
      if (!collection) return NextResponse.json({ error: "collection is required" }, { status: 400 });
      const key = `${collection}:${id}`;
      const existing = records.get(key);
      if (existing) return NextResponse.json({ data: { record: existing, duplicate: true } });
      const record: RecordItem = { id, collection, value: args.value ?? {}, createdAt: new Date().toISOString() };
      records.set(key, record);
      return NextResponse.json({ data: { record } });
    }
    if (action === "records.list") {
      const collection = String(args.collection ?? "");
      const found = [...records.values()].filter((r) => r.collection === collection);
      return NextResponse.json({ data: { records: found } });
    }
    return NextResponse.json({ error: `Unsupported action: ${action}` }, { status: 400 });
  } catch {
    return NextResponse.json({ error: "Invalid action request" }, { status: 400 });
  }
}
