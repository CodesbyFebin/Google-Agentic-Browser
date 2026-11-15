"use client";

// Money panel — the right-side "Money" tab and the Money OS page.
// Ports GB1's MoneyView into a typed React component backed by /api/payments.
// Views: Command Center, Money OS, Agent Mesh, Hardening, Analytics.

import { useCallback, useEffect, useState } from "react";
import {
  AlertTriangle,
  Ban,
  Bot,
  Check,
  Download,
  Receipt,
  Repeat,
  ShieldCheck,
  Target,
  TrendingUp,
} from "lucide-react";
import {
  AGENTS,
  GOALS,
  MONEY_GUARDS,
  PAYPAL_REPOS,
  SPEND_BY_CATEGORY,
  type AgentId,
  type Approval,
  type Order,
  type Tx,
} from "./browser-data";

type View =
  | "Command Center"
  | "Money OS"
  | "Agent Mesh"
  | "Hardening"
  | "Analytics";

const VIEWS: View[] = [
  "Command Center",
  "Money OS",
  "Agent Mesh",
  "Hardening",
  "Analytics",
];

export function MoneyPanel({ onToast }: { onToast: (m: string) => void }) {
  const [view, setView] = useState<View>("Command Center");
  const [approvals, setApprovals] = useState<Approval[]>([]);
  const [txs, setTxs] = useState<Tx[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/payments");
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j.error) throw new Error(j.error || "load failed");
      setApprovals(j.approvals || []);
      setTxs(j.txs || []);
      setOrders(j.orders || []);
      setError("");
    } catch (e: any) {
      setError(e?.message || "Money OS unavailable");
    }
  }, []);

  useEffect(() => {
    // Schedule async loading after the effect; cancel the pending start on unmount.
    const timer = window.setTimeout(() => { void load(); }, 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  async function call(op: string, body: Record<string, unknown> = {}) {
    try {
      const r = await fetch("/api/payments", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ op, ...body }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j.error) throw new Error(j.error || `${op} failed`);
      await load();
      return j;
    } catch (e: any) {
      onToast(e?.message || "Money action failed");
    }
  }

  const balance = 184250 - txs.reduce((s, t) => s + t.amount, 0);
  const spent = txs.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
  const fmt = (n: number) => `₹${Math.abs(n).toLocaleString("en-IN")}`;

  return (
    <div className="space-y-3">
      <div className="flex gap-1 overflow-x-auto ag-no-scrollbar pb-1">
        {VIEWS.map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className="shrink-0 px-3 py-1.5 rounded-full text-xs border"
            style={{
              background: view === v ? "var(--ag-accent)" : "transparent",
              borderColor: view === v ? "var(--ag-accent)" : "rgba(255,255,255,0.12)",
              color: view === v ? "#fff" : "inherit",
            }}
          >
            {v}
          </button>
        ))}
      </div>

      {error && <p className="text-xs text-amber-300">{error}</p>}

      {view === "Command Center" && (
        <>
          <div className="ag-glass rounded-2xl p-4">
            <div className="text-xs opacity-60">Example Balance · Demo only</div>
            <div className="text-3xl font-bold mt-1">{fmt(balance)}</div>
            <div className="text-xs mt-1" style={{ color: "var(--ag-success)" }}>
              ↑ Synced · Sandbox · Supervised Autonomy
            </div>
            <button
              onClick={() =>
                call("request", { title: "Quick Pay", amount: 499, detail: "Guarded checkout" }).then(() => onToast("Approval created — review it below"))
              }
              className="mt-3 w-full px-4 py-2.5 rounded-full text-white text-sm font-bold"
              style={{ background: "var(--ag-accent)" }}
            >
              Pay ₹499 (guarded)
            </button>
          </div>

          <div className="ag-glass rounded-2xl p-4">
            <div className="flex justify-between items-center gap-2">
              <h3 className="font-bold">Approvals queue · {approvals.length}</h3>
              <button
                onClick={() =>
                  call("approveAll").then((j) => onToast(`Approved ${j?.approved ?? 0} payments`))
                }
                className="text-xs px-3 py-1.5 rounded-full font-bold text-white"
                style={{ background: "var(--ag-success)" }}
              >
                Approve all
              </button>
            </div>
            <div className="space-y-2 mt-3">
              {approvals.length === 0 ? (
                <p className="text-sm opacity-55">All clear. No pending approvals.</p>
              ) : (
                approvals.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-center gap-3 ag-glass rounded-xl p-3 flex-wrap"
                  >
                    <div className="flex-1 min-w-[150px]">
                      <div className="font-semibold text-sm">{a.title}</div>
                      <div className="text-xs opacity-60">{a.detail}</div>
                    </div>
                    <button
                      onClick={() => call("approve", { id: a.id }).then(() => onToast(`Approved ${a.title}`))}
                      className="text-white px-3 py-1.5 rounded-full text-xs font-bold flex gap-1 items-center"
                      style={{ background: "var(--ag-success)" }}
                    >
                      <Check size={13} /> Approve
                    </button>
                    <button
                      onClick={() => call("deny", { id: a.id }).then(() => onToast(`Denied ${a.title}`))}
                      className="ag-glass px-3 py-1.5 rounded-full text-xs font-bold flex gap-1 items-center"
                    >
                      <Ban size={13} /> Deny
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="ag-glass rounded-2xl p-4">
            <h3 className="font-bold">Recent transactions</h3>
            <div className="space-y-2 mt-3">
              {txs.map((t) => (
                <div key={t.id} className="flex items-center gap-3">
                  <span className="w-9 h-9 rounded-full bg-white/10 grid place-items-center text-sm font-bold shrink-0">
                    {t.icon}
                  </span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-semibold truncate">
                      {t.name} <span className="opacity-60 font-normal">· {t.cat}</span>
                    </div>
                    <div className="text-xs opacity-55">{t.rule} · {t.time}</div>
                  </div>
                  <b className="text-sm">{t.amount < 0 ? "+" : "−"}{fmt(t.amount)}</b>
                </div>
              ))}
            </div>
          </div>
        </>
      )}

      {view === "Money OS" && <MoneyOSView orders={orders} onToast={onToast} call={call} fmt={fmt} />}

      {view === "Agent Mesh" && <AgentMeshView onToast={onToast} />}

      {view === "Hardening" && <HardeningView audit={txs} onToast={onToast} fmt={fmt} />}

      {view === "Analytics" && <AnalyticsView spent={spent} fmt={fmt} />}
    </div>
  );
}

function MoneyOSView({
  orders,
  onToast,
  call,
  fmt,
}: {
  orders: Order[];
  onToast: (m: string) => void;
  call: (op: string, body?: Record<string, unknown>) => Promise<any>;
  fmt: (n: number) => string;
}) {
  const [name, setName] = useState("");
  const [amt, setAmt] = useState("499");
  return (
    <div className="ag-glass rounded-2xl p-4 space-y-4">
      <div>
        <div className="flex flex-wrap gap-2 items-end">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Order name — e.g. Notion Team"
            className="flex-1 min-w-[180px] bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-sm"
          />
          <input
            value={amt}
            onChange={(e) => setAmt(e.target.value)}
            inputMode="numeric"
            placeholder="Amount"
            className="w-28 bg-white/5 border border-white/10 rounded-full px-4 py-2.5 text-sm"
          />
          <button
            onClick={() =>
              call("createOrder", { name, amount: Number(amt) || 499 }).then((j) => {
                onToast(`Order ${j?.id ?? ""} created — ₹${amt}`);
                setName("");
                setAmt("499");
              })
            }
            className="px-5 py-2.5 rounded-full text-white text-sm font-bold"
            style={{ background: "var(--ag-accent)" }}
          >
            Create order
          </button>
        </div>
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-sm min-w-[520px]">
            <thead>
              <tr className="text-left opacity-60">
                <th className="py-2">Order</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Date</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {orders.map((o) => (
                <tr key={o.id} className="border-t border-white/10">
                  <td className="py-3 font-semibold">
                    {o.id}
                    <div className="text-xs font-normal opacity-60">{o.name}</div>
                  </td>
                  <td>{fmt(o.amount)}</td>
                  <td>
                    <span
                      className="px-2 py-1 rounded-full text-xs"
                      style={{
                        background: o.status === "Paid" ? "rgba(52,168,83,0.2)" : "rgba(251,188,4,0.2)",
                        color: o.status === "Paid" ? "#34A853" : "#FBBC04",
                      }}
                    >
                      {o.status}
                    </span>
                  </td>
                  <td className="opacity-60">{o.date}</td>
                  <td>
                    <button
                      disabled={o.status === "Refunded"}
                      onClick={() => call("refund", { id: o.id }).then(() => onToast(`Refunded ${o.id}`))}
                      className="ag-glass px-3 py-1.5 rounded-full text-xs disabled:opacity-50"
                    >
                      Refund
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="grid sm:grid-cols-3 gap-3 text-sm">
        <div className="rounded-xl border border-white/10 p-3">
          <b className="flex gap-2 items-center"><Receipt size={16} /> Invoices</b>
          <p className="opacity-60 mt-1">INV-221 · ₹12,400 · Paid</p>
          <p className="opacity-60">INV-222 · ₹8,900 · Due Friday</p>
        </div>
        <div className="rounded-xl border border-white/10 p-3">
          <b className="flex gap-2 items-center"><Repeat size={16} /> Subscriptions</b>
          <p className="opacity-60 mt-1">Notion · Figma · Linear</p>
          <p className="opacity-60">Next renewal in 6 days</p>
        </div>
        <div className="rounded-xl border border-white/10 p-3">
          <b className="flex gap-2 items-center"><AlertTriangle size={16} /> Disputes</b>
          <p className="opacity-60 mt-1">1 open · DMart delivery</p>
          <p className="opacity-60">Buyer Protection active</p>
        </div>
      </div>
    </div>
  );
}

function AgentMeshView({ onToast }: { onToast: (m: string) => void }) {
  const [guards, setGuards] = useState<boolean[]>([true, true, false]);
  const ROSTER: AgentId[] = ["orch", "scout", "ana", "sent", "buy", "scr"];
  return (
    <>
      <div className="grid sm:grid-cols-2 gap-3">
        {ROSTER.map((id) => {
          const a = AGENTS[id];
          const status = id === "sent" ? "Idle" : "Active";
          return (
            <div key={id} className="ag-glass rounded-2xl p-4">
              <div className="flex justify-between">
                <div>
                  <div className="font-bold flex gap-2 items-center">
                    <Bot size={18} style={{ color: "var(--ag-accent)" }} />
                    {a.name}
                  </div>
                  <div className="text-xs opacity-60">{a.role}</div>
                </div>
                <span
                  className="h-fit px-2 py-1 rounded-full text-xs"
                  style={{
                    background: status === "Active" ? "rgba(52,168,83,0.2)" : "rgba(255,255,255,0.1)",
                    color: status === "Active" ? "#34A853" : "inherit",
                  }}
                >
                  {status}
                </span>
              </div>
              <div className="flex gap-4 text-sm mt-3">
                <span>Reputation <b>{a.reputation}%</b></span>
                <span>Limit <b>{a.spendLimit} USDC</b></span>
              </div>
              <p className="text-xs opacity-60 mt-2">
                {a.name} checks rules before acting, logs every step, and asks first when the amount is above the limit.
              </p>
              <button
                onClick={() => onToast(`${a.name} explained in audit log`)}
                className="mt-3 ag-glass px-3 py-1.5 rounded-full text-xs"
              >
                Explain agent
              </button>
            </div>
          );
        })}
        <div className="ag-glass rounded-2xl p-4 sm:col-span-2">
          <h3 className="font-bold">Guard Rules</h3>
          <div className="grid sm:grid-cols-3 gap-2 mt-3 text-sm">
            {MONEY_GUARDS.map((g, i) => (
              <button
                key={g}
                onClick={() => setGuards((v) => v.map((x, j) => (j === i ? !x : x)))}
                className="flex justify-between items-center border border-white/10 rounded-xl p-3 text-left"
              >
                <span>{g}</span>
                <span
                  className="w-10 h-6 rounded-full p-0.5 flex"
                  style={{
                    background: guards[i] ? "var(--ag-success)" : "rgba(255,255,255,0.2)",
                    justifyContent: guards[i] ? "flex-end" : "flex-start",
                  }}
                >
                  <span className="w-5 h-5 bg-white rounded-full block" />
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function HardeningView({
  audit,
  onToast,
  fmt,
}: {
  audit: Tx[];
  onToast: (m: string) => void;
  fmt: (n: number) => string;
}) {
  const scores = [
    { l: "Payments", v: 100 },
    { l: "Security", v: 100 },
    { l: "AI Agents", v: 100 },
  ];
  return (
    <div className="grid lg:grid-cols-3 gap-3">
      <div className="ag-glass rounded-2xl p-4 lg:col-span-2">
        <h3 className="font-bold flex gap-2 items-center">
          <ShieldCheck size={18} /> Security scores
        </h3>
        {scores.map((s) => (
          <div key={s.l} className="mt-3">
            <div className="flex justify-between text-sm">
              <span>{s.l}</span>
              <b>{s.v} / 100</b>
            </div>
            <div className="h-2 bg-white/10 rounded-full mt-1 overflow-hidden">
              <div className="h-full" style={{ width: `${s.v}%`, background: "var(--ag-success)" }} />
            </div>
          </div>
        ))}
        <div className="mt-4 text-sm space-y-1.5">
          {["2-step verification on", "Vault encrypted", "Webhook signatures verified · 128", "No unknown devices"].map((x) => (
            <div key={x} className="flex gap-2 items-center">
              <Check size={16} style={{ color: "var(--ag-success)" }} />
              {x}
            </div>
          ))}
        </div>
      </div>
      <div className="ag-glass rounded-2xl p-4">
        <h3 className="font-bold flex gap-2 items-center">
          <Download size={18} /> Export & Audit
        </h3>
        <p className="text-sm opacity-60 mt-2">
          CSV export view — transactions, approvals and audit in one file.
        </p>
        <button
          onClick={() => {
            onToast(`CSV export prepared — ${audit.length} transactions`);
          }}
          className="mt-3 w-full px-4 py-2 rounded-full text-white text-sm font-bold"
          style={{ background: "var(--ag-accent)" }}
        >
          View CSV export
        </button>
        <div className="mt-3 bg-black/30 rounded-xl p-3 text-xs ag-mono overflow-x-auto whitespace-nowrap">
          date,name,amount,category
          <br />
          {audit.slice(0, 3).map((t) => `Today,${t.name},${t.amount},${t.cat}`).join("\n")}
        </div>
        <h4 className="font-bold mt-4 text-sm">Audit log</h4>
        <div className="text-xs space-y-1 mt-2 opacity-70">
          {audit.slice(0, 8).map((t, i) => (
            <div key={i}>
              {t.time} · {t.name} {t.amount < 0 ? "+" : "−"}{fmt(t.amount)} · {t.rule}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function AnalyticsView({ spent, fmt }: { spent: number; fmt: (n: number) => string }) {
  return (
    <div className="ag-glass rounded-2xl p-4">
      <h3 className="font-bold flex gap-2 items-center">
        <TrendingUp size={18} /> Spend by category
      </h3>
      {SPEND_BY_CATEGORY.map((c) => (
        <div key={c.l} className="mt-3">
          <div className="flex justify-between text-sm">
            <span>{c.l}</span>
            <b>{fmt(c.v)}</b>
          </div>
          <div className="h-2.5 bg-white/10 rounded-full mt-1 overflow-hidden">
            <div
              className="h-full"
              style={{ width: `${(c.v / 1840) * 100}%`, background: "linear-gradient(90deg,#4285F4,#34A853)" }}
            />
          </div>
        </div>
      ))}
      <div className="grid grid-cols-3 gap-3 mt-5 text-center">
        {[
          { l: "This week", v: fmt(spent) },
          { l: "Last week", v: "₹38,210" },
          { l: "Trend", v: "+10%" },
        ].map((x) => (
          <div key={x.l} className="rounded-xl border border-white/10 p-3">
            <div className="text-xs opacity-60">{x.l}</div>
            <div className="font-bold">{x.v}</div>
          </div>
        ))}
      </div>
      <p className="text-sm opacity-60 mt-4 flex gap-2 items-start">
        <Target size={16} className="mt-0.5 shrink-0" />
        Monthly trend: spending is steady, savings are growing. Gemini suggests napping the
        Entertainment budget for 7 days to add ₹890 to Japan Trip.
      </p>
      <div className="mt-4 space-y-3">
        {GOALS.map((g) => (
          <div key={g.name}>
            <div className="flex justify-between text-sm">
              <span>{g.name}</span>
              <b>{Math.round((g.saved / g.target) * 100)}%</b>
            </div>
            <div className="h-2 bg-white/10 rounded-full mt-1 overflow-hidden">
              <div className="h-full rounded-full" style={{ width: `${(g.saved / g.target) * 100}%`, background: g.color }} />
            </div>
            <div className="text-xs opacity-60 mt-1">
              {fmt(g.saved)} of {fmt(g.target)}
            </div>
          </div>
        ))}
      </div>
      <div className="ag-glass rounded-2xl p-3 mt-4">
        <b className="text-sm">PayPal repos · {PAYPAL_REPOS.length}</b>
        <div className="space-y-1.5 mt-2 text-xs">
          {PAYPAL_REPOS.map((r) => (
            <div key={r.name} className="flex justify-between gap-2">
              <span className="font-semibold">{r.name}</span>
              <span className="opacity-60 text-right">{r.use}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
