"use client";

// Agent panel — the right-side "Agents" tab.
// Renders the Nova Prime mission launcher, the agent roster with passports,
// the live mission recorder log, and the replay scrubber. The x402 payment
// and Google OAuth consent gates are surfaced as modal dialogs that resolve
// the mission store's gate promise. Ports the rich HTML prototype's mission UI.

import { useEffect } from "react";
import { Loader2, Lock, ShieldAlert, Sparkles, X } from "lucide-react";
import {
  AGENTS,
  didFor,
  type AgentId,
  type AgentDef,
} from "./browser-data";
import { useMission, type GateKind } from "./mission-store";

const ROSTER: AgentId[] = ["orch", "scout", "ana", "sent", "buy", "scr"];

export function AgentPanel({ onToast }: { onToast: (m: string) => void }) {
  const { goal, setGoal, running, events, view, setView, gate, gateKind, twin, toggleTwin, run, missions, lastReceipt } = useMission();

  // Auto-persist each finished mission run to the server. We watch for the
  // transition running=true -> running=false with events present.
  const runningRef = useRunningFlag(running, events.length, async () => {
    try {
      await fetch("/api/agent/mission", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          goal,
          steps: events,
          receipt: lastReceipt,
          usdcSpent: events.reduce((s, e) => s + (e.cost || 0), 0),
          gates: events.filter((e) => e.t === "gate").length,
          denied: events.some((e) => e.t === "deny"),
          twin,
          space: "Research",
        }),
      });
    } catch {
      /* best-effort persistence */
    }
  });

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Mission launcher */}
      <div
        className="rounded-2xl p-4 text-white relative overflow-hidden"
        style={{ background: "linear-gradient(135deg,var(--ag-accent),var(--ag-accent2))" }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xl">🦄</span>
          <b className="text-lg">Nova Prime</b>
        </div>
        <p className="text-sm opacity-85 mt-1">
          Explore a scripted agent mission with a recorder and approval checkpoints. All external actions are simulated.
        </p>
        <div className="flex flex-wrap gap-1.5 mt-3">
          <button
            onClick={() => setGoal("Find the best Postgres MCP server and buy API access")}
            className="bg-white/20 hover:bg-white/30 px-2.5 py-1.5 rounded-full text-xs"
          >
            Buy an MCP server
          </button>
          <button
            onClick={() => {
              toggleTwin();
              onToast(`Digital Twin ${twin ? "off" : "on — dry run"}`);
            }}
            className="bg-white/20 hover:bg-white/30 px-2.5 py-1.5 rounded-full text-xs"
          >
            Twin: {twin ? "ON" : "off"}
          </button>
        </div>
      </div>

      {/* Run row */}
      <div className="flex gap-2">
        <input
          value={goal}
          onChange={(e) => setGoal(e.target.value)}
          className="flex-1 min-w-0 bg-white/8 border border-white/10 rounded-full px-3 py-2.5 text-sm"
          aria-label="Mission goal"
        />
        <button
          onClick={() => run()}
          disabled={running}
          className="px-4 rounded-full text-white text-sm font-bold shrink-0 disabled:opacity-50 flex items-center gap-1"
          style={{ background: "var(--ag-accent)" }}
        >
          {running ? <Loader2 size={13} className="ag-spin" /> : <Sparkles size={13} />}
          {running ? "Running" : "Run"}
        </button>
      </div>

      {/* Roster */}
      <div className="space-y-2">
        <b className="text-xs tracking-widest opacity-50">AGENT ROSTER</b>
        {ROSTER.map((id) => (
          <AgentRow key={id} id={id} />
        ))}
      </div>

      {/* Recorder log */}
      <div className="flex flex-col min-h-0 flex-1">
        <div className="flex items-center justify-between">
          <b className="text-xs tracking-widest opacity-50">RECORDER</b>
          <span className="text-[11px] opacity-50 ag-mono">
            {missions} run{missions === 1 ? "" : "s"} ·{" "}
            {events.reduce((s, e) => s + (e.cost || 0), 0).toFixed(2)} USDC
          </span>
        </div>
        <div className="flex items-center gap-2 text-xs opacity-60 mt-2">
          <span>Replay</span>
          <input
            type="range"
            min={0}
            max={Math.max(0, events.length)}
            value={view === null ? events.length : view}
            disabled={running || events.length === 0}
            onChange={(e) => setView(+e.target.value >= events.length ? null : +e.target.value)}
            className="flex-1"
            style={{ accentColor: "var(--ag-accent)" }}
            aria-label="Replay scrubber"
          />
          <button
            onClick={() => setView(null)}
            className="ag-glass px-2 py-1 rounded-full"
          >
            Live
          </button>
        </div>
        <div className="space-y-2 mt-2 overflow-y-auto ag-no-scrollbar pr-1 flex-1 min-h-[80px]">
          {events.length === 0 && (
            <p className="text-sm opacity-50 p-2">
              No mission yet. Simulated steps and approval decisions will be recorded here.
            </p>
          )}
          {events.map((e, i) => {
            const ag = AGENTS[e.a as AgentId] || AGENTS.orch;
            const active = view === null ? i === events.length - 1 : i === view - 1;
            const border = e.t === "gate" ? "var(--ag-warn)" : e.t === "deny" ? "var(--ag-danger)" : active ? "var(--ag-accent)" : "rgba(255,255,255,0.08)";
            return (
              <button
                key={i}
                onClick={() => !running && setView(i + 1)}
                className="w-full ag-glass rounded-2xl p-3 flex gap-2 text-left text-xs"
                style={{ borderColor: border }}
              >
                <span className="text-lg shrink-0">{ag.emoji}</span>
                <span className="flex-1 min-w-0">
                  <b>{ag.name}</b>{" "}
                  <span className="opacity-70">{e.msg}</span>
                </span>
                <span className="ag-mono opacity-40 shrink-0">{e.at}s</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Gates */}
      {gate && gateKind && (
        <GateModal kind={gateKind} onResolve={(ok) => useMission.getState().resolveGate(ok)} />
      )}
    </div>
  );
}

function AgentRow({ id }: { id: AgentId }) {
  const { events, view } = useMission();
  const a: AgentDef = AGENTS[id];
  const k = view === null ? events.length : view;
  const spentBy = events.slice(0, k).reduce((s, e) => s + (e.cost && e.a === id ? e.cost : 0), 0);
  const isCurrent = k > 0 && events[k - 1]?.a === id;
  return (
    <button
      className="w-full ag-glass rounded-2xl p-3 flex gap-3 items-center text-left"
      style={{ borderColor: isCurrent ? "var(--ag-accent)" : undefined }}
    >
      <span className="text-2xl shrink-0">{a.emoji}</span>
      <span className="min-w-0 flex-1">
        <b className="text-sm block">{a.name}</b>
        <span className="text-[11px] opacity-55 block truncate">
          {a.role} · {didFor(id).slice(0, 20)}…
        </span>
      </span>
      <span className="ag-mono text-xs text-right shrink-0">
        {(a.balance - spentBy).toFixed(2)}
        <span className="block text-[10px] opacity-50">USDC</span>
      </span>
    </button>
  );
}

function GateModal({
  kind,
  onResolve,
}: {
  kind: GateKind;
  onResolve: (ok: boolean) => void;
}) {
  if (kind === "oauth") return <OAuthModal onResolve={onResolve} />;
  return <PaymentModal onResolve={onResolve} />;
}

function PaymentModal({ onResolve }: { onResolve: (ok: boolean) => void }) {
  return (
    <div className="fixed inset-0 z-[80] bg-black/70 grid place-items-center p-4">
      <div className="w-full max-w-[460px] rounded-[24px] p-5 ag-slide-up ag-glass-strong">
        <div className="flex justify-between items-start">
          <div>
            <b className="text-xl flex items-center gap-2">
              <ShieldAlert size={18} style={{ color: "var(--ag-warn)" }} />
              Human approval checkpoint
            </b>
            <p className="text-sm mt-2 opacity-75">
              Bee Buyer wants to pay <b>2.00 USDC</b> via x402 to{" "}
              <span className="ag-mono">mcpserver.in</span> for the pg-mcp-gateway API key.
            </p>
          </div>
          <button onClick={() => onResolve(false)} aria-label="Close" className="opacity-60 hover:opacity-100">
            <X size={16} />
          </button>
        </div>
        <div className="flex gap-2 mt-4">
          <button
            onClick={() => onResolve(true)}
            className="px-4 py-2.5 rounded-full text-white text-sm font-bold flex-1"
            style={{ background: "var(--ag-accent)" }}
          >
            Approve once
          </button>
          <button
            onClick={() => onResolve(false)}
            className="ag-glass px-4 py-2.5 rounded-full text-sm flex-1"
          >
            Deny
          </button>
        </div>
      </div>
    </div>
  );
}

function OAuthModal({ onResolve }: { onResolve: (ok: boolean) => void }) {
  const scopes: [string, string][] = [
    ["🔺", "Save files to Drive"],
    ["📄", "Create Google Docs"],
    ["📅", "Add Calendar events"],
    ["✉️", "Send email as you"],
  ];
  return (
    <div className="fixed inset-0 z-[80] bg-black/70 grid place-items-center p-4">
      <div className="w-full max-w-[420px] rounded-[28px] p-6 ag-slide-up" style={{ background: "#fff", color: "#202124" }}>
        <div className="text-center text-sm">
          <span style={{ color: "#4285F4" }}>●</span>
          <span style={{ color: "#EA4335" }}>●</span>
          <span style={{ color: "#FBBC04" }}>●</span>
          <span style={{ color: "#34A853" }}>●</span>{" "}
          <b>Google Account access</b>
          <div className="text-[11px]" style={{ color: "#80868b" }}>
            Simulated consent screen
          </div>
        </div>
        <h3 className="text-xl mt-4 font-medium">Scribe Turtle wants access to your Google Account</h3>
        <p className="text-sm mt-2" style={{ color: "#5f6368" }}>
          It will only touch items it creates during this mission.
        </p>
        <div className="mt-3 space-y-2 text-sm">
          {scopes.map((x) => (
            <div key={x[1]} className="flex gap-3 items-center rounded-xl p-2.5" style={{ background: "#f1f3f4" }}>
              <span>{x[0]}</span>
              {x[1]}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-2 text-[11px]" style={{ color: "#5f6368" }}>
          <Lock size={12} /> Least privilege · Revocable · Incremental auth
        </div>
        <div className="flex justify-end gap-2 mt-5">
          <button
            onClick={() => onResolve(false)}
            className="px-5 py-2 rounded-full text-sm font-medium"
            style={{ color: "#1a73e8" }}
          >
            Deny
          </button>
          <button
            onClick={() => onResolve(true)}
            className="px-5 py-2 rounded-full text-sm font-medium text-white"
            style={{ background: "#1a73e8" }}
          >
            Allow
          </button>
        </div>
      </div>
    </div>
  );
}

// Track `running` transitions to true -> false and fire a callback once.
function useRunningFlag(running: boolean, count: number, onDone: () => void) {
  useEffect(() => {
    if (!running && count > 0) {
      onDone();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [running]);
  return null;
}
