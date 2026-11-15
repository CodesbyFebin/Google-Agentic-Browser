"use client";

import {
  Columns2,
  PanelRight,
  Settings,
  Sparkles,
} from "lucide-react";

type Props = {
  onToggleSidebar: () => void;
  onSplit: () => void;
  onOpenAI: () => void;
  onToggleFocus: () => void;
  onToggleZen: () => void;
  onOpenSettings: () => void;
  onOpenFeatures: () => void;
  focusMode: boolean;
  zen: boolean;
  split: number;
};

export function TopBar({
  onToggleSidebar,
  onSplit,
  onOpenAI,
  onToggleFocus,
  onToggleZen,
  onOpenSettings,
  onOpenFeatures,
  focusMode,
  zen,
  split,
}: Props) {
  return (
    <header
      className="sticky z-40 flex items-center gap-2 px-3 sm:px-4 py-2 border-b border-white/10"
      style={{
        top: 0,
        background: "rgba(8,10,22,0.82)",
        backdropFilter: "blur(20px)",
      }}
    >
      {/* Window dots */}
      <div className="flex gap-1.5 shrink-0">
        <span className="w-3 h-3 rounded-full bg-[#FF5F57]" />
        <span className="w-3 h-3 rounded-full bg-[#FEBC2E]" />
        <span className="w-3 h-3 rounded-full bg-[#28C840]" />
      </div>

      <button
        onClick={onToggleSidebar}
        className="hidden sm:grid w-8 h-8 place-items-center rounded-lg hover:bg-white/10 transition"
        aria-label="Toggle sidebar"
      >
        <PanelRight size={17} />
      </button>

      {/* Brand */}
      <div className="min-w-0">
        <div className="font-bold truncate text-[14px] sm:text-[15px] flex items-center gap-1.5">
          <span
            className="w-5 h-5 rounded-md grid place-items-center text-[10px] font-bold text-white"
            style={{
              background: "linear-gradient(135deg,#4285F4,#34A853,#FBBC04,#EA4335)",
            }}
          >
            A
          </span>
          Google Agentic Browser
          <span className="hidden md:inline opacity-40 font-normal text-[12px]">
            - the browser that does
          </span>
        </div>
        <div className="text-[11px] opacity-45 hidden sm:block">
          Concept prototype - 2027 - Gemini-powered
        </div>
      </div>

      <div className="ml-auto flex flex-wrap items-center gap-1">
        <button
          onClick={onSplit}
          className="px-2.5 py-1.5 rounded-full text-xs ag-glass flex gap-1 items-center hover:border-white/30 transition"
        >
          <Columns2 size={14} />
          <span className="hidden lg:inline">
            Split {split > 1 ? `(${split})` : "View"}
          </span>
        </button>
        <button
          onClick={onOpenAI}
          className="px-2.5 py-1.5 rounded-full text-xs flex gap-1 items-center text-white hover:opacity-90 transition"
          style={{ background: "var(--ag-accent)" }}
        >
          <Sparkles size={14} />
          <span className="hidden lg:inline">Gemini</span>
        </button>
        <button
          onClick={onToggleFocus}
          className="px-2.5 py-1.5 rounded-full text-xs ag-glass hover:border-white/30 transition"
          style={{ background: focusMode ? "var(--ag-accent)22" : undefined }}
        >
          <span className="hidden lg:inline">Focus</span> F
        </button>
        <button
          onClick={onToggleZen}
          className="px-2.5 py-1.5 rounded-full text-xs ag-glass hover:border-white/30 transition"
          style={{ background: zen ? "var(--ag-accent)22" : undefined }}
        >
          <span className="hidden lg:inline">Zen</span> Z
        </button>
        <button
          onClick={onOpenSettings}
          className="px-2.5 py-1.5 rounded-full text-xs ag-glass flex gap-1 items-center hover:border-white/30 transition"
          aria-label="Settings"
        >
          <Settings size={14} />
          <span className="hidden lg:inline">Settings</span>
        </button>
        <button
          onClick={onOpenFeatures}
          className="px-2.5 py-1.5 rounded-full text-xs text-black font-bold hover:opacity-90 transition"
          style={{ background: "var(--ag-warn)" }}
        >
          112+ Features
        </button>
      </div>
    </header>
  );
}
