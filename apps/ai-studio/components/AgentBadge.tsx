'use client';

import {
  Compass,
  Coins,
  FileCheck2,
  Network,
  ShieldCheck,
  Sparkles,
  Bot,
} from 'lucide-react';
import type { CoreAgentId } from '@/lib/types';

export function AgentBadge({
  agentId,
  size = 'md',
}: {
  agentId: CoreAgentId | string;
  size?: 'sm' | 'md' | 'lg';
}) {
  const dim =
    size === 'sm' ? 'h-6 w-6' : size === 'lg' ? 'h-10 w-10' : 'h-8 w-8';
  const iconSize =
    size === 'sm' ? 'h-3.5 w-3.5' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4';

  switch (agentId) {
    case 'orion':
      return (
        <span
          className={`inline-flex ${dim} shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500/25 to-violet-500/30 text-indigo-300 ring-1 ring-indigo-400/30`}
          aria-hidden="true"
        >
          <Sparkles className={iconSize} />
        </span>
      );
    case 'rover':
      return (
        <span
          className={`inline-flex ${dim} shrink-0 items-center justify-center rounded-lg bg-orange-500/20 text-orange-300 ring-1 ring-orange-400/30`}
          aria-hidden="true"
        >
          <Compass className={iconSize} />
        </span>
      );
    case 'atlas':
      return (
        <span
          className={`inline-flex ${dim} shrink-0 items-center justify-center rounded-lg bg-pink-500/20 text-pink-300 ring-1 ring-pink-400/30`}
          aria-hidden="true"
        >
          <Network className={iconSize} />
        </span>
      );
    case 'aegis':
      return (
        <span
          className={`inline-flex ${dim} shrink-0 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-300 ring-1 ring-cyan-400/30`}
          aria-hidden="true"
        >
          <ShieldCheck className={iconSize} />
        </span>
      );
    case 'mercury':
      return (
        <span
          className={`inline-flex ${dim} shrink-0 items-center justify-center rounded-lg bg-amber-500/20 text-amber-300 ring-1 ring-amber-400/30`}
          aria-hidden="true"
        >
          <Coins className={iconSize} />
        </span>
      );
    case 'chronicle':
      return (
        <span
          className={`inline-flex ${dim} shrink-0 items-center justify-center rounded-lg bg-emerald-500/20 text-emerald-300 ring-1 ring-emerald-400/30`}
          aria-hidden="true"
        >
          <FileCheck2 className={iconSize} />
        </span>
      );
    default:
      return (
        <span
          className={`inline-flex ${dim} shrink-0 items-center justify-center rounded-lg bg-slate-700/60 text-slate-300 ring-1 ring-slate-600/50`}
          aria-hidden="true"
        >
          <Bot className={iconSize} />
        </span>
      );
  }
}
