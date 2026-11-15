"use client";

import { useState } from "react";
import { AIPanel } from "./ai-panel";
import { FeaturesPanel } from "./features-panel";
import { SettingsPanel, type SettingsState } from "./settings-panel";
import { MoneyPanel } from "./money-panel";
import { AgentPanel } from "./agent-panel";
import { ActivityPanel } from "./activity-panel";
import { ConnectPanel } from "./connect-panel";

export type RightTab =
  | "ai"
  | "money"
  | "agents"
  | "activity"
  | "connect"
  | "features"
  | "settings";

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

// The right-panel tab bar is two rows so all seven tabs fit comfortably.
const TAB_ROW1: { id: RightTab; label: string }[] = [
  { id: "ai", label: "Gemini" },
  { id: "money", label: "Money" },
  { id: "agents", label: "Agents" },
];
const TAB_ROW2: { id: RightTab; label: string }[] = [
  { id: "activity", label: "Activity" },
  { id: "connect", label: "Connect" },
  { id: "features", label: "112+" },
  { id: "settings", label: "Settings" },
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

  const TabBtn = ({ id, label }: { id: RightTab; label: string }) => (
    <button
      onClick={() => setRightTab(id)}
      className="flex-1 py-2 rounded-xl text-[13px] font-bold transition"
      style={{
        background: rightTab === id ? "var(--ag-accent)" : "rgba(255,255,255,0.06)",
        color: rightTab === id ? "#fff" : "inherit",
      }}
    >
      {label}
    </button>
  );

  return (
    <aside
      className="hidden lg:flex w-[350px] shrink-0 flex-col border-l border-white/10"
      style={{ background: "rgba(255,255,255,0.035)" }}
    >
      <div className="p-3 pb-1 flex gap-1">
        {TAB_ROW1.map((t) => (
          <TabBtn key={t.id} {...t} />
        ))}
      </div>
      <div className="px-3 pb-2 flex gap-1">
        {TAB_ROW2.map((t) => (
          <TabBtn key={t.id} {...t} />
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
        {rightTab === "money" && <MoneyPanel onToast={onToast} />}
        {rightTab === "agents" && <AgentPanel onToast={onToast} />}
        {rightTab === "activity" && <ActivityPanel onToast={onToast} />}
        {rightTab === "connect" && <ConnectPanel onToast={onToast} />}
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
export function useRightTab(initial: RightTab = "features") {
  return useState<RightTab>(initial);
}
