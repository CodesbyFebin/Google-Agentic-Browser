'use client';

import React, { useEffect, useState } from 'react';
import { Command, Rocket, Search, X } from 'lucide-react';
import { useBrowserState } from './BrowserStateProvider';

export function CommandPalette() {
  const {
    commandPaletteOpen,
    setCommandPaletteOpen,
    switchSpace,
    setSplitLayout,
    setSidebarTab,
    navigateAddressBar,
    startMission,
  } = useBrowserState();

  const [query, setQuery] = useState('');

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [commandPaletteOpen, setCommandPaletteOpen]);

  if (!commandPaletteOpen) return null;

  const actions = [
    {
      id: 'go-mission',
      label: 'Launch Multi-Agent Mission from Query',
      run: async () => {
        const objective =
          query.trim() ||
          'Research three project management tools, compare pricing and features, recommend the best option, and save a report.';
        setCommandPaletteOpen(false);
        await startMission(objective);
      },
    },
    {
      id: 'space-work',
      label: 'Switch Space → Work',
      run: () => {
        switchSpace('work');
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'space-money',
      label: 'Switch Space → Money',
      run: () => {
        switchSpace('money');
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'space-research',
      label: 'Switch Space → Research',
      run: () => {
        switchSpace('research');
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'layout-4',
      label: 'Layout → 4-Pane Grid',
      run: () => {
        setSplitLayout(4);
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'layout-1',
      label: 'Layout → Single Pane',
      run: () => {
        setSplitLayout(1);
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'tab-studio',
      label: 'Open Agent Studio',
      run: () => {
        setSidebarTab('studio');
        setCommandPaletteOpen(false);
      },
    },
    {
      id: 'tab-connect',
      label: 'Open Google Workspace Connect',
      run: () => {
        setSidebarTab('connect');
        setCommandPaletteOpen(false);
      },
    },
  ];

  const filtered = query.trim()
    ? actions.filter((a) =>
        a.label.toLowerCase().includes(query.trim().toLowerCase())
      )
    : actions;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Command Palette"
      className="fixed inset-0 z-50 flex items-start justify-center bg-black/60 backdrop-blur-sm pt-24 px-4"
    >
      <div className="w-full max-w-lg rounded-2xl border border-slate-700/80 bg-[#0e1422] shadow-2xl overflow-hidden">
        <div className="flex items-center gap-2 border-b border-slate-800 px-3.5 py-2.5">
          <Command className="h-4 w-4 text-blue-400 shrink-0" />
          <input
            type="text"
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={async (e) => {
              if (e.key === 'Escape') {
                setCommandPaletteOpen(false);
              } else if (e.key === 'Enter' && query.trim().startsWith('http')) {
                await navigateAddressBar(query.trim());
                setCommandPaletteOpen(false);
              }
            }}
            placeholder="Type a command, URL (https://...), or mission objective..."
            className="w-full bg-transparent text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none"
          />
          <button
            type="button"
            aria-label="Close command palette"
            onClick={() => setCommandPaletteOpen(false)}
            className="rounded p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="max-h-72 overflow-y-auto p-2 space-y-1">
          {query.trim() && (
            <button
              type="button"
              onClick={async () => {
                const text = query.trim();
                setCommandPaletteOpen(false);
                if (text.startsWith('http') || text.startsWith('gab://')) {
                  await navigateAddressBar(text);
                } else {
                  await startMission(text);
                }
              }}
              className="flex w-full items-center gap-2 rounded-lg bg-blue-600/20 px-3 py-2 text-left text-xs font-medium text-blue-200 hover:bg-blue-600/30"
            >
              <Rocket className="h-3.5 w-3.5 shrink-0" />
              <span>
                {query.trim().startsWith('http')
                  ? `Open URL: ${query.trim()}`
                  : `Start Mission: "${query.trim()}"`}
              </span>
            </button>
          )}
          {filtered.map((action) => (
            <button
              key={action.id}
              type="button"
              onClick={action.run}
              className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-xs text-slate-300 hover:bg-slate-800 hover:text-white"
            >
              <Search className="h-3.5 w-3.5 text-slate-500 shrink-0" />
              <span>{action.label}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
