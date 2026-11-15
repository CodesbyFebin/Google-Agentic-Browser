"use client";

import MissionLab from "@/components/mission/App";
import { WorkspaceNavigation } from "@/components/browser/workspace-navigation";

export default function MissionPage() {
  return (
    <div className="mission-shell min-h-screen" style={{
      "--bg": "#070913", "--panel": "rgba(255,255,255,.06)", "--line": "rgba(255,255,255,.12)",
      "--text": "#f4f5ff", "--muted": "#9aa0bc", "--accent": "#4285f4", "--accent2": "#34a853",
      "--glow": "rgba(66,133,244,.42)", "--card": "#131a2a",
    } as React.CSSProperties}>
      <WorkspaceNavigation />
      <MissionLab />
    </div>
  );
}
