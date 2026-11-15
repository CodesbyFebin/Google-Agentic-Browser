import React from 'react';
import { BrowserStateProvider } from '@/components/BrowserStateProvider';
import { TopToolbar } from '@/components/TopToolbar';
import { SpacesSidebar } from '@/components/SpacesSidebar';
import { MobileSpaceBar } from '@/components/MobileSpaceBar';
import { CenterWorkspace } from '@/components/CenterWorkspace';
import { RightSidebar } from '@/components/RightSidebar';
import { CommandPalette } from '@/components/CommandPalette';
import { FeatureDiscoveryModal } from '@/components/FeatureDiscoveryModal';

export default function HomePage() {
  return (
    <BrowserStateProvider>
      <div className="flex h-dvh w-screen flex-col overflow-hidden bg-[#0B1220] text-slate-100">
        <TopToolbar />
        <MobileSpaceBar />

        <div className="flex flex-1 min-h-0 overflow-hidden">
          <SpacesSidebar />
          <CenterWorkspace />
          <RightSidebar />
        </div>

        <footer className="flex items-center justify-between border-t border-slate-700/40 bg-[#0B1220]/90 backdrop-blur-md px-3.5 py-1.5 text-[11px] text-slate-400">
          <span className="truncate font-medium text-slate-300">
            Google Agentic Browser · The Browser That Does — With Your Approval
          </span>
          <span className="hidden sm:inline shrink-0 text-slate-500">
            Independent Concept Prototype · Not an official Google product
          </span>
        </footer>

        <CommandPalette />
        <FeatureDiscoveryModal />
      </div>
    </BrowserStateProvider>
  );
}
