"use client";

import { Keyboard, Moon, Sun } from "lucide-react";
import { THEMES, SHORTCUTS } from "./browser-data";

export type SettingsState = {
  adblock: boolean;
  trackers: boolean;
  autonap: boolean;
  breathing: boolean;
  zen: boolean;
  sound: boolean;
  sync: boolean;
};

const LABELS: Record<keyof SettingsState, string> = {
  adblock: "Ad Block",
  trackers: "Tracker Blocking",
  autonap: "Auto-Nap Tabs",
  breathing: "Breathing Light",
  zen: "Zen Mode",
  sound: "Sound Effects",
  sync: "Sync via Google E2EE",
};

type Props = {
  settings: SettingsState;
  setSettings: (updater: (s: SettingsState) => SettingsState) => void;
  themeName: string;
  setThemeName: (t: string) => void;
  dark: boolean;
  setDark: (d: boolean) => void;
  onToast: (m: string) => void;
  onOpenShortcuts: () => void;
};

export function SettingsPanel({
  settings,
  setSettings,
  themeName,
  setThemeName,
  dark,
  setDark,
  onToast,
  onOpenShortcuts,
}: Props) {
  return (
    <div>
      <b className="text-xl">Settings</b>
      <p className="text-xs opacity-55 mt-1">
        Every toggle changes this window.
      </p>
      <div className="mt-3 space-y-2">
        {(Object.keys(settings) as (keyof SettingsState)[]).map((k) => (
          <button
            key={k}
            onClick={() => {
              const v = !settings[k];
              setSettings((s) => ({ ...s, [k]: v }));
              onToast(`${LABELS[k]} ${v ? "on" : "off"}`);
            }}
            className="w-full ag-glass p-3 rounded-2xl flex justify-between items-center text-left"
          >
            <span>
              <b className="text-sm block">{LABELS[k]}</b>
              <span className="text-xs opacity-55">
                {settings[k] ? "Enabled" : "Paused"}
              </span>
            </span>
            <span
              className="w-11 h-6 rounded-full p-0.5 flex transition"
              style={{
                background: settings[k]
                  ? "var(--ag-accent)"
                  : "rgba(255,255,255,0.2)",
                justifyContent: settings[k] ? "flex-end" : "flex-start",
              }}
            >
              <span className="w-5 h-5 bg-white rounded-full block" />
            </span>
          </button>
        ))}
      </div>

      <div className="mt-4">
        <b className="text-sm">Theme - 8 gradients</b>
        <div className="grid grid-cols-2 gap-2 mt-2">
          {Object.keys(THEMES).map((t) => (
            <button
              key={t}
              onClick={() => {
                setThemeName(t);
                onToast(`Theme: ${t}`);
              }}
              className="rounded-xl p-2.5 text-left text-xs font-bold border transition"
              style={{
                background: `linear-gradient(135deg,${THEMES[t].accent},${THEMES[t].accent2})`,
                borderColor: themeName === t ? "white" : "transparent",
                color: "#0A0A0A",
              }}
            >
              {t}
              {themeName === t ? " OK" : ""}
            </button>
          ))}
        </div>
        <div className="flex gap-2 mt-3">
          <button
            onClick={() => {
              setDark(!dark);
              onToast(dark ? "Light mode on" : "Dark mode on");
            }}
            className="flex-1 ag-glass py-2.5 rounded-xl text-sm flex justify-center gap-2 items-center"
          >
            {dark ? <Sun size={15} /> : <Moon size={15} />} {dark ? "Light" : "Dark"}
          </button>
          <button
            onClick={onOpenShortcuts}
            className="flex-1 ag-glass py-2.5 rounded-xl text-sm flex justify-center gap-2 items-center"
          >
            <Keyboard size={15} /> Shortcuts
          </button>
        </div>
      </div>

      <div className="ag-glass rounded-2xl p-3 mt-4 text-xs leading-5">
        <b>Storage note</b>
        <p className="opacity-55 mt-1">
          Quick Notes, History and Agent Tasks are persisted in a local SQLite
          database via Prisma. Gemini chat runs through the z-ai-web-dev-sdk on
          the server.
        </p>
      </div>

      <div className="ag-glass rounded-2xl p-3 mt-3">
        <b className="text-sm">Keyboard shortcuts</b>
        <div className="grid grid-cols-2 gap-1.5 mt-2 text-xs">
          {SHORTCUTS.map((s) => (
            <div key={s[0]} className="flex justify-between bg-white/5 p-2 rounded-lg">
              <span className="opacity-80">{s[1]}</span>
              <kbd className="bg-white/10 px-1.5 py-0.5 rounded ag-mono">
                {s[0]}
              </kbd>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
