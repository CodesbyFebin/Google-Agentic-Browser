import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

// GET /api/payments — seed + return approvals, transactions, orders.
// We lazily seed the SQLite tables on first call so the UI never starts empty.
export async function GET() {
  try {
    await seedIfEmpty();

    const [approvals, txs, orders] = await Promise.all([
      db.approval.findMany({ orderBy: { id: "asc" } }),
      db.tx.findMany({ orderBy: { id: "desc" }, take: 50 }),
      db.order.findMany({ orderBy: { id: "desc" } }),
    ]);
    return NextResponse.json({ approvals, txs, orders });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Failed to load payments" },
      { status: 500 }
    );
  }
}

// POST /api/payments  — approve | deny | approveAll | createOrder | refund | request
// Body shape: { op: "approve" | "deny" | "approveAll" | "createOrder" | "refund" | "request", ... }
export async function POST(req: NextRequest) {
  try {
    await seedIfEmpty();
    const body = await req.json().catch(() => ({}));
    const op = (body?.op || "").toString();

    if (op === "approve") {
      const id = Number(body.id);
      const a = await db.approval.findUnique({ where: { id } });
      if (!a) return NextResponse.json({ error: "approval not found" }, { status: 404 });
      await db.$transaction([
        db.approval.delete({ where: { id } }),
        db.tx.create({
          data: {
            id: Date.now() & 0x7fffffff,
            name: a.title.split("·")[1]?.trim() || a.title,
            amount: a.amount,
            cat: "Approved",
            rule: a.risk === "High" ? "Approved by you" : "Approved",
            space: "Money",
            icon: "✓",
            time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
          },
        }),
      ]);
      return NextResponse.json({ ok: true });
    }

    if (op === "deny") {
      const id = Number(body.id);
      await db.approval.delete({ where: { id } }).catch(() => {});
      return NextResponse.json({ ok: true });
    }

    if (op === "approveAll") {
      const all = await db.approval.findMany();
      await db.$transaction([
        ...all.map((a) =>
          db.tx.create({
            data: {
              id: (Date.now() + a.id) & 0x7fffffff,
              name: a.title.split("·")[1]?.trim() || a.title,
              amount: a.amount,
              cat: "Approved",
              rule: "Approved by you",
              space: "Money",
              icon: "✓",
              time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
            },
          })
        ),
        db.approval.deleteMany(),
      ]);
      return NextResponse.json({ ok: true, approved: all.length });
    }

    if (op === "createOrder") {
      const name = (body?.name || "New Order").toString().trim();
      const amount = Number(body?.amount) || 499;
      const id = "ORD-" + (1043 + (await db.order.count()));
      await db.order.create({
        data: { id, name, amount, status: "Paid", date: "Today" },
      });
      await db.tx.create({
        data: {
          id: Date.now() & 0x7fffffff,
          name,
          amount,
          cat: "Order",
          rule: "Created in Money OS",
          space: "Money",
          icon: "◍",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      });
      return NextResponse.json({ id }, { status: 201 });
    }

    if (op === "refund") {
      const id = (body?.id || "").toString();
      const o = await db.order.findUnique({ where: { id } });
      if (!o) return NextResponse.json({ error: "order not found" }, { status: 404 });
      await db.order.update({ where: { id }, data: { status: "Refunded" } });
      await db.tx.create({
        data: {
          id: Date.now() & 0x7fffffff,
          name: `Refund ${o.id}`,
          amount: -o.amount,
          cat: "Refund",
          rule: "Refunded by you",
          space: "Money",
          icon: "↩",
          time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        },
      });
      return NextResponse.json({ ok: true });
    }

    if (op === "request") {
      const title = (body?.title || "Pay").toString();
      const amount = Number(body?.amount) || 499;
      const detail = (body?.detail || "Guarded checkout").toString();
      const risk = (body?.risk || (amount <= 1000 ? "Low" : amount <= 2000 ? "Medium" : "High")).toString();
      const id = Math.max(1, Date.now() & 0xffff);
      await db.approval.create({
        data: { id, title: `Pay ₹${amount} · ${title}`, amount, detail, risk, space: "Money" },
      });
      return NextResponse.json({ id }, { status: 201 });
    }

    return NextResponse.json({ error: "unknown op" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message || "Payments op failed" },
      { status: 500 }
    );
  }
}

// Seed the SQLite tables the first time they are touched, so the Money OS
// UI always has its demo approvals, transactions and orders to render.
const SEEDS: {
  approvals: { id: number; title: string; amount: number; detail: string; risk: string }[];
  txs: { id: number; name: string; amount: number; cat: string; rule: string; space: string; icon: string; time: string }[];
  orders: { id: string; name: string; amount: number; status: string; date: string }[];
} = {
  approvals: [
    { id: 1, title: "Pay ₹642 · Swiggy", amount: 642, detail: "Food delivery · Personal · Low risk", risk: "Low" },
    { id: 2, title: "Pay ₹1,299 · Amazon", amount: 1299, detail: "Order · Personal · Medium risk", risk: "Medium" },
    { id: 3, title: "Pay ₹8,000 · Rent share", amount: 8000, detail: "Monthly share · Personal · High stakes", risk: "High" },
  ],
  txs: [
    { id: 1, name: "Notion", amount: 499, cat: "Productivity", rule: "Auto-tagged · Work", space: "Work", icon: "N", time: "09:12" },
    { id: 2, name: "Swiggy", amount: 642, cat: "Food", rule: "Ask First · Personal", space: "Personal", icon: "S", time: "12:40" },
    { id: 3, name: "Uber", amount: 318, cat: "Travel", rule: "Auto · Work", space: "Work", icon: "U", time: "13:05" },
    { id: 4, name: "Figma", amount: 1299, cat: "Design", rule: "Approved · Money", space: "Money", icon: "F", time: "14:22" },
    { id: 5, name: "BookMyShow", amount: 890, cat: "Entertainment", rule: "Ask First · Personal", space: "Personal", icon: "B", time: "18:10" },
    { id: 6, name: "DMart", amount: 1840, cat: "Groceries", rule: "Auto · Personal", space: "Personal", icon: "D", time: "19:45" },
  ],
  orders: [
    { id: "ORD-1042", name: "Notion Team Plan", amount: 499, status: "Paid", date: "Today" },
    { id: "ORD-1041", name: "Figma Pro", amount: 1299, status: "Paid", date: "Yesterday" },
  ],
};

async function seedIfEmpty() {
  const [approvalCount, txCount, orderCount] = await Promise.all([
    db.approval.count(), db.tx.count(), db.order.count(),
  ]);
  // Removing the last approval must not recreate the sample queue.
  if (approvalCount > 0 || txCount > 0 || orderCount > 0) return;
  await db.$transaction([
    ...SEEDS.approvals.map((a) => db.approval.create({ data: a })),
    ...SEEDS.txs.map((t) => db.tx.create({ data: t })),
    ...SEEDS.orders.map((o) => db.order.create({ data: o })),
  ]);
}
