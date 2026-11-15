"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Command, Search as SearchIcon, X } from "lucide-react";
import { FEATURES, SHORTCUTS } from "./browser-data";
import type { Tab } from "./browser-data";

type PaletteItem = { label: string; hint: string; action?: () => void };

export function CommandPalette({
  tabs,
  onAction,
  onOpenTab,
  onClose,
}: {
  tabs: Tab[];
  onAction: (label: string) => void;
  onOpenTab: (id: string) => void;
  onClose: () => void;
}) {
  const [q, setQ] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  // Focus on mount (no setState, just focusing a ref — allowed in effect)
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const items: PaletteItem[] = useMemo(() => {
    const actions: PaletteItem[] = [
      { label: "New Tab", hint: "Cmd+T" },
      { label: "Split View - 2 panes", hint: "Cmd+\\" },
      { label: "Split to 4", hint: "" },
      { label: "Toggle Gemini AI", hint: "Cmd+I" },
      { label: "Open Money OS", hint: "" },
      { label: "Launch Agent Mission", hint: "" },
      { label: "Agent Activity / Decisions", hint: "" },
      { label: "Connect - OAuth scopes", hint: "" },
      { label: "Clean Up Tabs", hint: "Alt+Cmd+K" },
      { label: "New Space", hint: "Cmd+Shift+N" },
      { label: "Toggle Theme", hint: "Cmd+Shift+T" },
      { label: "Zen Mode", hint: "Cmd+Shift+Z" },
      { label: "Keyboard Shortcuts", hint: "Cmd+/" },
      { label: "Focus Mode", hint: "" },
    ];
    const tabItems: PaletteItem[] = tabs.map((t) => ({
      label: t.title,
      hint: t.space,
      action: () => onOpenTab(t.id),
    }));
    const featItems: PaletteItem[] = FEATURES.filter((f) =>
      f.title.toLowerCase().includes(q.toLowerCase())
    )
      .slice(0, 6)
      .map((f) => ({ label: f.title, hint: f.cat }));
    const ql = q.toLowerCase();
    const all = [...actions, ...tabItems, ...featItems];
    if (!ql) return all.slice(0, 12);
    return all.filter((x) => x.label.toLowerCase().includes(ql)).slice(0, 20);
  }, [q, tabs, onOpenTab]);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
      if (e.key === "Enter" && items[0]) {
        if (items[0].action) items[0].action();
        else onAction(items[0].label);
        onClose();
      }
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [items, onClose, onAction]);

  return (
    <div
      className="fixed inset-0 z-[70] bg-black/70 backdrop-blur-sm p-3 sm:p-6"
      onClick={onClose}
      role="dialog"
      aria-label="Command palette"
    >
      <div
        className="max-w-[640px] mx-auto rounded-[24px] overflow-hidden ag-slide-up border border-white/12"
        style={{ background: "var(--ag-card)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center gap-2 px-4 py-4 border-b border-white/10">
          <Command size={19} className="opacity-70" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Type a command, tab, or feature…"
            className="flex-1 bg-transparent text-lg min-w-0 outline-none"
            aria-label="Command query"
          />
          <kbd className="text-xs border rounded px-1.5 py-0.5 opacity-70">
            ESC
          </kbd>
        </div>
        <div className="max-h-[55vh] overflow-y-auto p-2">
          {items.length === 0 && (
            <div className="p-4 opacity-55 text-sm">
              No matches. Try &ldquo;New Tab&rdquo;, &ldquo;Split&rdquo; or
              &ldquo;AI&rdquo;.
            </div>
          )}
          {items.map((r, i) => (
            <button
              key={i}
              onClick={() => {
                if (r.action) r.action();
                else onAction(r.label);
                onClose();
              }}
              className="w-full text-left px-3 py-3 rounded-xl hover:bg-white/10 flex justify-between items-center"
            >
              <span className="flex items-center gap-2">
                <SearchIcon size={13} className="opacity-40" />
                {r.label}
              </span>
              <span className="text-xs opacity-45">{r.hint}</span>
            </button>
          ))}
        </div>
        <div className="px-4 py-2.5 text-[11px] opacity-45 border-t border-white/10 flex gap-3">
          <span>Enter open first</span>
          <span>Esc close</span>
          <span className="ml-auto ag-mono">{items.length} results</span>
        </div>
      </div>
    </div>
  );
}

export function ShortcutsModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-[70] bg-black/70 grid place-items-center p-4"
      onClick={onClose}
      role="dialog"
      aria-label="Keyboard shortcuts"
    >
      <div
        className="w-full max-w-[560px] rounded-[24px] p-5 ag-slide-up border border-white/12"
        style={{ background: "var(--ag-card)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center">
          <h3 className="text-xl font-bold">Keyboard Shortcuts</h3>
          <button onClick={onClose} aria-label="Close">
            <X size={18} />
          </button>
        </div>
        <div className="grid sm:grid-cols-2 gap-2 mt-4 text-sm">
          {SHORTCUTS.map((s) => (
            <div
              key={s[0]}
              className="flex justify-between ag-glass p-3 rounded-xl"
            >
              <span>{s[1]}</span>
              <kbd className="bg-white/10 px-2 py-1 rounded ag-mono text-xs">
                {s[0]}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
