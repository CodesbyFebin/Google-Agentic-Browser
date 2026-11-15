'use client';

import React from 'react';
import { Briefcase, Coins, Compass, Target, User } from 'lucide-react';
import { useBrowserState } from './BrowserStateProvider';
import type { SpaceSlug } from '@/lib/types';

const MOBILE_SPACES: {
  slug: SpaceSlug;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  { slug: 'work', label: 'Work', icon: Briefcase },
  { slug: 'money', label: 'Money', icon: Coins },
  { slug: 'personal', label: 'Personal', icon: User },
  { slug: 'research', label: 'Research', icon: Compass },
  { slug: 'focus', label: 'Focus', icon: Target },
];

export function MobileSpaceBar() {
  const { activeSpaceSlug, switchSpace, focusMode, zenMode } = useBrowserState();

  if (focusMode || zenMode) return null;

  return (
    <nav
      aria-label="Mobile Spaces switcher"
      className="flex lg:hidden items-center gap-1.5 overflow-x-auto border-b border-slate-700/40 bg-[#0B1220]/90 backdrop-blur-md px-3 py-1.5"
    >
      {MOBILE_SPACES.map((item) => {
        const Icon = item.icon;
        const active = activeSpaceSlug === item.slug;
        return (
          <button
            key={item.slug}
            type="button"
            onClick={() => switchSpace(item.slug)}
            aria-current={active ? 'page' : undefined}
            className={`inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium whitespace-nowrap shrink-0 ${
              active
                ? 'bg-blue-600/25 text-slate-100 ring-1 ring-blue-500/40'
                : 'text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
            }`}
          >
            <Icon className="h-3.5 w-3.5 text-blue-400" />
            <span>{item.label}</span>
          </button>
        );
      })}
    </nav>
  );
}
