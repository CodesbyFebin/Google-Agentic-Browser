'use client';

import React from 'react';
import {
  Bot,
  Coins,
  History,
  Link2,
  Settings,
  Sparkles,
  Wrench,
  X,
} from 'lucide-react';
import { useBrowserState } from './BrowserStateProvider';
import { GeminiPanel } from './sidebar/GeminiPanel';
import { AgentStudioPanel } from './sidebar/AgentStudioPanel';
import { AgentsMissionPanel } from './sidebar/AgentsMissionPanel';
import { MoneyPanel } from './sidebar/MoneyPanel';
import { ActivityReplayPanel } from './sidebar/ActivityReplayPanel';
import { ConnectPanel } from './sidebar/ConnectPanel';
import { SettingsPanel } from './sidebar/SettingsPanel';
import type { SidebarTabId } from '@/lib/types';

const SIDEBAR_TABS: {
  id: SidebarTabId;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { id: 'gemini', label: 'Gemini', icon: Sparkles },
  { id: 'money', label: 'Money', icon: Coins },
  { id: 'agents', label: 'Agents', icon: Bot },
  { id: 'activity', label: 'Activity', icon: History },
  { id: 'connect', label: 'Connect', icon: Link2 },
  { id: 'studio', label: 'Studio', icon: Wrench },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export function RightSidebar() {
  const { sidebarOpen, sidebarTab, setSidebarTab, setSidebarOpen, approvals } =
    useBrowserState();

  if (!sidebarOpen) return null;

  const pendingCount = approvals.filter((a) => a.status === 'PENDING').length;

  return (
    <aside
      aria-label="AI and Agent sidebar"
      className="max-md:fixed max-md:inset-0 max-md:z-40 w-full md:w-[400px] shrink-0 flex flex-col border-l border-slate-700/40 bg-[#0B1220]/95 backdrop-blur-xl"
    >
      {/* Pill Tab Navigation Strip */}
      <div className="flex items-start justify-between border-b border-slate-700/40 px-3 py-2.5 gap-1.5">
        <div
          role="tablist"
          aria-label="AI sidebar sections"
          className="flex flex-wrap items-center gap-1.5"
        >
          {SIDEBAR_TABS.map((tab) => {
            const Icon = tab.icon;
            const active = sidebarTab === tab.id;
            const showPending = tab.id === 'agents' && pendingCount > 0;
            return (
              <button
                key={tab.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSidebarTab(tab.id)}
                className={`relative flex items-center gap-1 rounded-full px-3 py-1 text-[11px] font-medium transition-all whitespace-nowrap shrink-0 ${
                  active
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'border border-slate-700/45 bg-[#0f172a]/80 text-slate-300 hover:border-slate-600 hover:text-white'
                }`}
              >
                <Icon className="h-3 w-3" />
                <span>{tab.label}</span>
                {showPending && (
                  <span className="ml-0.5 font-mono text-[10px] text-amber-300">
                    ({pendingCount})
                  </span>
                )}
              </button>
            );
          })}
        </div>

        <button
          type="button"
          aria-label="Close AI sidebar"
          onClick={() => setSidebarOpen(false)}
          className="rounded-xl p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100 shrink-0"
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Active Panel */}
      <div className="flex-1 min-h-0 overflow-hidden">
        {sidebarTab === 'gemini' && <GeminiPanel />}
        {sidebarTab === 'studio' && <AgentStudioPanel />}
        {sidebarTab === 'agents' && <AgentsMissionPanel />}
        {sidebarTab === 'money' && <MoneyPanel />}
        {sidebarTab === 'activity' && <ActivityReplayPanel />}
        {sidebarTab === 'connect' && <ConnectPanel />}
        {sidebarTab === 'settings' && <SettingsPanel />}
      </div>
    </aside>
  );
}
