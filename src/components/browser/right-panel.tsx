"use client";

import { useState } from "react";
import { AIPanel } from "./ai-panel";
import { FeaturesPanel } from "./features-panel";
import { SettingsPanel, type SettingsState } from "./settings-panel";

type RightTab = "ai" | "features" | "settings";

type Props = {
  rightTab: RightTab;
  setRightTab: (t: RightTab) => void;
  onClose: () => void;
  onToast: (m: string) => void;
  activeTabTitle: string;
  activeTabDomain: string;
  space: string;
  settings: SettingsState;
  setSettings: (u: (s: SettingsState) => SettingsState) => void;
  themeName: string;
  setThemeName: (t: string) => void;
  dark: boolean;
  setDark: (d: boolean) => void;
  onOpenShortcuts: () => void;
};

const TABS: { id: RightTab; label: string; icon: string }[] = [
  { id: "ai", label: "Gemini", icon: "S" },
  { id: "features", label: "112+", icon: "+" },
  { id: "settings", label: "Settings", icon: "*" },
];

export function RightPanel(props: Props) {
  const {
    rightTab,
    setRightTab,
    onClose,
    onToast,
    activeTabTitle,
    activeTabDomain,
    space,
    settings,
    setSettings,
    themeName,
    setThemeName,
    dark,
    setDark,
    onOpenShortcuts,
  } = props;

  return (
    <aside
      className="hidden lg:flex w-[350px] shrink-0 flex-col border-l border-white/10"
      style={{ background: "rgba(255,255,255,0.035)" }}
    >
      <div className="p-3 flex gap-1">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setRightTab(t.id)}
            className="flex-1 py-2 rounded-xl text-[13px] font-bold transition"
            style={{
              background: rightTab === t.id ? "var(--ag-accent)" : "rgba(255,255,255,0.06)",
              color: rightTab === t.id ? "#fff" : "inherit",
            }}
          >
            {t.label}
          </button>
        ))}
      </div>
      <button
        onClick={onClose}
        className="mx-3 mb-2 text-xs opacity-55 text-right hover:opacity-80"
      >
        Hide panel
      </button>
      <div className="flex-1 overflow-y-auto px-3 pb-3 min-h-0 ag-no-scrollbar">
        {rightTab === "ai" && (
          <AIPanel
            onToast={onToast}
            activeTabTitle={activeTabTitle}
            activeTabDomain={activeTabDomain}
            space={space}
          />
        )}
        {rightTab === "features" && <FeaturesPanel onToast={onToast} />}
        {rightTab === "settings" && (
          <SettingsPanel
            settings={settings}
            setSettings={setSettings}
            themeName={themeName}
            setThemeName={setThemeName}
            dark={dark}
            setDark={setDark}
            onToast={onToast}
            onOpenShortcuts={onOpenShortcuts}
          />
        )}
      </div>
    </aside>
  );
}

// Re-export for parent typing convenience
export type { RightTab };
export function useRightTab(initial: RightTab = "features") {
  return useState<RightTab>(initial);
}
