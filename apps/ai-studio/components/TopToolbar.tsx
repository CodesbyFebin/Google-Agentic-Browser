'use client';

import React, { useState } from 'react';
import {
  Columns2,
  Compass,
  Eye,
  LayoutGrid,
  Maximize2,
  PanelLeft,
  PanelRight,
  Plus,
  Search,
  Settings,
  Sparkles,
  Square,
  UserCheck,
  X,
} from 'lucide-react';
import { useBrowserState } from './BrowserStateProvider';
import type { SplitLayout } from '@/lib/types';

export function TopToolbar() {
  const {
    activeSpace,
    spaceTabs,
    activeTab,
    focusMode,
    zenMode,
    sidebarOpen,
    user,
    openTab,
    closeTab,
    focusTabInPane,
    navigateAddressBar,
    setSplitLayout,
    toggleFocusMode,
    toggleZenMode,
    setSidebarOpen,
    setSidebarTab,
    setCommandPaletteOpen,
    setDiscoveryOpen,
    handleSignIn,
  } = useBrowserState();

  const activeUrlKey = `${activeTab?.id ?? 'none'}:${activeTab?.url ?? ''}`;
  const [draftAddress, setDraftAddress] = useState<{
    key: string;
    value: string;
  } | null>(null);
  const addressInput =
    draftAddress?.key === activeUrlKey
      ? draftAddress.value
      : activeTab?.url || 'gab://mission';

  const handleSubmitAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    await navigateAddressBar(addressInput);
  };

  if (zenMode) {
    return (
      <header className="flex items-center justify-between border-b border-slate-700/40 bg-[#0B1220]/90 backdrop-blur-md px-4 py-2">
        <span className="font-display text-sm font-semibold text-slate-100 whitespace-nowrap">
          Google Agentic Browser · Zen Mode
        </span>
        <button
          type="button"
          onClick={toggleZenMode}
          className="rounded-xl border border-slate-700/60 bg-slate-800/80 px-3 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 whitespace-nowrap"
        >
          Exit Zen Mode
        </button>
      </header>
    );
  }

  const splitIcons: Record<SplitLayout, React.ComponentType<{ className?: string }>> = {
    1: Square,
    2: Columns2,
    3: PanelLeft,
    4: LayoutGrid,
  };

  return (
    <header className="gab-topbar border-b border-slate-700/40 bg-[#070913]/90 backdrop-blur-xl">
      {/* Row 1: Browser Brand + Utility Controls */}
      <div className="flex items-center justify-between gap-3 border-b border-slate-700/35 px-3.5 py-2">
        <div className="flex items-center gap-2.5 min-w-0">
          <span
            aria-hidden="true"
            className="gab-brand-mark inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-white"
          >
            <Compass className="h-4 w-4" />
          </span>
          <div className="flex flex-col leading-tight min-w-0">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="font-display text-sm font-semibold tracking-tight text-slate-100 whitespace-nowrap">
                Agentic Browser
              </span>
              <span className="hidden md:inline text-xs text-slate-400 whitespace-nowrap">
                — the browser that does, with your approval
              </span>
            </div>
            <span className="hidden sm:inline text-[10px] text-slate-400/90 whitespace-nowrap">
              Independent concept · Gemini-powered · Human-approved
            </span>
          </div>
        </div>

        <div className="hidden xl:flex items-center gap-2 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-3 py-1 text-[11px] font-medium text-emerald-200" role="status">
          <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" aria-hidden="true" />
          Approval-first workspace
        </div>

        <div className="flex items-center gap-1.5 shrink-0 overflow-x-auto">
          <button
            type="button"
            onClick={() => {
              const next = ((activeSpace.splitLayout % 4) + 1) as SplitLayout;
              setSplitLayout(next);
            }}
            aria-label={`Cycle split layout, currently ${activeSpace.splitLayout} panes`}
            className="hidden sm:inline-flex items-center gap-1.5 rounded-xl border border-slate-700/50 bg-[#0f172a]/80 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:border-teal-500/40 hover:bg-slate-800/80 whitespace-nowrap transition-colors"
          >
            <LayoutGrid className="h-3.5 w-3.5 text-teal-400" />
            <span>Split ({activeSpace.splitLayout})</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (sidebarOpen) {
                setSidebarOpen(false);
              } else {
                setSidebarTab('gemini');
              }
            }}
            aria-pressed={sidebarOpen}
            aria-label="Toggle Gemini sidebar"
            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-semibold whitespace-nowrap transition-all ${
              sidebarOpen
                ? 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 text-white shadow-md shadow-blue-600/30 ring-1 ring-blue-400/40'
                : 'border border-slate-700/50 bg-[#0f172a]/80 text-slate-200 hover:bg-slate-800/80'
            }`}
          >
            <Sparkles className="h-3.5 w-3.5" />
            <span>Gemini</span>
          </button>

          <button
            type="button"
            onClick={toggleFocusMode}
            aria-pressed={focusMode}
            className={`hidden md:inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
              focusMode
                ? 'border-purple-500/60 bg-purple-950/50 text-purple-200'
                : 'border-slate-700/50 bg-[#0f172a]/80 text-slate-300 hover:bg-slate-800/80 hover:text-white'
            }`}
          >
            <Eye className="h-3.5 w-3.5 text-purple-400" />
            <span>Focus</span>
          </button>

          <button
            type="button"
            onClick={toggleZenMode}
            className="hidden md:inline-flex items-center gap-1.5 rounded-xl border border-slate-700/50 bg-[#0f172a]/80 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800/80 hover:text-white whitespace-nowrap transition-colors"
          >
            <Maximize2 className="h-3.5 w-3.5 text-teal-400" />
            <span>Zen</span>
          </button>

          <button
            type="button"
            onClick={() => setSidebarTab('settings')}
            aria-label="Open settings"
            className="inline-flex items-center gap-1.5 rounded-xl border border-slate-700/50 bg-[#0f172a]/80 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800/80 hover:text-white whitespace-nowrap transition-colors"
          >
            <Settings className="h-3.5 w-3.5 text-slate-400" />
            <span className="hidden lg:inline">Settings</span>
          </button>

          <button
            type="button"
            onClick={() => setDiscoveryOpen(true)}
            aria-label="Feature discovery guide"
            className="hidden sm:inline-flex items-center gap-1 rounded-xl border border-white/15 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white hover:bg-white/15 whitespace-nowrap transition-colors"
          >
            <span>Features</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (user) {
                setSidebarTab('connect');
              } else {
                handleSignIn().catch(() => setSidebarTab('connect'));
              }
            }}
            className={`inline-flex items-center gap-1.5 rounded-xl border px-2.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors ${
              user
                ? 'border-teal-500/40 bg-teal-950/40 text-teal-200 hover:bg-teal-900/50'
                : 'border-blue-500/40 bg-blue-600/20 text-blue-100 hover:bg-blue-600/35'
            }`}
          >
            <UserCheck className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">
              {user ? user.displayName?.split(' ')[0] || 'Account' : 'Sign in'}
            </span>
          </button>
        </div>
      </div>

      {/* Row 2: Command Search + Space Tabs + Omnibox + Pane Switcher */}
      <div className="flex flex-wrap items-center gap-2 px-3 py-1.5">
        <button
          type="button"
          onClick={() => setCommandPaletteOpen(true)}
          aria-label="Search tabs, actions, or agents"
          className="hidden lg:flex w-[240px] shrink-0 items-center justify-between gap-2 rounded-full border border-white/15 bg-white/5 px-3 py-1.5 text-xs text-slate-400 hover:border-blue-500/40 hover:text-slate-200 transition-colors"
        >
          <span className="flex items-center gap-2 truncate">
            <Search className="h-3.5 w-3.5 text-slate-400 shrink-0" />
            <span className="truncate">Search tabs, actions, agents...</span>
          </span>
          <kbd className="rounded-md border border-slate-700/70 bg-[#0B1220] px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
            ⌘K
          </kbd>
        </button>

        {/* Browser Space Tabs */}
        <nav
          aria-label="Space tabs"
          className="flex flex-1 items-center gap-1.5 overflow-x-auto min-w-[200px]"
        >
          {spaceTabs.map((tab) => {
            const isSelected = activeTab?.id === tab.id;
            return (
              <div
                key={tab.id}
                className={`group flex items-center gap-1 rounded-xl border px-2.5 py-1 text-xs transition-all shrink-0 ${
                  isSelected
                    ? 'border-blue-400/50 bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'border-slate-700/45 bg-[#0f172a]/75 text-slate-300 hover:border-slate-600 hover:bg-slate-800/80 hover:text-white'
                }`}
              >
                <button
                  type="button"
                  onClick={() => focusTabInPane(tab.id)}
                  className="max-w-[125px] truncate text-left font-medium whitespace-nowrap"
                >
                  {tab.title}
                </button>
                {spaceTabs.length > 1 && (
                  <button
                    type="button"
                    aria-label={`Close tab ${tab.title}`}
                    onClick={() => closeTab(tab.id)}
                    className={`rounded-md p-0.5 transition-colors ${
                      isSelected
                        ? 'text-blue-100 hover:bg-blue-500 hover:text-white'
                        : 'text-slate-500 hover:bg-slate-700 hover:text-slate-200'
                    }`}
                  >
                    <X className="h-3 w-3" />
                  </button>
                )}
              </div>
            );
          })}

          <button
            type="button"
            aria-label="New tab"
            onClick={() =>
              openTab({
                title: 'New Scratchpad',
                url: 'gab://notes',
                kind: 'note',
              })
            }
            className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-xl border border-slate-700/50 bg-[#0f172a]/80 text-slate-300 hover:border-teal-500/40 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <Plus className="h-3.5 w-3.5" />
          </button>
        </nav>

        {/* Compact Omnibox + Split Switcher */}
        <div className="flex items-center gap-1.5 shrink-0 max-md:w-full">
          <form
            onSubmit={handleSubmitAddress}
            className="flex flex-1 md:w-[195px] items-center gap-1.5 rounded-xl border border-slate-700/50 bg-[#0f172a]/85 px-2 py-1 focus-within:border-teal-400/60"
          >
            <Compass className="h-3.5 w-3.5 shrink-0 text-teal-400" />
            <label htmlFor="browser-omnibox" className="sr-only">
              Address or command bar
            </label>
            <input
              id="browser-omnibox"
              type="text"
              value={addressInput}
              onChange={(e) =>
                setDraftAddress({ key: activeUrlKey, value: e.target.value })
              }
              placeholder="https:// or gab://mission"
              className="w-full bg-transparent text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none font-mono"
            />
            <button
              type="submit"
              className="inline-flex items-center gap-1 rounded-lg bg-blue-600 px-2 py-0.5 text-[11px] font-medium text-white hover:bg-blue-500 whitespace-nowrap"
            >
              Go
            </button>
          </form>

          <div
            role="group"
            aria-label="Workspace split layout"
            className="flex items-center gap-0.5 rounded-xl border border-slate-700/50 bg-[#0f172a]/80 p-0.5"
          >
            {([1, 2, 3, 4] as SplitLayout[]).map((layout) => {
              const Icon = splitIcons[layout];
              const active = activeSpace.splitLayout === layout;
              return (
                <button
                  key={layout}
                  type="button"
                  aria-label={`${layout} pane layout`}
                  aria-pressed={active}
                  onClick={() => setSplitLayout(layout)}
                  className={`inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[11px] font-medium transition-colors whitespace-nowrap ${
                    active
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                  }`}
                >
                  <Icon className="h-3 w-3" />
                  <span>{layout}</span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </header>
  );
}
