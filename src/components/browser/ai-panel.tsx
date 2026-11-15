"use client";

import { useEffect, useRef, useState } from "react";
import { Send, Sparkles, Bot, User, Zap, Loader2, ChevronDown } from "lucide-react";
import { AI_SUGGESTIONS, AGENT_TASKS } from "./browser-data";

export type ChatMsg = { role: "ai" | "user"; content: string };

type Props = {
  onToast: (m: string) => void;
  activeTabTitle: string;
  activeTabDomain: string;
  space: string;
};

export function AIPanel({ onToast, activeTabTitle, activeTabDomain, space }: Props) {
  const [msgs, setMsgs] = useState<ChatMsg[]>([
    {
      role: "ai",
      content:
        "Hi, I'm Gemini. I can summarize this page, explain code, draft an email, plan research, or turn tabs into a to-do list. Try **Summarize this page**.",
    },
  ]);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Agentic task runner state
  const [agentOpen, setAgentOpen] = useState(false);
  const [agentRunning, setAgentRunning] = useState(false);
  const [agentTask, setAgentTask] = useState<{
    steps: { title: string; detail: string }[];
    result: string;
  } | null>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [msgs, thinking]);

  async function ask(prompt?: string) {
    const q = (prompt || input).trim();
    if (!q || thinking) return;
    const userMsg: ChatMsg = { role: "user", content: q };
    const history = [...msgs, userMsg];
    setMsgs(history);
    setInput("");
    setThinking(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          message: q,
          history: history.slice(-12).map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || j.error) throw new Error(j.error || "Request failed");
      setMsgs((m) => [...m, { role: "ai", content: j.reply }]);
    } catch (e: any) {
      setMsgs((m) => [
        ...m,
        {
          role: "ai",
          content: `I couldn't reach my model just now (${e?.message || "network error"}). Your other browser actions still work.`,
        },
      ]);
    } finally {
      setThinking(false);
    }
  }

  async function runAgent(prompt: string) {
    setAgentOpen(true);
    setAgentRunning(true);
    setAgentTask({ steps: [{ title: "Planning the mission", detail: "Decomposing your goal into steps." }], result: "" });
    try {
      const res = await fetch("/api/agent", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ prompt, space }),
      });
      const j = await res.json().catch(() => ({}));
      if (!res.ok || j.error) throw new Error(j.error || "Agent failed");
      const task = j.task;
      const steps = typeof task.steps === "string" ? JSON.parse(task.steps) : task.steps;
      setAgentTask({ steps, result: task.result || "" });
      onToast("Agent finished - review the steps below");
    } catch (e: any) {
      setAgentTask({
        steps: [{ title: "Error", detail: e?.message || "Agent failed to run." }],
        result: "",
      });
    } finally {
      setAgentRunning(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      {/* Hero */}
      <div
        className="rounded-2xl p-4 text-white relative overflow-hidden"
        style={{
          background: "linear-gradient(135deg,var(--ag-accent),var(--ag-accent2))",
        }}
      >
        <div className="flex items-center gap-2">
          <Sparkles size={18} />
          <b className="text-lg">Gemini</b>
        </div>
        <p className="text-sm opacity-85 mt-1">
          Your page, explained. Your words, improved. Your tasks, done.
        </p>
        <div className="text-[11px] opacity-70 mt-2 truncate">
          Reading: {activeTabTitle} - {activeTabDomain}
        </div>
      </div>

      {/* Agentic runner */}
      <button
        onClick={() => setAgentOpen((v) => !v)}
        className="mt-3 ag-glass rounded-2xl px-3 py-2.5 flex justify-between items-center text-left"
      >
        <span className="flex items-center gap-2 text-sm">
          <Zap size={14} style={{ color: "var(--ag-accent)" }} /> Agentic task runner
          {agentRunning && (
            <span className="text-xs opacity-70 flex items-center gap-1">
              <Loader2 size={11} className="ag-spin" /> running
            </span>
          )}
        </span>
        <ChevronDown
          size={14}
          className={agentOpen ? "rotate-180 transition" : "transition"}
        />
      </button>
      {agentOpen && (
        <div className="mt-2 ag-glass rounded-2xl p-3 space-y-2">
          <div className="text-xs opacity-60">Pick a goal - Gemini will plan it:</div>
          <div className="flex flex-wrap gap-1.5">
            {AGENT_TASKS.map((t) => (
              <button
                key={t}
                onClick={() => runAgent(t)}
                disabled={agentRunning}
                className="text-xs px-2.5 py-1.5 rounded-full bg-white/8 hover:bg-white/15 disabled:opacity-50 text-left"
              >
                {t}
              </button>
            ))}
          </div>
          {agentTask && (
            <div className="mt-2 space-y-1.5">
              {agentTask.steps.map((s, i) => (
                <div key={i} className="flex gap-2 items-start text-xs">
                  <span
                    className="w-5 h-5 rounded-md grid place-items-center shrink-0 ag-mono"
                    style={{
                      background: "var(--ag-accent)22",
                      color: "var(--ag-accent)",
                    }}
                  >
                    {i + 1}
                  </span>
                  <span>
                    <b className="block">{s.title}</b>
                    <span className="opacity-65">{s.detail}</span>
                  </span>
                </div>
              ))}
              {agentTask.result && (
                <div className="bg-white/5 rounded-xl p-2.5 text-xs leading-5 mt-2">
                  <b>Result:</b> {agentTask.result}
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Suggestions */}
      <div className="flex flex-wrap gap-1.5 mt-3">
        {AI_SUGGESTIONS.map((a) => (
          <button
            key={a}
            onClick={() => ask(a)}
            className="bg-white/8 hover:bg-white/15 px-2.5 py-1.5 rounded-full text-xs transition"
          >
            {a}
          </button>
        ))}
      </div>

      {/* Messages */}
      <div
        ref={scrollRef}
        className="flex-1 overflow-y-auto ag-no-scrollbar space-y-3 mt-3 pr-1 min-h-[120px]"
      >
        {msgs.map((m, i) => (
          <div
            key={i}
            className={`max-w-[92%] p-3 rounded-2xl text-sm leading-6 slide-up-message ${
              m.role === "ai"
                ? "bg-white/8 border border-white/10"
                : "ml-auto text-white"
            }`}
            style={m.role === "user" ? { background: "var(--ag-accent)" } : {}}
          >
            <div className="flex items-start gap-2">
              {m.role === "ai" ? (
                <Bot size={14} className="mt-0.5 shrink-0 opacity-70" />
              ) : (
                <User size={14} className="mt-0.5 shrink-0 opacity-90" />
              )}
              <div className="ag-md min-w-0 flex-1" dangerouslySetInnerHTML={{ __html: renderMarkdown(m.content) }} />
            </div>
          </div>
        ))}
        {thinking && (
          <div className="flex gap-1.5 p-2 items-center">
            {[0, 1, 2].map((i) => (
              <span
                key={i}
                className="w-2 h-2 rounded-full bg-white/70"
                style={{ animation: `ag-pulse-dot 0.8s ${i * 0.15}s infinite` }}
              />
            ))}
            <span className="text-xs opacity-60 ml-1">Gemini is thinking…</span>
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="mt-3 flex gap-2">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") ask();
          }}
          placeholder="Ask Gemini anything…"
          className="flex-1 min-w-0 bg-white/8 border border-white/10 rounded-full px-3.5 py-2.5 text-sm"
          aria-label="Ask Gemini"
        />
        <button
          onClick={() => ask()}
          disabled={thinking}
          className="w-10 h-10 rounded-full grid place-items-center text-white shrink-0 disabled:opacity-50"
          style={{ background: "var(--ag-accent)" }}
          aria-label="Send"
        >
          {thinking ? <Loader2 size={15} className="ag-spin" /> : <Send size={15} />}
        </button>
      </div>
    </div>
  );
}

// Minimal markdown renderer: **bold**, `code`, line breaks, bullets
function renderMarkdown(src: string): string {
  const esc = src
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return esc
    .replace(/`([^`]+)`/g, "<code>$1</code>")
    .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
    .split("\n")
    .map((line) => {
      const t = line.trim();
      if (!t) return "<br/>";
      if (/^[-*] /.test(t)) return `<div>• ${t.slice(2)}</div>`;
      if (/^\d+\.\s/.test(t)) {
        const m = t.match(/^(\d+)\.\s(.*)/);
        if (m) return `<div>${m[1]}. ${m[2]}</div>`;
      }
      return `<p>${t}</p>`;
    })
    .join("");
}
