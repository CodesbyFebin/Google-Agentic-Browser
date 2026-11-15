"use client";

// Connect panel — the right-side "Connect" tab.
// Ports GB2's ConnectPanel: OAuth scope cards (least-privilege), a quota
// meter for YouTube / Gmail / Gemini grounding, a traffic-light throttle
// simulator, and a consent log fetched from /api/connect.

import { useCallback, useEffect, useState } from "react";
import { Gauge, Lock } from "lucide-react";
import { CONNECT_APPS, QUOTAS } from "./browser-data";

type LogEntry = { time: string; scope: string; decision: "granted" | "denied"; who: string };

export function ConnectPanel({ onToast }: { onToast: (m: string) => void }) {
  const [log, setLog] = useState<LogEntry[]>([]);
  const [traffic, setTraffic] = useState<"Green" | "Yellow" | "Red">("Green");
  const [quotaOn, setQuotaOn] = useState(true);
  const [gmailModify, setGmailModify] = useState(false);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/connect");
      const j = await r.json().catch(() => ({}));
      if (!r.ok || j.error) return;
      setLog(j.log || []);
    } catch {
      /* in-memory only is fine */
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function requestScope(scope: string) {
    try {
      await fetch("/api/connect", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ scope, decision: "granted" }),
      });
      setGmailModify(true);
      await load();
      onToast(`${scope} recorded for demo only`);
    } catch {
      onToast("Consent log unavailable");
    }
  }

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border p-4" style={{ borderColor: "rgba(66,133,244,0.4)", background: "rgba(66,133,244,0.1)" }}>
        <div className="font-bold text-sm">
          Workspace OAuth integration · demonstration
        </div>
        <p className="text-sm opacity-70 mt-1">
          This is a third-party concept prototype. It does not claim real Google login or real
          data access — all data shown is demo / sandbox data.
        </p>
      </div>

      <div className="flex items-center justify-between ag-glass rounded-2xl p-4">
        <div>
          <div className="font-bold text-sm">Traffic Light Throttling</div>
          <div className="text-xs opacity-60">Current load state</div>
        </div>
        <button
          onClick={() =>
            setTraffic((t) => (t === "Green" ? "Yellow" : t === "Yellow" ? "Red" : "Green"))
          }
          className="flex items-center gap-2 ag-glass px-3 py-2 rounded-full"
        >
          <span
            className="w-3 h-3 rounded-full"
            style={{
              background:
                traffic === "Green" ? "#34A853" : traffic === "Yellow" ? "#FBBC04" : "#EA4335",
            }}
          />
          <b className="text-sm">{traffic}</b>
          <span className="text-xs opacity-60">Tap to simulate</span>
        </button>
      </div>

      <div className="space-y-3">
        {CONNECT_APPS.map((c) => (
          <div key={c.name} className="ag-glass rounded-2xl p-4">
            <div className="flex justify-between gap-2">
              <b>{c.name}</b>
              <span
                className="text-xs px-2 py-1 rounded-full h-fit"
                style={{
                  background: "rgba(251,188,4,0.2)",
                  color: "#FBBC04",
                }}
              >
                Demo only
              </span>
            </div>
            <div className="text-xs ag-mono opacity-60 mt-1">{c.scope}</div>
            <p className="text-sm opacity-70 mt-1">{c.desc}</p>
            <p className="text-xs opacity-55 mt-1">
              Least privilege: only this scope is requested. No broad mailbox or drive access.
            </p>
            {c.name === "Gmail" && (
              <button
                onClick={() => requestScope("gmail.modify")}
                className="mt-3 ag-glass px-4 py-2.5 rounded-full text-sm font-bold"
              >
                {gmailModify ? "gmail.modify demo choice ✓" : "Record demo gmail.modify consent"}
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="ag-glass rounded-2xl p-4">
        <h4 className="font-bold flex gap-2 items-center">
          <Gauge size={18} /> Quota meters
        </h4>
        <button
          onClick={() => setQuotaOn((v) => !v)}
          className="text-xs opacity-60 mt-1 hover:opacity-100"
        >
          {quotaOn ? "Tap to hide" : "Tap to show"}
        </button>
        {QUOTAS.map((q) => (
          <div key={q.l} className="mt-4">
            <div className="flex justify-between text-sm">
              <span>{q.l}</span>
              <span className="opacity-60">{q.note}</span>
            </div>
            <div className="h-2.5 bg-white/10 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full transition-all"
                style={{
                  width: quotaOn ? `${q.v}%` : "0%",
                  background: "linear-gradient(90deg,#4285F4,#34A853)",
                }}
              />
            </div>
            <div className="text-xs opacity-60 mt-1">{q.v}% used in this demo</div>
          </div>
        ))}
      </div>

      <div className="ag-glass rounded-2xl p-4">
        <h4 className="font-bold flex gap-2 items-center">
          <Lock size={18} /> Consent log
        </h4>
        <div className="space-y-1 text-sm opacity-70 mt-2">
          {log.length === 0 && <p className="opacity-55">No consent events yet.</p>}
          {log.map((e, i) => (
            <div key={i} className="ag-mono text-xs">
              {e.time} · {e.scope} {e.decision} · {e.who}
            </div>
          ))}
        </div>
        <p className="text-xs opacity-55 mt-3">
          GDPR Art. 22 — high-stakes actions always show an approval path. The agent never
          pays, books, sends, or deletes without that path.
        </p>
      </div>
    </div>
  );
}
