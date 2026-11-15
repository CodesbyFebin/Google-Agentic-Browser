'use client';

import React, { useMemo, useState } from 'react';
import {
  ArrowRight,
  Bot,
  Briefcase,
  Coins,
  Compass,
  FileCheck2,
  FileText,
  FolderKanban,
  Globe,
  Pin,
  Plus,
  Rocket,
  Search,
  Sparkles,
  Target,
  User,
} from 'lucide-react';
import { useBrowserState } from './BrowserStateProvider';
import type { SpaceSlug } from '@/lib/types';

const SPACE_META: {
  slug: SpaceSlug;
  label: string;
  badgeColor: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { slug: 'work', label: 'Work', badgeColor: 'bg-blue-600 text-white', icon: Briefcase },
  { slug: 'money', label: 'Money', badgeColor: 'bg-teal-600 text-white', icon: Coins },
  { slug: 'personal', label: 'Personal', badgeColor: 'bg-rose-600 text-white', icon: User },
  { slug: 'research', label: 'Research', badgeColor: 'bg-purple-600 text-white', icon: Compass },
  { slug: 'focus', label: 'Focus', badgeColor: 'bg-amber-500 text-slate-950', icon: Target },
];

type PinnedTile = {
  id: string;
  label: string;
  title: string;
  url: string;
  kind: 'app' | 'workspace' | 'report' | 'note' | 'web';
  iconBg: string;
  icon: React.ComponentType<{ className?: string }>;
  sidebarTarget?: 'agents' | 'gemini';
};

const PINNED_TILES: PinnedTile[] = [
  {
    id: 'pin-mission',
    label: 'Mission',
    title: 'Mission Control · Orion',
    url: 'gab://mission',
    kind: 'app',
    iconBg: 'bg-blue-500/20 text-blue-300 ring-1 ring-blue-400/30',
    icon: Rocket,
  },
  {
    id: 'pin-workspace',
    label: 'Hub',
    title: 'Workspace Hub',
    url: 'gab://workspace',
    kind: 'workspace',
    iconBg: 'bg-teal-500/20 text-teal-300 ring-1 ring-teal-400/30',
    icon: FolderKanban,
  },
  {
    id: 'pin-money',
    label: 'Money',
    title: 'Money OS · Simulation',
    url: 'gab://money',
    kind: 'app',
    iconBg: 'bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/30',
    icon: Coins,
  },
  {
    id: 'pin-reports',
    label: 'Reports',
    title: 'Chronicle Reports',
    url: 'gab://report',
    kind: 'report',
    iconBg: 'bg-purple-500/20 text-purple-300 ring-1 ring-purple-400/30',
    icon: FileCheck2,
  },
  {
    id: 'pin-notes',
    label: 'Notes',
    title: 'Space Notes',
    url: 'gab://notes',
    kind: 'note',
    iconBg: 'bg-rose-500/20 text-rose-300 ring-1 ring-rose-400/30',
    icon: FileText,
  },
  {
    id: 'pin-docs',
    label: 'Docs',
    title: 'Gemini API Documentation',
    url: 'https://ai.google.dev/gemini-api/docs',
    kind: 'web',
    iconBg: 'bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-400/30',
    icon: Globe,
  },
  {
    id: 'pin-agents',
    label: 'Agents',
    title: 'Agent Crew',
    url: 'gab://mission',
    kind: 'app',
    iconBg: 'bg-indigo-500/20 text-indigo-300 ring-1 ring-indigo-400/30',
    icon: Bot,
    sidebarTarget: 'agents',
  },
  {
    id: 'pin-gemini',
    label: 'Gemini',
    title: 'Gemini Sidebar',
    url: 'gab://mission',
    kind: 'app',
    iconBg: 'bg-gradient-to-br from-teal-500/30 via-blue-500/30 to-purple-500/30 text-sky-200 ring-1 ring-blue-400/35',
    icon: Sparkles,
    sidebarTarget: 'gemini',
  },
];

export function SpacesSidebar() {
  const {
    activeSpaceSlug,
    spaces,
    tabs,
    spaceTabs,
    activeTab,
    activityLogs,
    focusMode,
    zenMode,
    switchSpace,
    openTab,
    focusTabInPane,
    togglePinTab,
    setSidebarTab,
  } = useBrowserState();

  const [tabQuery, setTabQuery] = useState('');

  const filteredTabs = useMemo(() => {
    const q = tabQuery.trim().toLowerCase();
    if (!q) return spaceTabs;
    return spaceTabs.filter(
      (t) =>
        t.title.toLowerCase().includes(q) || t.url.toLowerCase().includes(q)
    );
  }, [spaceTabs, tabQuery]);

  if (focusMode || zenMode) return null;

  return (
    <aside
      aria-label="Spaces and navigation"
      className="hidden lg:flex w-[252px] shrink-0 flex-col border-r border-slate-700/40 bg-[#0B1220]/90 backdrop-blur-md select-none"
    >
      {/* Spaces Switcher Grid */}
      <div className="p-3 border-b border-slate-700/35">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Spaces
          </span>
          <button
            type="button"
            onClick={() =>
              openTab({
                title: 'New Scratchpad',
                url: 'gab://notes',
                kind: 'note',
              })
            }
            className="rounded-lg border border-slate-700/50 bg-[#0f172a]/80 px-2 py-0.5 text-[10px] font-medium text-slate-300 hover:border-teal-500/40 hover:text-white transition-colors"
          >
            + New
          </button>
        </div>

        <div className="grid grid-cols-4 gap-1">
          {SPACE_META.map((item) => {
            const Icon = item.icon;
            const spaceObj = spaces[item.slug];
            const count = tabs.filter((t) => t.spaceId === spaceObj.id).length;
            const isActive = activeSpaceSlug === item.slug;
            return (
              <button
                key={item.slug}
                type="button"
                onClick={() => switchSpace(item.slug)}
                aria-current={isActive ? 'page' : undefined}
                aria-label={`${item.label} ${count}`}
                className={`flex flex-col items-center justify-center gap-1 rounded-xl border px-0.5 py-1.5 text-[9.5px] font-medium transition-all ${
                  isActive
                    ? 'border-blue-400/60 bg-blue-600/25 text-white shadow-sm shadow-blue-600/20'
                    : 'border-slate-700/40 bg-[#0f172a]/70 text-slate-400 hover:border-slate-600 hover:bg-slate-800/70 hover:text-slate-200'
                }`}
              >
                <span
                  className={`inline-flex h-6 w-6 items-center justify-center rounded-lg ${item.badgeColor}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="leading-none">{item.label}</span>
              </button>
            );
          })}
        </div>

        <div className="mt-2 truncate text-[10px] text-slate-400">
          {spaces[activeSpaceSlug].name} Space · {spaceTabs.length} tabs
        </div>
      </div>

      {/* Pinned 4-column Icon Tile Grid */}
      <div className="p-3 border-b border-slate-700/35">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Pinned
          </span>
          <span className="text-[10px] text-slate-500">
            {PINNED_TILES.length} apps
          </span>
        </div>
        <div className="grid grid-cols-4 gap-1.5">
          {PINNED_TILES.map((app) => {
            const Icon = app.icon;
            return (
              <button
                key={app.id}
                type="button"
                onClick={() => {
                  if (app.sidebarTarget) {
                    setSidebarTab(app.sidebarTarget);
                  } else {
                    openTab({
                      title: app.title,
                      url: app.url,
                      kind: app.kind,
                      pinned: true,
                    });
                  }
                }}
                className="group flex flex-col items-center justify-center gap-1 rounded-xl border border-slate-700/35 bg-[#0f172a]/65 px-1 py-1.5 text-[10px] font-medium text-slate-300 hover:border-blue-500/40 hover:bg-slate-800/80 hover:text-white transition-colors"
              >
                <span
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-lg ${app.iconBg}`}
                >
                  <Icon className="h-3.5 w-3.5" />
                </span>
                <span className="truncate max-w-full">{app.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab Management & Search */}
      <div className="flex-1 flex flex-col min-h-0 p-3">
        <div className="flex items-center justify-between mb-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
            Tabs — {spaces[activeSpaceSlug].name}
          </span>
          <button
            type="button"
            aria-label="Add tab in space"
            onClick={() =>
              openTab({
                title: 'New Note',
                url: 'gab://notes',
                kind: 'note',
              })
            }
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </div>

        <div className="relative mb-2">
          <Search className="pointer-events-none absolute left-2.5 top-2 h-3.5 w-3.5 text-slate-500" />
          <label htmlFor="sidebar-tab-search" className="sr-only">
            Filter space tabs
          </label>
          <input
            id="sidebar-tab-search"
            type="text"
            value={tabQuery}
            onChange={(e) => setTabQuery(e.target.value)}
            placeholder="Filter tabs..."
            className="w-full rounded-xl border border-slate-700/50 bg-[#0f172a]/80 py-1.5 pl-8 pr-2 text-xs text-slate-200 placeholder:text-slate-500 focus:border-blue-500/60 focus:outline-none"
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-1 pr-0.5">
          {filteredTabs.map((tab) => {
            const isActive = activeTab?.id === tab.id;
            return (
              <div
                key={tab.id}
                className={`flex items-center justify-between gap-1 rounded-xl px-2.5 py-1.5 text-xs transition-colors ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'text-slate-300 hover:bg-slate-800/60 hover:text-white'
                }`}
              >
                <button
                  type="button"
                  onClick={() => focusTabInPane(tab.id)}
                  className="flex flex-1 items-center gap-2 min-w-0 text-left"
                >
                  {tab.kind === 'web' ? (
                    <Globe
                      className={`h-3.5 w-3.5 shrink-0 ${
                        isActive ? 'text-white' : 'text-teal-400'
                      }`}
                    />
                  ) : (
                    <FileText
                      className={`h-3.5 w-3.5 shrink-0 ${
                        isActive ? 'text-white' : 'text-slate-400'
                      }`}
                    />
                  )}
                  <span className="truncate font-medium">{tab.title}</span>
                </button>
                <button
                  type="button"
                  aria-label={tab.pinned ? `Unpin ${tab.title}` : `Pin ${tab.title}`}
                  onClick={() => togglePinTab(tab.id)}
                  className={`rounded-md p-1 ${
                    tab.pinned
                      ? isActive
                        ? 'text-amber-200 hover:bg-blue-500'
                        : 'text-amber-300 hover:bg-slate-700/60'
                      : isActive
                      ? 'text-blue-100 hover:bg-blue-500'
                      : 'text-slate-600 hover:text-slate-300'
                  }`}
                >
                  <Pin className="h-3 w-3" />
                </button>
              </div>
            );
          })}
        </div>

        {/* Recent Activity Mini-Feed */}
        <div className="mt-2 pt-2 border-t border-slate-700/35">
          <div className="flex items-center justify-between mb-1">
            <span className="text-[11px] font-semibold text-slate-400">
              Recent Activity
            </span>
            <button
              type="button"
              onClick={() => setSidebarTab('activity')}
              className="text-[11px] font-medium text-teal-400 hover:text-teal-300"
            >
              Replay
            </button>
          </div>
          <div className="space-y-0.5 max-h-11 overflow-hidden">
            {activityLogs.slice(0, 2).map((ev) => (
              <div
                key={ev.id}
                className="text-[11px] text-slate-400 truncate"
                title={ev.summary}
              >
                {ev.summary}
              </div>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => setSidebarTab('gemini')}
          className="mt-2.5 flex w-full items-center justify-between rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-3 py-2.5 text-left text-white shadow-md shadow-blue-950/50 hover:brightness-110 transition-all"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Sparkles className="h-4 w-4 shrink-0 text-teal-200" />
            <div className="min-w-0">
              <div className="text-xs font-semibold leading-tight truncate">
                Gemini Mini
              </div>
              <div className="text-[10px] text-white/80 truncate">
                Your quick companion
              </div>
            </div>
          </div>
          <ArrowRight className="h-3.5 w-3.5 shrink-0" />
        </button>

        <button
          type="button"
          onClick={() => setSidebarTab('agents')}
          className="mt-1.5 flex w-full items-center justify-center gap-1.5 rounded-xl border border-slate-700/50 bg-[#0f172a]/80 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:border-purple-500/40 hover:bg-slate-800 whitespace-nowrap transition-colors"
        >
          <Rocket className="h-3.5 w-3.5 text-purple-400" />
          <span>Launch Mission</span>
        </button>
      </div>
    </aside>
  );
}
