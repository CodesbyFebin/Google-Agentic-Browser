'use client';

import React, { useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  AlertTriangle,
  Download,
  ExternalLink,
  FileText,
  Globe,
  GripVertical,
  Loader2,
  Lock,
  Pause,
  Play,
  RefreshCw,
  Rocket,
  ShieldAlert,
  Sparkles,
  X,
} from 'lucide-react';
import { useBrowserState } from './BrowserStateProvider';
import { AgentBadge } from './AgentBadge';
import { ApprovalCard } from './ApprovalCard';
import type { BrowserTab } from '@/lib/types';

export function CenterWorkspace() {
  const {
    activeSpace,
    spaceTabs,
    setActivePane,
    setSplitLayout,
    setPaneSplitRatio,
    swapPaneTabs,
    focusTabInPane,
    closeTab,
    openTab,
    refreshWebTab,
  } = useBrowserState();

  const [draggedPane, setDraggedPane] = useState<number | null>(null);
  const paneCount = activeSpace.splitLayout;
  const paneIndices = Array.from({ length: paneCount }, (_, i) => i);

  const getTabForPane = (paneIdx: number): BrowserTab | undefined => {
    return (
      spaceTabs.find((t) => t.paneIndex === paneIdx) ??
      spaceTabs[paneIdx] ??
      spaceTabs[0]
    );
  };

  const gridStyle: React.CSSProperties =
    paneCount === 1
      ? { gridTemplateColumns: '1fr' }
      : {
          gridTemplateColumns: `${activeSpace.paneSplitRatio}% ${
            100 - activeSpace.paneSplitRatio
          }%`,
        };

  return (
    <main
      aria-label="Multi-pane browser workspace"
      className="flex-1 flex flex-col min-w-0 bg-transparent p-2.5 gap-2 overflow-hidden"
    >
      {/* Workspace Split Ratio Strip */}
      {paneCount > 1 && (
        <div className="flex items-center justify-between gap-3 px-1 text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-200">
              {activeSpace.name} Space
            </span>
            <span aria-hidden="true">·</span>
            <span className="text-slate-400">{paneCount}-Pane Workspace</span>
          </div>
          <label className="flex items-center gap-2 text-[11px]">
            <span>Split Ratio</span>
            <input
              type="range"
              min={30}
              max={70}
              value={activeSpace.paneSplitRatio}
              onChange={(e) => setPaneSplitRatio(Number(e.target.value))}
              className="w-24 accent-blue-500 cursor-pointer"
            />
            <span className="font-mono tabular-nums text-slate-300">
              {activeSpace.paneSplitRatio}/{100 - activeSpace.paneSplitRatio}
            </span>
          </label>
        </div>
      )}

      {/* Responsive Multi-Pane Grid */}
      <div
        style={gridStyle}
        className={`flex-1 grid gap-2.5 min-h-0 ${
          paneCount >= 3 ? 'grid-rows-2' : 'grid-rows-1'
        } max-md:!grid-cols-1 max-md:!grid-rows-none max-md:overflow-y-auto`}
      >
        {paneIndices.map((paneIdx) => {
          const tab = getTabForPane(paneIdx);
          const isActivePane = activeSpace.activePaneIndex === paneIdx;
          const isThreePaneSpan = paneCount === 3 && paneIdx === 2;

          return (
            <section
              key={paneIdx}
              aria-label={`Workspace pane ${paneIdx + 1}`}
              onClick={() => setActivePane(paneIdx)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => {
                if (draggedPane !== null && draggedPane !== paneIdx) {
                  swapPaneTabs(draggedPane, paneIdx);
                }
                setDraggedPane(null);
              }}
              className={`flex flex-col min-h-[220px] rounded-2xl border bg-[#0f172a]/70 backdrop-blur-md overflow-hidden transition-all ${
                isThreePaneSpan ? 'md:col-span-2' : ''
              } ${
                isActivePane
                  ? 'border-blue-500/60 shadow-[0_0_0_1px_rgba(59,130,246,0.22),0_12px_32px_-12px_rgba(37,99,235,0.25)]'
                  : 'border-slate-700/45 hover:border-slate-600/60'
              }`}
            >
              {/* Mini Per-Pane Browser Bar */}
              <div className="flex items-center justify-between gap-2 border-b border-slate-700/40 bg-[#0B1220]/80 px-2.5 py-1.5">
                <div className="flex items-center gap-1.5 min-w-0 flex-1">
                  <button
                    type="button"
                    draggable
                    onDragStart={() => setDraggedPane(paneIdx)}
                    aria-label={`Drag to reorder pane ${paneIdx + 1}`}
                    title="Drag onto another pane to swap"
                    className="cursor-grab rounded-lg p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-300 shrink-0"
                  >
                    <GripVertical className="h-3.5 w-3.5" />
                  </button>

                  {tab?.kind === 'web' && (
                    <button
                      type="button"
                      aria-label={`Refresh ${tab.title}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        refreshWebTab(tab.id);
                      }}
                      className="rounded-lg p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-100 shrink-0"
                    >
                      <RefreshCw
                        className={`h-3 w-3 ${tab.isLoading ? 'animate-spin text-teal-400' : ''}`}
                      />
                    </button>
                  )}

                  {/* Translucent URL + Pane Indicator Pill */}
                  <div className="flex items-center gap-1.5 min-w-0 flex-1 rounded-xl border border-slate-700/45 bg-[#0f172a]/80 px-2 py-1">
                    {tab?.kind === 'web' ? (
                      <Lock className="h-3 w-3 shrink-0 text-teal-400" />
                    ) : (
                      <Globe className="h-3 w-3 shrink-0 text-blue-400" />
                    )}
                    <span className="truncate font-mono text-[11px] text-slate-200">
                      {(tab?.url || 'gab://mission').replace(/^https?:\/\//, '')}
                    </span>
                    <span className="ml-auto shrink-0 rounded-md bg-slate-800/90 px-1.5 py-0.5 text-[10px] font-medium text-slate-300">
                      {paneIdx + 1}/{paneCount}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <label className="sr-only" htmlFor={`pane-select-${paneIdx}`}>
                    Select tab for pane {paneIdx + 1}
                  </label>
                  <select
                    id={`pane-select-${paneIdx}`}
                    value={tab?.id || ''}
                    onChange={(e) => focusTabInPane(e.target.value, paneIdx)}
                    className="max-w-[96px] truncate rounded-xl border border-slate-700/50 bg-[#0B1220]/90 px-1.5 py-1 text-[11px] font-medium text-slate-200 focus:border-blue-500 focus:outline-none"
                  >
                    {spaceTabs.map((t) => (
                      <option key={t.id} value={t.id}>
                        {t.title}
                      </option>
                    ))}
                  </select>

                  {tab?.kind === 'web' && (
                    <a
                      href={tab.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      aria-label={`Open ${tab.title} in new tab`}
                      className="inline-flex items-center justify-center rounded-lg p-1 text-teal-300 hover:bg-slate-800"
                    >
                      <ExternalLink className="h-3.5 w-3.5" />
                    </a>
                  )}
                  {paneCount > 1 && (
                    <button
                      type="button"
                      aria-label={`Collapse pane ${paneIdx + 1}`}
                      onClick={(e) => {
                        e.stopPropagation();
                        setSplitLayout((paneCount - 1) as 1 | 2 | 3);
                      }}
                      className="rounded-lg p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-200"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                  {tab && spaceTabs.length > 1 && paneCount === 1 && (
                    <button
                      type="button"
                      aria-label={`Close ${tab.title}`}
                      onClick={() => closeTab(tab.id)}
                      className="rounded-lg p-1 text-slate-500 hover:bg-slate-800 hover:text-slate-200"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  )}
                </div>
              </div>

              {/* Pane Content */}
              <div className="flex-1 overflow-y-auto p-3.5">
                {tab ? (
                  <PaneBody tab={tab} />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-center text-xs text-slate-400">
                    <p>No tab assigned to this pane.</p>
                    <button
                      type="button"
                      onClick={() =>
                        openTab({
                          title: 'New Scratchpad',
                          url: 'gab://notes',
                          kind: 'note',
                          paneIndex: paneIdx,
                        })
                      }
                      className="mt-2 rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500"
                    >
                      Open Scratchpad
                    </button>
                  </div>
                )}
              </div>
            </section>
          );
        })}
      </div>
    </main>
  );
}

function PaneBody({ tab }: { tab: BrowserTab }) {
  if (tab.url === 'gab://mission') return <MissionControlPane />;
  if (tab.url === 'gab://notes') return <NotesPane />;
  if (tab.url === 'gab://report') return <ReportsPane />;
  if (tab.url === 'gab://money') return <MoneyOverviewPane />;
  if (tab.url === 'gab://workspace') return <WorkspaceOverviewPane />;
  return <WebPreviewPane tab={tab} />;
}

function MissionControlPane() {
  const {
    missions,
    activeMissionId,
    approvals,
    startMission,
    pauseMission,
    resumeMission,
    cancelMission,
    selectMission,
    setSidebarTab,
  } = useBrowserState();

  const [objectiveInput, setObjectiveInput] = useState(
    'Research three project management tools, compare pricing and features, recommend the best option, and save a report.'
  );

  const activeMission =
    missions.find((m) => m.id === activeMissionId) ?? missions[0] ?? null;
  const missionApprovals = activeMission
    ? approvals.filter((a) => a.missionId === activeMission.id)
    : [];

  return (
    <div className="space-y-3.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-base font-semibold text-slate-100">
            Orion Mission Control
          </h2>
          <p className="text-xs text-slate-400">
            Multi-agent orchestration across Orion, Rover, Atlas, Aegis, Mercury, and Chronicle
          </p>
        </div>
        {missions.length > 1 && (
          <select
            aria-label="Select active mission"
            value={activeMission?.id || ''}
            onChange={(e) => selectMission(e.target.value)}
            className="rounded-xl border border-slate-700/60 bg-[#0B1220] px-2.5 py-1 text-xs text-slate-200"
          >
            {missions.map((m) => (
              <option key={m.id} value={m.id}>
                {m.title} ({m.status})
              </option>
            ))}
          </select>
        )}
      </div>

      {/* Mission Launcher */}
      <form
        onSubmit={async (e) => {
          e.preventDefault();
          await startMission(objectiveInput);
        }}
        className="space-y-2 rounded-2xl border border-slate-700/40 bg-[#0B1220]/75 p-3"
      >
        <label
          htmlFor="pane-mission-objective"
          className="block text-xs font-medium text-slate-300"
        >
          Mission Objective
        </label>
        <textarea
          id="pane-mission-objective"
          rows={2}
          value={objectiveInput}
          onChange={(e) => setObjectiveInput(e.target.value)}
          placeholder="Describe a multi-step objective for the 6-agent crew..."
          className="w-full rounded-xl border border-slate-700/50 bg-[#0f172a]/80 px-3 py-2 text-xs text-slate-100 placeholder:text-slate-500 focus:border-blue-500 focus:outline-none"
        />
        <div className="flex items-center justify-between gap-2">
          <span className="text-[11px] text-slate-400">
            External writes and spending pause for your approval.
          </span>
          <button
            type="submit"
            disabled={!objectiveInput.trim()}
            className="inline-flex items-center gap-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 px-3 py-1.5 text-xs font-semibold text-white hover:brightness-110 disabled:opacity-50 whitespace-nowrap"
          >
            <Rocket className="h-3.5 w-3.5" />
            <span>Run Mission</span>
          </button>
        </div>
      </form>

      {/* Active Mission Status & Steps */}
      {activeMission ? (
        <div className="space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-700/40 bg-[#0B1220]/75 px-3 py-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              <AgentBadge agentId={activeMission.activeAgentId} size="sm" />
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-100 truncate">
                  {activeMission.title}
                </div>
                <div className="text-[11px] text-slate-400 font-mono">
                  Status: {activeMission.status} · Active:{' '}
                  {activeMission.activeAgentId.toUpperCase()}
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1.5">
              {activeMission.status === 'RUNNING' && (
                <button
                  type="button"
                  onClick={() => pauseMission(activeMission.id)}
                  className="inline-flex items-center gap-1 rounded-xl border border-slate-700 bg-slate-800 px-2.5 py-1 text-[11px] font-medium text-slate-200 hover:bg-slate-700"
                >
                  <Pause className="h-3 w-3" />
                  Pause
                </button>
              )}
              {activeMission.status === 'PAUSED' && (
                <button
                  type="button"
                  onClick={() => resumeMission(activeMission.id)}
                  className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-blue-500"
                >
                  <Play className="h-3 w-3" />
                  Resume
                </button>
              )}
              {activeMission.status !== 'COMPLETED' &&
                activeMission.status !== 'CANCELLED' && (
                  <button
                    type="button"
                    onClick={() => cancelMission(activeMission.id)}
                    className="rounded-xl border border-red-500/30 bg-red-950/30 px-2.5 py-1 text-[11px] text-red-200 hover:bg-red-900/40"
                  >
                    Cancel
                  </button>
                )}
              <button
                type="button"
                onClick={() => setSidebarTab('activity')}
                className="rounded-xl border border-slate-700 px-2.5 py-1 text-[11px] text-slate-300 hover:bg-slate-800"
              >
                Replay
              </button>
            </div>
          </div>

          {activeMission.error && (
            <div className="rounded-xl border border-red-500/40 bg-red-950/30 p-3 text-xs text-red-200">
              {activeMission.error}
            </div>
          )}

          {missionApprovals.map((apr) => (
            <ApprovalCard key={apr.id} approval={apr} />
          ))}

          <div className="space-y-2">
            {activeMission.steps.map((step, idx) => (
              <div
                key={step.id}
                className="rounded-2xl border border-slate-700/40 bg-[#0B1220]/75 p-3"
              >
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                    <AgentBadge agentId={step.agentId} size="sm" />
                    <span className="text-xs font-semibold text-slate-100 truncate">
                      {idx + 1}. {step.title}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-teal-300 shrink-0">
                    {step.status}
                  </span>
                </div>
                <p className="mt-1 text-[11px] text-slate-400">
                  {step.instruction}
                </p>
                {step.output && (
                  <div className="mt-2 border-t border-slate-700/40 pt-2 prose prose-invert prose-xs max-w-none text-xs text-slate-200">
                    <Markdown remarkPlugins={[remarkGfm]}>
                      {step.output}
                    </Markdown>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-700/60 bg-[#0B1220]/40 p-5 text-center text-xs text-slate-400">
          No missions started yet. Launch a mission above to orchestrate Orion, Rover, Atlas, Aegis, Mercury, and Chronicle.
        </div>
      )}
    </div>
  );
}

function NotesPane() {
  const { activeSpace, updateSpaceNotes, startMission, saveReport } =
    useBrowserState();

  return (
    <div className="flex h-full flex-col gap-2.5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-sm font-semibold text-slate-100">
            {activeSpace.name} Notes Scratchpad
          </h2>
          <p className="text-[11px] text-slate-400">
            Persists per Space · Markdown ready
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() =>
              saveReport(`${activeSpace.name} Notes Snapshot`, activeSpace.notes)
            }
            className="rounded-xl border border-slate-700/60 bg-slate-800/80 px-2.5 py-1 text-[11px] font-medium text-slate-200 hover:bg-slate-700 whitespace-nowrap"
          >
            Save to Reports
          </button>
          <button
            type="button"
            onClick={() => startMission(activeSpace.notes.slice(0, 500))}
            disabled={!activeSpace.notes.trim()}
            className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-blue-500 disabled:opacity-50 whitespace-nowrap"
          >
            <Sparkles className="h-3 w-3" />
            Mission from Notes
          </button>
        </div>
      </div>

      <label htmlFor={`notes-${activeSpace.id}`} className="sr-only">
        Space notes
      </label>
      <textarea
        id={`notes-${activeSpace.id}`}
        value={activeSpace.notes}
        onChange={(e) => updateSpaceNotes(e.target.value)}
        placeholder="Write notes, links, or research findings..."
        className="flex-1 min-h-[180px] w-full resize-none rounded-2xl border border-slate-700/50 bg-[#0B1220]/75 p-3 text-xs leading-relaxed text-slate-200 font-mono focus:border-blue-500/60 focus:outline-none"
      />
    </div>
  );
}

function ReportsPane() {
  const { reports, createManualApproval, activeSpace } = useBrowserState();
  const [selectedId, setSelectedId] = useState<string>(reports[0]?.id || '');
  const activeReport =
    reports.find((r) => r.id === selectedId) ?? reports[0] ?? null;
  const [driveStatus, setDriveStatus] = useState<string | null>(null);

  const handleDownloadMarkdown = () => {
    if (!activeReport) return;
    const blob = new Blob([activeReport.content], {
      type: 'text/markdown;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${activeReport.title.replace(/[^a-zA-Z0-9_-]+/g, '_')}.md`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleProposeDriveSave = async () => {
    if (!activeReport) return;
    const apr = await createManualApproval({
      missionId: activeReport.missionId || `msn_report_${Date.now()}`,
      stepId: `step_export_${Date.now()}`,
      agentId: 'chronicle',
      action: {
        actionType: 'WRITE_DRIVE_FILE',
        title: `Save "${activeReport.title}" to Google Drive`,
        reason: 'Writing a report to external Google Drive requires explicit human approval.',
        targetService: 'drive',
        riskLevel: 'MEDIUM',
        parameters: {
          fileName: `${activeReport.title.slice(0, 60)}.md`,
          contentPreview: activeReport.content.slice(0, 1200),
        },
      },
    });
    if (apr) {
      setDriveStatus(
        'Created approval request! Review and approve it in the Agents or Mission panel to push to Google Drive.'
      );
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-sm font-semibold text-slate-100">
            Chronicle Knowledge & Reports
          </h2>
          <p className="text-[11px] text-slate-400">
            {reports.length} saved report{reports.length === 1 ? '' : 's'} · {activeSpace.name}
          </p>
        </div>
        {activeReport && (
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleDownloadMarkdown}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-700/60 bg-slate-800/80 px-2.5 py-1 text-[11px] font-medium text-slate-200 hover:bg-slate-700"
            >
              <Download className="h-3 w-3" />
              Export .md
            </button>
            <button
              type="button"
              onClick={handleProposeDriveSave}
              className="inline-flex items-center gap-1 rounded-xl bg-teal-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-teal-500"
            >
              <FileText className="h-3 w-3" />
              Save to Drive (Approval)
            </button>
          </div>
        )}
      </div>

      {driveStatus && (
        <div className="rounded-xl border border-amber-500/40 bg-amber-950/30 p-2.5 text-xs text-amber-200">
          {driveStatus}
        </div>
      )}

      {reports.length > 0 && (
        <select
          aria-label="Choose saved report"
          value={activeReport?.id || ''}
          onChange={(e) => setSelectedId(e.target.value)}
          className="w-full rounded-xl border border-slate-700/50 bg-[#0B1220] px-2.5 py-1.5 text-xs text-slate-200"
        >
          {reports.map((r) => (
            <option key={r.id} value={r.id}>
              {r.title}
            </option>
          ))}
        </select>
      )}

      {activeReport ? (
        <article className="rounded-2xl border border-slate-700/40 bg-[#0B1220]/75 p-3.5 prose prose-invert prose-sm max-w-none text-xs">
          <Markdown remarkPlugins={[remarkGfm]}>{activeReport.content}</Markdown>
        </article>
      ) : (
        <div className="text-xs text-slate-400">No saved reports yet.</div>
      )}
    </div>
  );
}

function MoneyOverviewPane() {
  const { spendingPolicy, simulatedTransactions, approvals, setSidebarTab } =
    useBrowserState();
  const pendingSpend = approvals.filter(
    (a) => a.status === 'PENDING' && a.actionType === 'SPEND_MONEY_SIMULATED'
  );

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h2 className="font-display text-sm font-semibold text-slate-100">
            Money OS · Simulation Mode
          </h2>
          <p className="text-[11px] text-amber-300">
            Simulated balances only — real payment execution is disabled by default
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSidebarTab('money')}
          className="rounded-xl border border-slate-700/60 bg-slate-800/80 px-2.5 py-1 text-xs text-slate-200 hover:bg-slate-700"
        >
          Manage Policy
        </button>
      </div>

      <div className="grid grid-cols-3 gap-2">
        <div className="rounded-2xl border border-slate-700/40 bg-[#0B1220]/75 p-3">
          <div className="text-[11px] text-slate-400">Simulated Balance</div>
          <div className="mt-1 font-mono tabular-nums text-base font-semibold text-teal-300">
            ${spendingPolicy.simulatedBalanceUsd.toFixed(2)}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-700/40 bg-[#0B1220]/75 p-3">
          <div className="text-[11px] text-slate-400">Per-Tx Limit</div>
          <div className="mt-1 font-mono tabular-nums text-base font-semibold text-slate-100">
            ${spendingPolicy.perTxLimitUsd.toFixed(2)}
          </div>
        </div>
        <div className="rounded-2xl border border-slate-700/40 bg-[#0B1220]/75 p-3">
          <div className="text-[11px] text-slate-400">Pending Approvals</div>
          <div className="mt-1 font-mono tabular-nums text-base font-semibold text-amber-300">
            {pendingSpend.length}
          </div>
        </div>
      </div>

      {pendingSpend.map((apr) => (
        <ApprovalCard key={apr.id} approval={apr} />
      ))}

      <div className="rounded-2xl border border-slate-700/40 bg-[#0B1220]/75 p-3">
        <div className="text-xs font-semibold text-slate-200 mb-2">
          Simulated Transaction Ledger
        </div>
        {simulatedTransactions.length === 0 ? (
          <p className="text-xs text-slate-400">
            No simulated transactions yet. Propose one from the Money sidebar tab or via Mercury.
          </p>
        ) : (
          <div className="space-y-1.5">
            {simulatedTransactions.map((tx) => (
              <div
                key={tx.id}
                className="flex items-center justify-between text-xs border-b border-slate-800/70 pb-1.5 last:border-0"
              >
                <div>
                  <span className="font-medium text-slate-200">{tx.merchant}</span>
                  <span className="text-slate-500"> · {tx.description}</span>
                </div>
                <span className="font-mono tabular-nums text-amber-300">
                  -${tx.amountUsd.toFixed(2)} (Sim)
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function WorkspaceOverviewPane() {
  const { user, connections, setSidebarTab } = useBrowserState();

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-display text-sm font-semibold text-slate-100">
            Google Workspace Integrations
          </h2>
          <p className="text-[11px] text-slate-400">
            {user
              ? `Signed in as ${user.email}`
              : 'Disconnected · Sign in and grant Workspace scopes in Connect'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setSidebarTab('connect')}
          className="rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500"
        >
          Open Connect
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {connections.map((c) => (
          <div
            key={c.service}
            className="rounded-2xl border border-slate-700/40 bg-[#0B1220]/75 p-3"
          >
            <div className="text-xs font-semibold text-slate-100">{c.label}</div>
            <div
              className={`mt-1 text-[11px] font-mono ${
                c.connected ? 'text-teal-400' : 'text-slate-500'
              }`}
            >
              {c.connected ? 'Connected' : 'Disconnected'}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function WebPreviewPane({ tab }: { tab: BrowserTab }) {
  const { refreshWebTab, authedFetch, settings } = useBrowserState();
  const [aiSummary, setAiSummary] = useState<string | null>(null);
  const [summarizing, setSummarizing] = useState(false);
  const [sumError, setSumError] = useState<string | null>(null);

  const handleSummarize = async () => {
    setSummarizing(true);
    setSumError(null);
    try {
      const res = await authedFetch('/api/ai/summarize', {
        method: 'POST',
        body: JSON.stringify({
          title: tab.title,
          content: tab.extractedText || tab.summary,
          url: tab.url,
          model: settings.defaultModel,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Summarization failed.');
      setAiSummary(data.summary);
    } catch (err) {
      setSumError(err instanceof Error ? err.message : 'Unable to summarize.');
    } finally {
      setSummarizing(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-2 rounded-2xl border border-slate-700/40 bg-[#0B1220]/75 p-3">
        <div className="min-w-0">
          <h2 className="font-display text-sm font-semibold text-slate-100 truncate">
            {tab.title}
          </h2>
          <p className="text-[11px] text-slate-400 font-mono truncate">
            {tab.url}
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <button
            type="button"
            onClick={() => refreshWebTab(tab.id)}
            disabled={tab.isLoading}
            className="inline-flex items-center gap-1 rounded-xl border border-slate-700/60 bg-slate-800/80 px-2.5 py-1 text-[11px] text-slate-200 hover:bg-slate-700"
          >
            <RefreshCw
              className={`h-3 w-3 ${tab.isLoading ? 'animate-spin' : ''}`}
            />
            Inspect
          </button>
          <button
            type="button"
            onClick={handleSummarize}
            disabled={summarizing}
            className="inline-flex items-center gap-1 rounded-xl bg-blue-600 px-2.5 py-1 text-[11px] font-medium text-white hover:bg-blue-500 disabled:opacity-50"
          >
            {summarizing ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : (
              <Sparkles className="h-3 w-3" />
            )}
            Summarize
          </button>
          <a
            href={tab.url}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 rounded-xl border border-teal-500/40 bg-teal-950/35 px-2.5 py-1 text-[11px] font-medium text-teal-200 hover:bg-teal-900/45"
          >
            <ExternalLink className="h-3 w-3" />
            Open in new tab
          </a>
        </div>
      </div>

      <div className="rounded-xl border border-slate-700/40 bg-[#0B1220]/50 px-3 py-2 text-[11px] text-slate-400">
        Safe Reader Preview: External sites that prohibit iframe embedding via{' '}
        <span className="font-mono text-slate-300">X-Frame-Options</span> or CSP are inspected via our SSRF-protected server reader or opened directly in a new browser tab.
      </div>

      {tab.error && (
        <div className="flex items-start gap-2 rounded-xl border border-amber-500/40 bg-amber-950/30 p-2.5 text-xs text-amber-200">
          <ShieldAlert className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
          <span>{tab.error}</span>
        </div>
      )}

      {sumError && (
        <div className="flex items-start gap-2 rounded-xl border border-red-500/40 bg-red-950/30 p-2.5 text-xs text-red-200">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
          <span>{sumError}</span>
        </div>
      )}

      {aiSummary && (
        <div className="rounded-2xl border border-blue-500/35 bg-blue-950/20 p-3">
          <div className="text-xs font-semibold text-blue-200 mb-1.5">
            Gemini Summary
          </div>
          <div className="prose prose-invert prose-xs max-w-none text-xs text-slate-200">
            <Markdown remarkPlugins={[remarkGfm]}>{aiSummary}</Markdown>
          </div>
        </div>
      )}

      {tab.isLoading ? (
        <div className="flex items-center gap-2 py-6 text-xs text-slate-400">
          <Loader2 className="h-4 w-4 animate-spin text-blue-400" />
          <span>Inspecting safe page metadata...</span>
        </div>
      ) : (
        <div className="rounded-2xl border border-slate-700/40 bg-[#0B1220]/75 p-3 text-xs text-slate-300 leading-relaxed space-y-2">
          {tab.summary && <p className="text-slate-200 font-medium">{tab.summary}</p>}
          {tab.extractedText ? (
            <p className="text-slate-400 whitespace-pre-wrap">
              {tab.extractedText.slice(0, 1800)}
              {tab.extractedText.length > 1800 ? '...' : ''}
            </p>
          ) : (
            <p className="text-slate-500">
              Click Inspect to fetch readable page metadata, or click Open in new tab to view the live site.
            </p>
          )}
        </div>
      )}
    </div>
  );
}
