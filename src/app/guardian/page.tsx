"use client";

import Guardian from "@/components/guardian/App";
import { WorkspaceNavigation } from "@/components/browser/workspace-navigation";

export default function GuardianPage() {
  return (
    <div className="guardian-shell min-h-screen" style={{
      "--bg": "#0b0e14", "--surface": "#12161f", "--line": "rgba(255,255,255,.09)",
      "--text": "#eef1f6", "--muted": "#9aa3b2", "--accent": "#4285f4",
    } as React.CSSProperties}>
      <WorkspaceNavigation />
      <Guardian />
    </div>
  );
}
