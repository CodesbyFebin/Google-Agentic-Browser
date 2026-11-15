'use client';

import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Edit3,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import { AgentBadge } from './AgentBadge';
import { useBrowserState } from './BrowserStateProvider';
import type { ApprovalRequest } from '@/lib/types';

export function ApprovalCard({ approval }: { approval: ApprovalRequest }) {
  const { decideApproval, cancelMission } = useBrowserState();
  const [busy, setBusy] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editedParams, setEditedParams] = useState<
    Record<string, string | number | boolean>
  >(approval.parameters);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [nowMs, setNowMs] = useState(0);

  const isPending = approval.status === 'PENDING';

  useEffect(() => {
    if (!isPending) return;
    queueMicrotask(() => setNowMs(Date.now()));
    const timer = setInterval(() => setNowMs(Date.now()), 5000);
    return () => clearInterval(timer);
  }, [isPending]);

  const isExpired = isPending && nowMs > 0 && nowMs > approval.expiresAtMs;

  const handleDecision = async (decision: 'APPROVE' | 'REJECT') => {
    setBusy(true);
    setFeedback(null);
    try {
      const res = await decideApproval(
        approval.id,
        decision,
        editing ? editedParams : undefined
      );
      setFeedback(res.message);
      setEditing(false);
    } catch (err) {
      setFeedback(
        err instanceof Error ? err.message : 'Approval request failed.'
      );
    } finally {
      setBusy(false);
    }
  };

  const riskTone =
    approval.riskLevel === 'CRITICAL'
      ? 'text-red-300 border-red-500/40 bg-red-950/30'
      : approval.riskLevel === 'HIGH'
      ? 'text-amber-300 border-amber-500/40 bg-amber-950/30'
      : 'text-cyan-300 border-cyan-500/35 bg-cyan-950/20';

  return (
    <div
      className={`rounded-xl border p-3.5 text-sm transition-colors ${
        isPending
          ? 'border-amber-500/40 bg-[#121826]'
          : approval.status === 'EXECUTED'
          ? 'border-emerald-500/30 bg-emerald-950/15'
          : 'border-slate-700/70 bg-slate-900/60'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <AgentBadge agentId={approval.agentId} size="sm" />
          <div>
            <h4 className="font-semibold text-slate-100 leading-snug">
              {approval.title}
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              {approval.agentId.toUpperCase()} · {approval.targetService} ·{' '}
              {approval.actionType}
            </p>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-md border px-2 py-0.5 text-[11px] font-medium ${riskTone}`}
        >
          {approval.riskLevel} RISK
        </span>
      </div>

      <p className="mt-2.5 text-xs text-slate-300 leading-relaxed">
        {approval.reason}
      </p>

      <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-400 font-mono tabular-nums">
        <span>Status: {isExpired ? 'EXPIRED' : approval.status}</span>
        {typeof approval.estimatedCostUsd === 'number' && (
          <span>Est. Cost: ${approval.estimatedCostUsd.toFixed(2)} (Simulation)</span>
        )}
        <span>
          Expires: {new Date(approval.expiresAtMs).toLocaleTimeString()}
        </span>
      </div>

      {approval.requiredScopes && approval.requiredScopes.length > 0 && (
        <div className="mt-2 text-[11px] text-slate-400">
          Required permissions: {approval.requiredScopes.join(', ')}
        </div>
      )}

      {editing ? (
        <div className="mt-3 space-y-2 rounded-lg border border-slate-700/80 bg-[#0b101b] p-2.5">
          <div className="text-xs font-medium text-slate-300">
            Edit Action Parameters
          </div>
          {Object.entries(editedParams).map(([key, val]) => (
            <label key={key} className="block text-xs">
              <span className="text-slate-400">{key}</span>
              <input
                type={typeof val === 'number' ? 'number' : 'text'}
                value={String(val)}
                onChange={(e) =>
                  setEditedParams((prev) => ({
                    ...prev,
                    [key]:
                      typeof val === 'number'
                        ? Number(e.target.value)
                        : e.target.value,
                  }))
                }
                className="mt-1 w-full rounded-md border border-slate-700 bg-slate-900 px-2.5 py-1.5 text-xs text-slate-100 focus:border-blue-500 focus:outline-none"
              />
            </label>
          ))}
        </div>
      ) : (
        <div className="mt-2.5 rounded-lg border border-slate-800 bg-[#0b101b] p-2 text-xs text-slate-300 font-mono overflow-x-auto">
          {Object.entries(approval.parameters).map(([k, v]) => (
            <div key={k} className="truncate">
              <span className="text-slate-500">{k}:</span>{' '}
              <span>{String(v)}</span>
            </div>
          ))}
        </div>
      )}

      {approval.executionResult && (
        <div className="mt-2.5 flex items-start gap-2 rounded-lg border border-emerald-500/30 bg-emerald-950/20 px-2.5 py-2 text-xs text-emerald-200">
          <CheckCircle2 className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
          <span>{approval.executionResult}</span>
        </div>
      )}

      {feedback && !approval.executionResult && (
        <div className="mt-2.5 flex items-start gap-2 rounded-lg border border-slate-700 bg-slate-900 px-2.5 py-2 text-xs text-slate-200">
          <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
          <span>{feedback}</span>
        </div>
      )}

      {isPending && !isExpired && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => handleDecision('APPROVE')}
            className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-emerald-500 disabled:opacity-50 whitespace-nowrap"
          >
            <ShieldAlert className="h-3.5 w-3.5" />
            Approve
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => handleDecision('REJECT')}
            className="inline-flex items-center gap-1.5 rounded-lg border border-red-500/40 bg-red-950/40 px-3 py-1.5 text-xs font-medium text-red-200 hover:bg-red-900/50 disabled:opacity-50 whitespace-nowrap"
          >
            <XCircle className="h-3.5 w-3.5" />
            Reject
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => setEditing((e) => !e)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-slate-700 bg-slate-800/80 px-2.5 py-1.5 text-xs font-medium text-slate-200 hover:bg-slate-700 whitespace-nowrap"
          >
            <Edit3 className="h-3.5 w-3.5" />
            {editing ? 'Done Editing' : 'Edit Request'}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={() => cancelMission(approval.missionId)}
            className="ml-auto text-xs text-slate-400 hover:text-slate-200 underline-offset-2 hover:underline whitespace-nowrap"
          >
            Cancel Mission
          </button>
        </div>
      )}
    </div>
  );
}
