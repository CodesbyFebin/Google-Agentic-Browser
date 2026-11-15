'use client';

import React, { useState } from 'react';
import { ChevronDown, ChevronRight, Pause, Play, Rocket, XCircle } from 'lucide-react';
import { useBrowserState } from '../BrowserStateProvider';
import { AgentBadge } from '../AgentBadge';
import { ApprovalCard } from '../ApprovalCard';
import { CORE_AGENT_LIST } from '@/lib/agents/registry';

export function AgentsMissionPanel() {
  const {
    missions,
    activeMissionId,
    approvals,
    startMission,
    pauseMission,
    resumeMission,
    cancelMission,
  } = useBrowserState();

  const [objective, setObjective] = useState('');
  const [expandedAgent, setExpandedAgent] = useState<string | null>('orion');

  const activeMission =
    missions.find((m) => m.id === activeMissionId) ?? missions[0] ?? null;
  const pendingApprovals = approvals.filter((a) => a.status === 'PENDING');

  const handleLaunch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!objective.trim()) return;
    const text = objective.trim();
    setObjective('');
    await startMission(text);
  };

  return (
    <div className="h-full overflow-y-auto p-3 space-y-4">
      <div>
        <h3 className="font-display text-sm font-semibold text-slate-100">
          Six Specialized Agents
        </h3>
        <p className="text-[11px] text-slate-400">
          ORION orchestrates ROVER, ATLAS, AEGIS, MERCURY, and CHRONICLE.
        </p>
      </div>

      {/* Pending Human Approvals */}
      {pendingApprovals.length > 0 && (
        <div className="space-y-2">
          <div className="text-[11px] font-semibold text-amber-300">
            Pending Human Approvals ({pendingApprovals.length})
          </div>
          {pendingApprovals.map((apr) => (
            <ApprovalCard key={apr.id} approval={apr} />
          ))}
        </div>
      )}

      {/* Quick Mission Launcher */}
      <form
        onSubmit={handleLaunch}
        className="rounded-xl border border-slate-800 bg-[#0b101b] p-3 space-y-2"
      >
        <label
          htmlFor="sidebar-mission-input"
          className="block text-xs font-medium text-slate-200"
        >
          Start Multi-Agent Mission
        </label>
        <textarea
          id="sidebar-mission-input"
          rows={2}
          value={objective}
          onChange={(e) => setObjective(e.target.value)}
          placeholder="e.g. Research three project management tools, compare pricing, and save a report..."
          className="w-full rounded-lg border border-slate-800 bg-[#080c14] px-2.5 py-1.5 text-xs text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
        />
        <button
          type="submit"
          disabled={!objective.trim()}
          className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-1.5 text-xs font-semibold text-white hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50"
        >
          <Rocket className="h-3.5 w-3.5" />
          Run Mission
        </button>
      </form>

      {/* Active Mission Summary */}
      {activeMission && (
        <div className="rounded-xl border border-slate-800 bg-[#0b101b] p-3 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <AgentBadge agentId={activeMission.activeAgentId} size="sm" />
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-100 truncate">
                  {activeMission.title}
                </div>
                <div className="text-[11px] font-mono text-slate-400">
                  {activeMission.status} · {activeMission.steps.filter((s) => s.status === 'COMPLETED').length}/{activeMission.steps.length} steps
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {activeMission.status === 'RUNNING' && (
                <button
                  type="button"
                  aria-label="Pause mission"
                  onClick={() => pauseMission(activeMission.id)}
                  className="rounded border border-slate-700 p-1 text-slate-300 hover:bg-slate-800"
                >
                  <Pause className="h-3.5 w-3.5" />
                </button>
              )}
              {activeMission.status === 'PAUSED' && (
                <button
                  type="button"
                  aria-label="Resume mission"
                  onClick={() => resumeMission(activeMission.id)}
                  className="rounded bg-blue-600 p-1 text-white hover:bg-blue-500"
                >
                  <Play className="h-3.5 w-3.5" />
                </button>
              )}
              {activeMission.status !== 'COMPLETED' &&
                activeMission.status !== 'CANCELLED' && (
                  <button
                    type="button"
                    aria-label="Cancel mission"
                    onClick={() => cancelMission(activeMission.id)}
                    className="rounded border border-red-500/30 p-1 text-red-300 hover:bg-red-950/40"
                  >
                    <XCircle className="h-3.5 w-3.5" />
                  </button>
                )}
            </div>
          </div>

          <div className="space-y-1">
            {activeMission.steps.map((step) => (
              <div
                key={step.id}
                className="flex items-center justify-between gap-2 rounded-lg bg-[#080c14] px-2.5 py-1.5 text-[11px]"
              >
                <span className="truncate text-slate-200">
                  {step.agentId.toUpperCase()} · {step.title}
                </span>
                <span className="font-mono text-slate-400 shrink-0">
                  {step.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6 Core Agents Directory */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-semibold text-slate-400">
          Agent Roster
        </div>
        {CORE_AGENT_LIST.map((agent) => {
          const isOpen = expandedAgent === agent.id;
          return (
            <div
              key={agent.id}
              className="rounded-xl border border-slate-800 bg-[#0b101b] overflow-hidden"
            >
              <button
                type="button"
                aria-expanded={isOpen}
                onClick={() => setExpandedAgent(isOpen ? null : agent.id)}
                className="flex w-full items-center justify-between gap-2 p-2.5 text-left hover:bg-slate-800/40"
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <AgentBadge agentId={agent.id} size="sm" />
                  <div className="min-w-0">
                    <div className="text-xs font-semibold text-slate-100">
                      {agent.name}
                    </div>
                    <div className="text-[11px] text-slate-400 truncate">
                      {agent.role}
                    </div>
                  </div>
                </div>
                {isOpen ? (
                  <ChevronDown className="h-4 w-4 text-slate-500 shrink-0" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-slate-500 shrink-0" />
                )}
              </button>
              {isOpen && (
                <div className="border-t border-slate-800/70 px-3 py-2 text-[11px] text-slate-300 space-y-1.5">
                  <p className="text-slate-400">{agent.tagline}</p>
                  <div>
                    <span className="text-slate-500">Allowed tools: </span>
                    <span className="font-mono text-slate-200">
                      {agent.allowedTools.join(', ')}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-500">Max steps: </span>
                    <span className="font-mono tabular-nums">{agent.maxSteps}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
