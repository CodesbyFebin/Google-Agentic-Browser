'use client';

import React, { useRef, useState } from 'react';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ChevronRight,
  Code2,
  Database,
  Globe,
  Hammer,
  Image as ImageIcon,
  LayoutGrid,
  Loader2,
  Rocket,
  Send,
  Sparkles,
  Square,
  Trash2,
  Video,
} from 'lucide-react';
import { useBrowserState } from '../BrowserStateProvider';
import { AgentBadge } from '../AgentBadge';
import { CORE_AGENT_LIST } from '@/lib/agents/registry';
import { GEMINI_MODELS, estimateCostUsd, estimateTokenCount } from '@/lib/models';

const QUICK_PROMPTS = [
  'Summarize this page',
  "Explain like I'm 5",
  'Rewrite for clarity',
  'Make a to-do list',
  'Plan my research',
  'Find the key dates',
];

const STUDIO_SHORTCUTS = [
  {
    id: 'code',
    label: 'Code',
    sub: 'Agent',
    icon: Code2,
    tone: 'border-blue-500/35 bg-blue-500/15 text-blue-300',
  },
  {
    id: 'data',
    label: 'Data',
    sub: 'Agent',
    icon: Database,
    tone: 'border-teal-500/35 bg-teal-500/15 text-teal-300',
  },
  {
    id: 'image',
    label: 'Image',
    sub: 'Agent',
    icon: ImageIcon,
    tone: 'border-purple-500/35 bg-purple-500/15 text-purple-300',
  },
  {
    id: 'video',
    label: 'Video',
    sub: 'Agent',
    icon: Video,
    tone: 'border-rose-500/35 bg-rose-500/15 text-rose-300',
  },
  {
    id: 'build',
    label: 'Build',
    sub: 'Agent',
    icon: Hammer,
    tone: 'border-amber-500/35 bg-amber-500/15 text-amber-300',
  },
  {
    id: 'custom',
    label: 'Custom',
    sub: 'Agent',
    icon: LayoutGrid,
    tone: 'border-indigo-500/35 bg-indigo-500/15 text-indigo-300',
  },
];

export function GeminiPanel() {
  const {
    chatMessages,
    activeTab,
    activeSpace,
    settings,
    addChatMessage,
    updateLastModelMessage,
    clearChat,
    startMission,
    logActivity,
    authedFetch,
    setSidebarTab,
  } = useBrowserState();

  const [input, setInput] = useState('');
  const [selectedModel, setSelectedModel] = useState(settings.defaultModel);
  const [includeContext, setIncludeContext] = useState(true);
  const [useSearch, setUseSearch] = useState(false);
  const [streaming, setStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  const textModels = GEMINI_MODELS.filter((m) => m.category === 'text');

  const handleSendPrompt = async (rawPrompt: string, now: number) => {
    const prompt = rawPrompt.trim();
    if (!prompt || streaming) return;

    setError(null);
    setInput('');

    const userMsgId = `msg_u_${now}`;
    const modelMsgId = `msg_m_${now + 1}`;
    const historySnapshot = chatMessages.slice(-16).map((m) => ({
      role: m.role,
      content: m.content,
    }));

    addChatMessage({
      id: userMsgId,
      role: 'user',
      content: prompt,
      estimatedTokens: estimateTokenCount(prompt),
      createdAtMs: now,
    });
    addChatMessage({
      id: modelMsgId,
      role: 'model',
      content: '',
      model: selectedModel,
      createdAtMs: now,
    });

    const paneContext = includeContext
      ? activeTab?.url === 'gab://notes'
        ? activeSpace.notes
        : activeTab?.extractedText || activeTab?.summary || activeTab?.title
      : undefined;

    const controller = new AbortController();
    abortRef.current = controller;
    setStreaming(true);

    try {
      const res = await authedFetch('/api/ai/chat', {
        method: 'POST',
        signal: controller.signal,
        body: JSON.stringify({
          message: prompt,
          history: historySnapshot,
          model: selectedModel,
          paneContext,
          useSearchGrounding: useSearch,
          stream: true,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.error || `Gemini error (HTTP ${res.status})`);
      }

      const reader = res.body?.getReader();
      if (!reader) throw new Error('Readable stream unavailable.');
      const decoder = new TextDecoder();
      let accumulated = '';
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n\n');
        buffer = lines.pop() ?? '';

        for (const chunk of lines) {
          const dataLine = chunk
            .split('\n')
            .find((l) => l.startsWith('data: '));
          if (!dataLine) continue;
          const payload = JSON.parse(dataLine.slice(6)) as {
            delta?: string;
            done?: boolean;
            error?: string;
            groundingUrls?: { title: string; uri: string }[];
          };
          if (payload.error) {
            throw new Error(payload.error);
          }
          if (payload.delta) {
            accumulated += payload.delta;
            updateLastModelMessage(modelMsgId, accumulated);
          }
          if (payload.done) {
            updateLastModelMessage(
              modelMsgId,
              accumulated || '(Empty response)',
              payload.groundingUrls
            );
          }
        }
      }

      logActivity({
        eventType: 'GEMINI_CALL',
        summary: `Gemini (${selectedModel}) answered chat prompt (${estimateTokenCount(
          accumulated
        )} est. tokens).`,
        status: 'SUCCESS',
      });
    } catch (err) {
      if ((err as Error)?.name === 'AbortError') {
        updateLastModelMessage(modelMsgId, '_Request cancelled by user._');
      } else {
        const msg = err instanceof Error ? err.message : 'Gemini request failed.';
        setError(msg);
        updateLastModelMessage(modelMsgId, `**Error:** ${msg}`);
        logActivity({
          eventType: 'ERROR',
          summary: `Gemini chat failed: ${msg}`,
          status: 'ERROR',
        });
      }
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  return (
    <div className="flex h-full flex-col">
      {/* Gemini Hero Banner */}
      <div className="mx-3 mt-2.5 rounded-2xl bg-gradient-to-br from-blue-600 via-purple-600 to-rose-500 p-3.5 text-white shadow-lg shadow-blue-950/50">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-1.5 text-sm font-semibold">
            <Sparkles className="h-4 w-4 text-teal-200" />
            <span>Gemini</span>
          </div>
          {chatMessages.length > 0 && (
            <button
              type="button"
              aria-label="Clear chat history"
              onClick={clearChat}
              className="rounded-lg bg-white/15 px-2 py-0.5 text-[10px] font-medium text-white hover:bg-white/25 inline-flex items-center gap-1"
            >
              <Trash2 className="h-3 w-3" />
              <span>Clear</span>
            </button>
          )}
        </div>
        <p className="mt-1 text-xs font-medium leading-snug text-white/95">
          Your page, explained. Your words, improved. Your tasks, done.
        </p>
        {activeTab && (
          <div className="mt-1.5 truncate text-[10px] text-white/85 font-mono">
            Reading: {activeTab.title} · {activeTab.url}
          </div>
        )}
      </div>

      {/* Model & Grounding Controls */}
      <div className="mx-3 mt-2 rounded-2xl border border-slate-700/40 bg-[#0f172a]/70 px-2.5 py-2 space-y-1.5">
        <div className="flex items-center gap-2">
          <label htmlFor="gemini-model-select" className="text-[11px] text-slate-400">
            Model
          </label>
          <select
            id="gemini-model-select"
            value={selectedModel}
            onChange={(e) => setSelectedModel(e.target.value)}
            className="flex-1 rounded-xl border border-slate-700/60 bg-[#0B1220] px-2 py-1 text-xs text-slate-100 focus:border-blue-500 focus:outline-none"
          >
            {textModels.map((m) => (
              <option key={m.id} value={m.id}>
                {m.label} {m.tier === 'paid' ? '(Paid Key)' : ''}
              </option>
            ))}
          </select>
        </div>

        <div className="flex flex-wrap items-center gap-3 text-[11px] text-slate-300">
          <label className="inline-flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={includeContext}
              onChange={(e) => setIncludeContext(e.target.checked)}
              className="accent-blue-500"
            />
            <span>Active pane context</span>
          </label>
          <label className="inline-flex items-center gap-1.5 cursor-pointer">
            <input
              type="checkbox"
              checked={useSearch}
              onChange={(e) => setUseSearch(e.target.checked)}
              className="accent-teal-400"
            />
            <Globe className="h-3 w-3 text-teal-400" />
            <span>Search grounding</span>
          </label>
        </div>
      </div>

      {/* Scrollable Chat / Screenshot Idle View */}
      <div className="flex-1 overflow-y-auto px-3 py-2.5 space-y-3">
        {chatMessages.length === 0 ? (
          <>
            {/* Quick Action Chips */}
            <div className="grid grid-cols-2 gap-1.5">
              {QUICK_PROMPTS.map((sample) => (
                <button
                  key={sample}
                  type="button"
                  onClick={() => handleSendPrompt(sample, Date.now())}
                  className="rounded-xl border border-slate-700/45 bg-[#0f172a]/75 px-2.5 py-1.5 text-left text-[11px] font-medium text-slate-200 hover:border-blue-500/50 hover:bg-slate-800/80 hover:text-white truncate transition-colors"
                >
                  {sample}
                </button>
              ))}
            </div>

            {/* Greeting Bubble */}
            <div className="rounded-2xl border border-slate-700/40 bg-[#0f172a]/70 p-3 text-xs text-slate-300 leading-relaxed flex items-start gap-2.5">
              <span className="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-teal-400/25 via-blue-500/25 to-purple-500/25 text-teal-300 ring-1 ring-teal-400/30 mt-0.5">
                <Sparkles className="h-3.5 w-3.5" />
              </span>
              <p>
                Hi, I&apos;m Gemini. I can summarize this page, explain code, draft an email, plan research, or turn tabs into a to-do list. Click{' '}
                <strong className="text-slate-100">Summarize this page</strong> or ask below.
              </p>
            </div>

            {/* Agent Studio 6-Template Strip */}
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => setSidebarTab('studio')}
                className="flex w-full items-center justify-between text-xs font-semibold text-slate-200 hover:text-teal-300 transition-colors"
              >
                <span className="flex items-center gap-1.5">
                  <Sparkles className="h-3.5 w-3.5 text-blue-400" />
                  <span>Agent Studio (Custom Agents)</span>
                </span>
                <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
              </button>
              <div className="grid grid-cols-6 gap-1.5">
                {STUDIO_SHORTCUTS.map((tpl) => {
                  const Icon = tpl.icon;
                  return (
                    <button
                      key={tpl.id}
                      type="button"
                      onClick={() => setSidebarTab('studio')}
                      className={`flex flex-col items-center justify-center gap-0.5 rounded-xl border py-1.5 px-1 text-[10px] font-medium hover:brightness-110 transition-all ${tpl.tone}`}
                    >
                      <Icon className="h-3.5 w-3.5" />
                      <span className="truncate max-w-full">{tpl.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* 6-Agent Roster Card */}
            <div className="space-y-1.5">
              <button
                type="button"
                onClick={() => setSidebarTab('agents')}
                className="flex w-full items-center justify-between text-xs font-semibold text-slate-200 hover:text-teal-300 transition-colors"
              >
                <span>Agents ({CORE_AGENT_LIST.length})</span>
                <ChevronRight className="h-3.5 w-3.5 text-slate-500" />
              </button>
              <div className="rounded-2xl border border-slate-700/40 bg-[#0f172a]/70 divide-y divide-slate-800/70">
                {CORE_AGENT_LIST.map((ag) => (
                  <button
                    key={ag.id}
                    type="button"
                    onClick={() => setSidebarTab('agents')}
                    className="flex w-full items-center justify-between gap-2 px-2.5 py-1.5 text-left hover:bg-slate-800/50 first:rounded-t-2xl last:rounded-b-2xl transition-colors"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <AgentBadge agentId={ag.id} size="sm" />
                      <div className="min-w-0 truncate text-[11px]">
                        <span className="font-semibold text-slate-100">
                          {ag.name.charAt(0) + ag.name.slice(1).toLowerCase()}
                        </span>
                        <span className="text-slate-400"> — {ag.role}</span>
                      </div>
                    </div>
                    <span className="shrink-0 rounded-full bg-teal-500/15 px-2 py-0.5 font-mono text-[10px] text-teal-300">
                      Ready
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </>
        ) : (
          chatMessages.map((msg) => {
            const tokens = estimateTokenCount(msg.content);
            const cost = estimateCostUsd(
              msg.model || selectedModel,
              tokens,
              tokens
            );
            return (
              <div
                key={msg.id}
                className={`rounded-2xl border p-3 text-xs ${
                  msg.role === 'user'
                    ? 'border-blue-500/35 bg-blue-950/30 text-slate-100 ml-4'
                    : 'border-slate-700/45 bg-[#0f172a]/80 text-slate-200 mr-2'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] text-slate-400 mb-1.5">
                  <span className="font-semibold uppercase">
                    {msg.role === 'user' ? 'You' : msg.model || 'Gemini'}
                  </span>
                  <span className="font-mono tabular-nums">
                    ~{tokens} tok · ${cost.toFixed(5)}
                  </span>
                </div>
                {msg.content ? (
                  <div className="prose prose-invert prose-xs max-w-none leading-relaxed">
                    <Markdown remarkPlugins={[remarkGfm]}>{msg.content}</Markdown>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 text-slate-400">
                    <Loader2 className="h-3.5 w-3.5 animate-spin text-teal-400" />
                    <span>Streaming response...</span>
                  </div>
                )}
                {msg.groundingUrls && msg.groundingUrls.length > 0 && (
                  <div className="mt-2 pt-2 border-t border-slate-700/40 space-y-1">
                    <div className="text-[10px] font-semibold text-slate-400">
                      Sources
                    </div>
                    {msg.groundingUrls.slice(0, 4).map((g) => (
                      <a
                        key={g.uri}
                        href={g.uri}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="block truncate text-[11px] text-teal-400 hover:underline"
                      >
                        {g.title}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {error && (
        <div className="mx-3 mb-2 rounded-xl border border-red-500/40 bg-red-950/30 px-2.5 py-2 text-[11px] text-red-200">
          {error}
        </div>
      )}

      {/* Rounded Input Composer */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleSendPrompt(input, Date.now());
        }}
        className="border-t border-slate-700/40 p-3 bg-[#0B1220]/90"
      >
        <div className="rounded-2xl border border-slate-700/50 bg-[#0f172a]/80 p-2 space-y-2 focus-within:border-blue-500/60">
          <label htmlFor="gemini-chat-input" className="sr-only">
            Message Gemini
          </label>
          <textarea
            id="gemini-chat-input"
            rows={2}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendPrompt(input, Date.now());
              }
            }}
            placeholder="Ask Gemini anything..."
            className="w-full resize-none bg-transparent px-1.5 py-0.5 text-xs text-slate-100 placeholder:text-slate-500 focus:outline-none"
          />
          <div className="flex items-center justify-between gap-2">
            <button
              type="button"
              disabled={!input.trim() || streaming}
              onClick={async () => {
                const obj = input.trim();
                if (!obj) return;
                setInput('');
                await startMission(obj);
              }}
              className="inline-flex items-center gap-1 rounded-xl border border-slate-700/60 bg-slate-800/80 px-2.5 py-1 text-[11px] font-medium text-slate-200 hover:bg-slate-700 disabled:opacity-40"
            >
              <Rocket className="h-3 w-3 text-purple-400" />
              <span>Run as Mission</span>
            </button>

            {streaming ? (
              <button
                type="button"
                aria-label="Stop streaming"
                onClick={() => abortRef.current?.abort()}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-red-600 text-white hover:bg-red-500 shadow-sm"
              >
                <Square className="h-3.5 w-3.5" />
              </button>
            ) : (
              <button
                type="submit"
                aria-label="Send message to Gemini"
                disabled={!input.trim()}
                className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-blue-600 text-white hover:bg-blue-500 disabled:opacity-40 shadow-sm shadow-blue-600/30"
              >
                <Send className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </form>
    </div>
  );
}
