'use client';

import React from 'react';
import { ShieldCheck, Sparkles, X } from 'lucide-react';
import { useBrowserState } from './BrowserStateProvider';

export function FeatureDiscoveryModal() {
  const { discoveryOpen, setDiscoveryOpen, setSidebarTab } = useBrowserState();
  if (!discoveryOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Google Agentic Browser Feature Guide"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/65 backdrop-blur-sm p-4"
    >
      <div className="w-full max-w-xl rounded-2xl border border-slate-700/80 bg-[#0e1422] p-5 shadow-2xl space-y-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/30 to-violet-500/30 text-blue-300 ring-1 ring-blue-400/30">
              <Sparkles className="h-5 w-5" />
            </span>
            <div>
              <h2 className="font-display text-base font-semibold text-slate-100">
                Google Agentic Browser — The Browser That Does
              </h2>
              <p className="text-xs text-slate-400">
                Independent concept prototype · Powered by Gemini & Human Approval
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close feature guide"
            onClick={() => setDiscoveryOpen(false)}
            className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="grid sm:grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl border border-slate-800 bg-[#0b101b] p-3">
            <div className="font-semibold text-slate-100">1. Spaces & Split Panes</div>
            <p className="mt-1 text-slate-400">
              Organize Work, Money, Personal, Research, and Focus Spaces with 1–4 draggable split panes.
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-[#0b101b] p-3">
            <div className="font-semibold text-slate-100">2. Six Specialized Agents</div>
            <p className="mt-1 text-slate-400">
              ORION plans missions across ROVER, ATLAS, AEGIS, MERCURY, and CHRONICLE using real Gemini calls.
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-[#0b101b] p-3">
            <div className="font-semibold text-slate-100">3. Mandatory Human Approval</div>
            <p className="mt-1 text-slate-400">
              Spending, emails, Drive writes, and Calendar events pause for server-verified human sign-off.
            </p>
          </div>
          <div className="rounded-xl border border-slate-800 bg-[#0b101b] p-3">
            <div className="font-semibold text-slate-100">4. Agent Studio & Replay</div>
            <p className="mt-1 text-slate-400">
              Build custom agents from 7 templates, inspect Money OS simulations, and scrub Mission Replay timelines.
            </p>
          </div>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <span className="inline-flex items-center gap-1.5 text-[11px] text-emerald-300">
            <ShieldCheck className="h-3.5 w-3.5" />
            Not an official Google product.
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setDiscoveryOpen(false);
                setSidebarTab('agents');
              }}
              className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500"
            >
              Try a Mission
            </button>
            <button
              type="button"
              onClick={() => setDiscoveryOpen(false)}
              className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-300 hover:bg-slate-800"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
