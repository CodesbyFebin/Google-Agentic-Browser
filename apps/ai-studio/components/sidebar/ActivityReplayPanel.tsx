'use client';

import React, { useMemo, useState } from 'react';
import {
  ChevronLeft,
  ChevronRight,
  History,
  Play,
  RotateCcw,
} from 'lucide-react';
import { useBrowserState } from '../BrowserStateProvider';
import { buildReplayTimeline } from '@/lib/mission-logic';
import { AgentBadge } from '../AgentBadge';

export function ActivityReplayPanel() {
  const { missions, activityLogs } = useBrowserState();
  const [selectedMissionId, setSelectedMissionId] = useState<string>('all');
  const [cursor, setCursor] = useState<number>(0);

  const selectedMission =
    selectedMissionId === 'all'
      ? null
      : missions.find((m) => m.id === selectedMissionId) ?? null;

  const timeline = useMemo(
    () => buildReplayTimeline(selectedMission, activityLogs),
    [selectedMission, activityLogs]
  );

  const clampedCursor = Math.min(
    Math.max(0, cursor),
    Math.max(0, timeline.length - 1)
  );
  const inspectedEvent = timeline[clampedCursor] ?? null;

  return (
    <div className="h-full overflow-y-auto p-3 space-y-4">
      <div>
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-emerald-400" />
          <h3 className="font-display text-sm font-semibold text-slate-100">
            Activity & Mission Replay
          </h3>
        </div>
        <p className="text-[11px] text-slate-400 mt-0.5">
          Read-only historical inspection. Replay never re-executes external side effects.
        </p>
      </div>

      {/* Mission Filter for Replay */}
      <label className="block text-xs">
        <span className="text-[11px] text-slate-400">Replay Scope</span>
        <select
          value={selectedMissionId}
          onChange={(e) => {
            setSelectedMissionId(e.target.value);
            setCursor(0);
          }}
          className="mt-1 w-full rounded-lg border border-slate-800 bg-[#080c14] px-2.5 py-1.5 text-xs text-slate-100"
        >
          <option value="all">All Recorded Events ({activityLogs.length})</option>
          {missions.map((m) => (
            <option key={m.id} value={m.id}>
              Mission: {m.title} ({m.status})
            </option>
          ))}
        </select>
      </label>

      {/* Timeline Scrubber */}
      {timeline.length > 0 && (
        <div className="rounded-xl border border-slate-800 bg-[#0b101b] p-3 space-y-2.5">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-slate-200 flex items-center gap-1.5">
              <Play className="h-3.5 w-3.5 text-blue-400" />
              Timeline Scrubber
            </span>
            <span className="font-mono tabular-nums text-[11px] text-slate-400">
              Event {clampedCursor + 1} / {timeline.length}
            </span>
          </div>

          <input
            type="range"
            aria-label="Mission replay timeline scrubber"
            min={0}
            max={Math.max(0, timeline.length - 1)}
            value={clampedCursor}
            onChange={(e) => setCursor(Number(e.target.value))}
            className="w-full accent-blue-500 cursor-pointer"
          />

          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              disabled={clampedCursor === 0}
              onClick={() => setCursor((c) => Math.max(0, c - 1))}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] text-slate-200 hover:bg-slate-700 disabled:opacity-40"
            >
              <ChevronLeft className="h-3.5 w-3.5" />
              Prev
            </button>
            <button
              type="button"
              onClick={() => setCursor(0)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-800 px-2 py-1 text-[11px] text-slate-400 hover:text-slate-200"
            >
              <RotateCcw className="h-3 w-3" />
              Start
            </button>
            <button
              type="button"
              disabled={clampedCursor >= timeline.length - 1}
              onClick={() =>
                setCursor((c) => Math.min(timeline.length - 1, c + 1))
              }
              className="inline-flex items-center gap-1 rounded-lg border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] text-slate-200 hover:bg-slate-700 disabled:opacity-40"
            >
              Next
              <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {inspectedEvent && (
            <div className="mt-2 rounded-lg border border-slate-800 bg-[#080c14] p-2.5 text-xs space-y-1">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {inspectedEvent.agentId && (
                    <AgentBadge agentId={inspectedEvent.agentId} size="sm" />
                  )}
                  <span className="font-mono text-[11px] font-semibold text-blue-300">
                    {inspectedEvent.eventType}
                  </span>
                </div>
                <span className="font-mono tabular-nums text-[10px] text-slate-500">
                  {new Date(inspectedEvent.createdAtMs).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-slate-200">{inspectedEvent.summary}</p>
              {inspectedEvent.detail && (
                <p className="text-[11px] text-slate-400 whitespace-pre-wrap">
                  {inspectedEvent.detail}
                </p>
              )}
            </div>
          )}
        </div>
      )}

      {/* Chronological Audit Log */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-semibold text-slate-400">
          Audit Trail ({timeline.length})
        </div>
        {timeline.length === 0 ? (
          <p className="text-xs text-slate-500">No events recorded yet.</p>
        ) : (
          [...timeline].reverse().map((ev, idx) => (
            <button
              key={ev.id}
              type="button"
              onClick={() => setCursor(timeline.length - 1 - idx)}
              className={`block w-full rounded-lg border p-2 text-left text-xs transition-colors ${
                inspectedEvent?.id === ev.id
                  ? 'border-blue-500/50 bg-blue-950/20'
                  : 'border-slate-800 bg-[#0b101b] hover:bg-slate-800/50'
              }`}
            >
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <span className="font-mono">{ev.eventType}</span>
                <span className="font-mono tabular-nums">
                  {new Date(ev.createdAtMs).toLocaleTimeString()}
                </span>
              </div>
              <div className="mt-0.5 text-slate-200 line-clamp-2">
                {ev.summary}
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}
