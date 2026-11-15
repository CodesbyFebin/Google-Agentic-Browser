"use client";

// Activity panel — the right-side "Activity" tab.
// Ports GB2's ActivityPanel: a decision log that shows *why* each agent action
// happened (high vs low confidence), plus the three Autonomy controls.

import { useState } from "react";
import { Activity, SlidersHorizontal } from "lucide-react";
import {
  AUTONOMY_DESC,
  INITIAL_FEED,
  type Autonomy,
  type FeedEntry,
} from "./browser-data";

const FILTERS = ["All", "Gmail", "Drive", "Calendar", "Search"] as const;

export function ActivityPanel({ onToast }: { onToast: (m: string) => void }) {
  const [feed, setFeed] = useState<FeedEntry[]>(INITIAL_FEED);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("All");
  const [autonomy, setAutonomy] = useState<Autonomy>("Supervised Autonomy");

  const filtered = feed.filter((f) => filter === "All" || f.source === filter);

  function testAutonomy() {
    const id = Math.max(...feed.map((f) => f.id), 0) + 1;
    setFeed((f) => [
      {
        id,
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        source: "Search",
        conf: "high",
        text: "Tested a ₹499 guarded request",
        why: `Autonomy is ${autonomy}. ${AUTONOMY_DESC[autonomy]}`,
      },
      ...f,
    ]);
    onToast(`Tested autonomy — ${autonomy}`);
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="font-bold flex gap-2 items-center">
          <Activity size={18} /> Agent Activity Feed / Decision Log
        </h3>
        <p className="text-sm opacity-60 mt-1">
          Every action shows why it happened. Solid line = high confidence. Hatched
          line = low confidence.
        </p>
      </div>

      <div className="flex gap-2 overflow-x-auto ag-no-scrollbar pb-1">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className="shrink-0 px-3 py-1.5 rounded-full text-xs border"
            style={{
              background: filter === f ? "var(--ag-accent)" : "transparent",
              borderColor: filter === f ? "var(--ag-accent)" : "rgba(255,255,255,0.12)",
              color: filter === f ? "#fff" : "inherit",
            }}
          >
            {f}
          </button>
        ))}
      </div>

      <div className="space-y-3">
        {filtered.map((f) => (
          <div key={f.id} className="ag-glass rounded-2xl p-4">
            <div className="flex justify-between gap-2">
              <span className="text-xs px-2 py-1 rounded-full ag-glass">{f.source}</span>
              <span className="text-xs opacity-55">{f.time}</span>
            </div>
            <div className="font-semibold mt-2">{f.text}</div>
            <div className="text-sm opacity-70 mt-1">WHY: {f.why}</div>
            <div className="mt-3 flex items-center gap-2">
              <span
                className="h-1.5 flex-1 rounded-full"
                style={{
                  background:
                    f.conf === "high"
                      ? "var(--ag-success)"
                      : "repeating-linear-gradient(45deg,#facc15 0 6px,transparent 6px 12px)",
                  border: f.conf === "high" ? "none" : "1px solid rgba(250,204,21,0.4)",
                }}
              />
              <span className="text-xs">
                {f.conf === "high" ? "High confidence" : "Low confidence"}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="ag-glass rounded-2xl p-4">
        <h4 className="font-bold flex gap-2 items-center">
          <SlidersHorizontal size={18} /> Autonomy Controls
        </h4>
        <div className="grid grid-cols-3 gap-1 mt-3 bg-white/5 rounded-full p-1">
          {(["Full Autonomy", "Supervised Autonomy", "Approval Required"] as const).map((m) => (
            <button
              key={m}
              onClick={() => {
                setAutonomy(m);
                onToast(`Autonomy: ${m}`);
              }}
              className="px-2 py-2.5 rounded-full text-[11px] sm:text-sm font-bold leading-tight"
              style={{
                background: autonomy === m ? "var(--ag-accent)" : "transparent",
                color: autonomy === m ? "#fff" : "inherit",
              }}
            >
              {m}
            </button>
          ))}
        </div>
        <p className="text-sm opacity-70 mt-3">{AUTONOMY_DESC[autonomy]}</p>
        <div className="text-sm mt-2 ag-glass rounded-xl p-3">
          Status: <b>{autonomy}</b> ·{" "}
          {autonomy === "Full Autonomy"
            ? "Approvals will be logged silently."
            : autonomy === "Supervised Autonomy"
            ? "Low-risk approvals auto-approve in 5s."
            : "All approvals stay pending until you decide."}
        </div>
        <p className="text-xs opacity-55 mt-2">
          Progressive delegation: start in Approval Required, move to Supervised as trust
          grows, and use Full only for narrow, reversible tasks.
        </p>
        <button
          onClick={testAutonomy}
          className="mt-3 w-full py-2.5 rounded-full text-sm font-bold ag-glass"
        >
          Test autonomy with a ₹499 request
        </button>
      </div>
    </div>
  );
}
