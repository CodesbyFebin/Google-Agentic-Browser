'use client';

import React, { useCallback, useRef, useState } from 'react';
import Image from 'next/image';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  AlertTriangle,
  Copy,
  Loader2,
  Play,
  Plus,
  Save,
  Trash2,
  Wrench,
} from 'lucide-react';
import { useBrowserState } from '../BrowserStateProvider';
import {
  AGENT_STUDIO_TEMPLATES,
  createAgentFromTemplate,
} from '@/lib/agents/registry';
import { GEMINI_MODELS } from '@/lib/models';
import type { CustomAgentConfig, StudioTemplateId } from '@/lib/types';

const AVAILABLE_TOOLS = [
  'google_search',
  'url_context',
  'read_tab',
  'code_analysis',
  'extract_structured_data',
  'compare_options',
  'workspace_preview',
];

export function AgentStudioPanel() {
  const {
    customAgents,
    studioLogs,
    saveCustomAgent,
    deleteCustomAgent,
    addStudioLog,
    authedFetch,
  } = useBrowserState();

  const [selectedId, setSelectedId] = useState<string>(
    customAgents[0]?.id || ''
  );
  const activeAgent =
    customAgents.find((a) => a.id === selectedId) ?? customAgents[0] ?? null;

  const [draft, setDraft] = useState<CustomAgentConfig | null>(activeAgent);
  const [testPrompt, setTestPrompt] = useState('');
  const [running, setRunning] = useState(false);
  const [testOutput, setTestOutput] = useState<string | null>(null);
  const [testImageUrl, setTestImageUrl] = useState<string | null>(null);
  const [testError, setTestError] = useState<string | null>(null);
  const [savedBanner, setSavedBanner] = useState(false);
  const seqRef = useRef(1);

  const selectAgent = useCallback((agent: CustomAgentConfig) => {
    setSelectedId(agent.id);
    setDraft(agent);
    setTestOutput(null);
    setTestImageUrl(null);
    setTestError(null);
  }, []);

  const handleCreateFromTemplate = useCallback(
    (template: StudioTemplateId) => {
      const seq = seqRef.current++;
      const newId = `studio-${template}-${Date.now()}-${seq}`;
      const created = createAgentFromTemplate(template, newId);
      saveCustomAgent(created);
      selectAgent(created);
    },
    [saveCustomAgent, selectAgent]
  );

  const handleDuplicate = useCallback(() => {
    if (!draft) return;
    const seq = seqRef.current++;
    const copy: CustomAgentConfig = {
      ...draft,
      id: `studio-copy-${Date.now()}-${seq}`,
      name: `${draft.name} (Copy)`,
      updatedAtMs: Date.now(),
    };
    saveCustomAgent(copy);
    selectAgent(copy);
  }, [draft, saveCustomAgent, selectAgent]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!draft) return;
    saveCustomAgent(draft);
    setSavedBanner(true);
    setTimeout(() => setSavedBanner(false), 2000);
  };

  const handleRunTest = async () => {
    if (!draft || !testPrompt.trim()) return;
    setRunning(true);
    setTestOutput(null);
    setTestImageUrl(null);
    setTestError(null);

    try {
      const res = await authedFetch('/api/studio/run', {
        method: 'POST',
        body: JSON.stringify({
          agentName: draft.name,
          template: draft.template,
          systemInstruction: draft.systemInstruction,
          model: draft.model,
          tools: draft.tools,
          prompt: testPrompt.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const errMsg = data.error || 'Agent run failed.';
        setTestError(errMsg);
        addStudioLog({
          id: `slog_${Date.now()}`,
          agentId: draft.id,
          agentName: draft.name,
          prompt: testPrompt.trim(),
          output: errMsg,
          model: draft.model,
          status: data.status === 'UNAVAILABLE' ? 'UNAVAILABLE' : 'ERROR',
          estimatedTokens: 0,
          createdAtMs: Date.now(),
        });
        return;
      }

      setTestOutput(data.output || '');
      if (data.imageDataUrl) setTestImageUrl(data.imageDataUrl);
      addStudioLog({
        id: `slog_${Date.now()}`,
        agentId: draft.id,
        agentName: draft.name,
        prompt: testPrompt.trim(),
        output: data.output || '',
        model: data.model,
        status: 'COMPLETED',
        estimatedTokens: data.estimatedTokens || 0,
        createdAtMs: Date.now(),
      });
    } catch (err) {
      setTestError(err instanceof Error ? err.message : 'Execution error.');
    } finally {
      setRunning(false);
    }
  };

  return (
    <div className="h-full overflow-y-auto p-3 space-y-4">
      <div>
        <h3 className="font-display text-sm font-semibold text-slate-100">
          Agent Studio
        </h3>
        <p className="text-[11px] text-slate-400">
          Custom Gemini-powered agents built inside Google Agentic Browser.
        </p>
      </div>

      {/* Built-in Templates */}
      <div>
        <div className="text-[11px] font-semibold text-slate-400 mb-1.5">
          Create from Template
        </div>
        <div className="flex flex-wrap gap-1.5">
          {AGENT_STUDIO_TEMPLATES.map((tpl) => (
            <button
              key={tpl.template}
              type="button"
              onClick={() => handleCreateFromTemplate(tpl.template)}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-900/70 px-2 py-1 text-[11px] font-medium text-slate-300 hover:border-blue-500/40 hover:text-white"
            >
              <Plus className="h-3 w-3 text-blue-400" />
              <span>{tpl.template.charAt(0).toUpperCase() + tpl.template.slice(1)}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Saved Agents Gallery */}
      <div>
        <div className="text-[11px] font-semibold text-slate-400 mb-1.5">
          Your Custom Agents ({customAgents.length})
        </div>
        <div className="space-y-1">
          {customAgents.map((a) => (
            <div
              key={a.id}
              className={`flex items-center justify-between gap-1 rounded-lg border px-2.5 py-1.5 text-xs ${
                draft?.id === a.id
                  ? 'border-blue-500/50 bg-blue-950/25 text-white'
                  : 'border-slate-800 bg-[#0b101b] text-slate-300 hover:bg-slate-800/50'
              }`}
            >
              <button
                type="button"
                onClick={() => selectAgent(a)}
                className="flex-1 text-left truncate font-medium"
              >
                {a.name}
                <span className="ml-1.5 text-[10px] text-slate-500 font-mono">
                  {a.template}
                </span>
              </button>
              <button
                type="button"
                aria-label={`Delete agent ${a.name}`}
                onClick={() => {
                  deleteCustomAgent(a.id);
                  if (draft?.id === a.id) {
                    const remaining = customAgents.filter((x) => x.id !== a.id);
                    setDraft(remaining[0] ?? null);
                  }
                }}
                className="rounded p-1 text-slate-500 hover:text-red-300"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Editor + Test Runner */}
      {draft && (
        <form
          onSubmit={handleSave}
          className="space-y-3 rounded-xl border border-slate-800 bg-[#0b101b] p-3"
        >
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
              <Wrench className="h-3.5 w-3.5 text-blue-400" />
              Configure Agent
            </span>
            <button
              type="button"
              onClick={handleDuplicate}
              className="inline-flex items-center gap-1 text-[11px] text-slate-400 hover:text-slate-200"
            >
              <Copy className="h-3 w-3" />
              Duplicate
            </button>
          </div>

          <label className="block text-xs">
            <span className="text-slate-400">Name</span>
            <input
              type="text"
              required
              value={draft.name}
              onChange={(e) => setDraft({ ...draft, name: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-800 bg-[#080c14] px-2.5 py-1.5 text-xs text-slate-100"
            />
          </label>

          <label className="block text-xs">
            <span className="text-slate-400">Model</span>
            <select
              value={draft.model}
              onChange={(e) => setDraft({ ...draft, model: e.target.value })}
              className="mt-1 w-full rounded-lg border border-slate-800 bg-[#080c14] px-2.5 py-1.5 text-xs text-slate-100"
            >
              {GEMINI_MODELS.map((m) => (
                <option key={m.id} value={m.id}>
                  {m.label} ({m.tier})
                </option>
              ))}
            </select>
          </label>

          <label className="block text-xs">
            <span className="text-slate-400">System Instructions</span>
            <textarea
              rows={3}
              required
              value={draft.systemInstruction}
              onChange={(e) =>
                setDraft({ ...draft, systemInstruction: e.target.value })
              }
              className="mt-1 w-full rounded-lg border border-slate-800 bg-[#080c14] px-2.5 py-1.5 text-xs text-slate-100"
            />
          </label>

          <div>
            <div className="text-xs text-slate-400 mb-1">Tool Permissions</div>
            <div className="flex flex-wrap gap-2">
              {AVAILABLE_TOOLS.map((tool) => {
                const checked = draft.tools.includes(tool);
                return (
                  <label
                    key={tool}
                    className="inline-flex items-center gap-1 text-[11px] text-slate-300 cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={() =>
                        setDraft({
                          ...draft,
                          tools: checked
                            ? draft.tools.filter((t) => t !== tool)
                            : [...draft.tools, tool],
                        })
                      }
                      className="accent-blue-500"
                    />
                    <span className="font-mono">{tool}</span>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="flex items-center justify-between gap-2 text-xs">
            <label className="inline-flex items-center gap-1.5 text-slate-300 cursor-pointer">
              <input
                type="checkbox"
                checked={draft.requireApproval}
                onChange={(e) =>
                  setDraft({ ...draft, requireApproval: e.target.checked })
                }
                className="accent-blue-500"
              />
              <span>Require Approval</span>
            </label>
            <label className="inline-flex items-center gap-1.5 text-slate-300">
              <span>Max Steps</span>
              <input
                type="number"
                min={1}
                max={20}
                value={draft.maxSteps}
                onChange={(e) =>
                  setDraft({ ...draft, maxSteps: Number(e.target.value) || 1 })
                }
                className="w-14 rounded border border-slate-800 bg-[#080c14] px-2 py-1 text-xs font-mono tabular-nums"
              />
            </label>
          </div>

          <div className="flex items-center justify-between">
            <button
              type="submit"
              className="inline-flex items-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-500"
            >
              <Save className="h-3.5 w-3.5" />
              Save Agent
            </button>
            {savedBanner && (
              <span className="text-[11px] text-emerald-400">Saved!</span>
            )}
          </div>

          {/* Test Runner */}
          <div className="pt-3 border-t border-slate-800 space-y-2">
            <label className="block text-xs font-medium text-slate-300">
              Test / Run Agent
            </label>
            <textarea
              rows={2}
              value={testPrompt}
              onChange={(e) => setTestPrompt(e.target.value)}
              placeholder={`Test ${draft.name} with a real Gemini call...`}
              className="w-full rounded-lg border border-slate-800 bg-[#080c14] px-2.5 py-1.5 text-xs text-slate-100"
            />
            <button
              type="button"
              disabled={running || !testPrompt.trim()}
              onClick={handleRunTest}
              className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-indigo-500 disabled:opacity-50"
            >
              {running ? (
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
              ) : (
                <Play className="h-3.5 w-3.5" />
              )}
              Run Agent
            </button>

            {testError && (
              <div className="flex items-start gap-2 rounded-lg border border-amber-500/40 bg-amber-950/30 p-2.5 text-xs text-amber-200">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-amber-400" />
                <span>{testError}</span>
              </div>
            )}

            {testImageUrl && (
              <Image
                src={testImageUrl}
                alt="Generated agent media output"
                width={512}
                height={512}
                referrerPolicy="no-referrer"
                className="w-full h-auto rounded-lg border border-slate-700"
              />
            )}

            {testOutput && (
              <div className="rounded-lg border border-slate-800 bg-[#080c14] p-2.5 prose prose-invert prose-xs max-w-none text-xs">
                <Markdown remarkPlugins={[remarkGfm]}>{testOutput}</Markdown>
              </div>
            )}
          </div>
        </form>
      )}

      {/* Execution History */}
      {studioLogs.length > 0 && (
        <div className="space-y-1.5">
          <div className="text-[11px] font-semibold text-slate-400">
            Execution Logs
          </div>
          {studioLogs.slice(0, 5).map((log) => (
            <div
              key={log.id}
              className="rounded-lg border border-slate-800 bg-[#0b101b] p-2 text-[11px]"
            >
              <div className="flex items-center justify-between text-slate-400">
                <span className="font-semibold text-slate-200">{log.agentName}</span>
                <span className="font-mono">{log.status}</span>
              </div>
              <div className="text-slate-400 truncate mt-0.5">{log.prompt}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
