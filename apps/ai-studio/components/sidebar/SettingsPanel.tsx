'use client';

import React, { useState } from 'react';
import { RotateCcw, Settings2, Shield } from 'lucide-react';
import { useBrowserState } from '../BrowserStateProvider';
import { GEMINI_MODELS } from '@/lib/models';
import type { SplitLayout } from '@/lib/types';

export function SettingsPanel() {
  const { settings, updateSettings, resetLocalWorkspace, firestoreStatus } =
    useBrowserState();
  const [confirmReset, setConfirmReset] = useState(false);

  const textModels = GEMINI_MODELS.filter((m) => m.category === 'text');

  return (
    <div className="h-full overflow-y-auto p-3 space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <Settings2 className="h-4 w-4 text-blue-400" />
          <h3 className="font-display text-sm font-semibold text-slate-100">
            Browser Settings
          </h3>
        </div>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Preferences persist locally and sync to Firestore when signed in.
        </p>
      </div>

      <div className="rounded-xl border border-slate-800 bg-[#0b101b] p-3 space-y-3 text-xs">
        <label className="block">
          <span className="text-slate-300 font-medium">Default Gemini Model</span>
          <select
            value={settings.defaultModel}
            onChange={(e) => updateSettings({ defaultModel: e.target.value })}
            className="mt-1 w-full rounded-lg border border-slate-800 bg-[#080c14] px-2.5 py-1.5 text-xs text-slate-100"
          >
            {textModels.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label}
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <span className="text-slate-300 font-medium">Default Split Layout</span>
          <select
            value={settings.defaultSplit}
            onChange={(e) =>
              updateSettings({ defaultSplit: Number(e.target.value) as SplitLayout })
            }
            className="mt-1 w-full rounded-lg border border-slate-800 bg-[#080c14] px-2.5 py-1.5 text-xs text-slate-100"
          >
            <option value={1}>1 Pane (Single)</option>
            <option value={2}>2 Panes (Split)</option>
            <option value={3}>3 Panes</option>
            <option value={4}>4-Pane Grid</option>
          </select>
        </label>

        <label className="flex items-center justify-between gap-2 cursor-pointer pt-1">
          <span className="text-slate-300">Strict Human Approval Mode</span>
          <input
            type="checkbox"
            checked={settings.strictApprovalMode}
            onChange={(e) =>
              updateSettings({ strictApprovalMode: e.target.checked })
            }
            className="accent-blue-500"
          />
        </label>

        <label className="flex items-center justify-between gap-2 cursor-pointer">
          <span className="text-slate-300">Auto-Summarize Opened Web Tabs</span>
          <input
            type="checkbox"
            checked={settings.autoSummarizeTabs}
            onChange={(e) =>
              updateSettings({ autoSummarizeTabs: e.target.checked })
            }
            className="accent-blue-500"
          />
        </label>
      </div>

      {/* Keyboard Shortcuts */}
      <div className="rounded-xl border border-slate-800 bg-[#0b101b] p-3 space-y-2 text-xs">
        <div className="font-semibold text-slate-200">Keyboard Shortcuts</div>
        <div className="flex justify-between text-slate-400">
          <span>Command Palette</span>
          <span className="font-mono text-slate-200">Ctrl / Cmd + K</span>
        </div>
        <div className="flex justify-between text-slate-400">
          <span>Toggle Gemini Sidebar</span>
          <span className="font-mono text-slate-200">Ctrl / Cmd + J</span>
        </div>
      </div>

      {/* Security & Disclaimer */}
      <div className="rounded-xl border border-slate-800 bg-[#0b101b] p-3 space-y-2 text-[11px] text-slate-400 leading-relaxed">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
          <Shield className="h-3.5 w-3.5 text-cyan-400" />
          <span>Prototype Attribution & Notice</span>
        </div>
        <p>
          <strong className="text-slate-200">Google Agentic Browser</strong> — The Browser That Does. This is an independent concept prototype, not an official Google product.
        </p>
        <p>
          Web browsing tabs run via SSRF-safe server metadata extraction rather than a Chromium native engine. Money OS runs exclusively in Simulation Mode.
        </p>
        {firestoreStatus && (
          <p className="text-amber-300">Firestore check: {firestoreStatus}</p>
        )}
      </div>

      {/* Reset Workspace */}
      {!confirmReset ? (
        <button
          type="button"
          onClick={() => setConfirmReset(true)}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-500/30 bg-red-950/20 px-3 py-2 text-xs font-medium text-red-200 hover:bg-red-950/40"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset Local Workspace
        </button>
      ) : (
        <div className="rounded-xl border border-red-500/40 bg-red-950/30 p-3 space-y-2 text-xs">
          <p className="text-red-200">
            Confirm resetting local spaces, tabs, and simulation history?
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                resetLocalWorkspace();
                setConfirmReset(false);
              }}
              className="rounded-lg bg-red-600 px-3 py-1.5 font-medium text-white hover:bg-red-500"
            >
              Confirm Reset
            </button>
            <button
              type="button"
              onClick={() => setConfirmReset(false)}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-slate-300 hover:bg-slate-800"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
