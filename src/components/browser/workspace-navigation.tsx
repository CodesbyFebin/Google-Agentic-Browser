import Link from "next/link";

const destinations = [
  ["✦", "Unified Browser", "/"],
  ["◈", "Money OS", "/money"],
  ["◉", "Guardian", "/guardian"],
  ["🦄", "Mission Lab", "/mission"],
  ["⟡", "Agents Edition", "/agents-edition"],
  ["▣", "Classic Browser", "/classic"],
] as const;

export function WorkspaceNavigation() {
  return (
    <nav aria-label="Google Agentic Browser workspaces" className="sticky top-0 z-50 flex items-center gap-2 overflow-x-auto border-b border-white/10 bg-[#090e1f]/95 px-3 py-2 text-xs text-white backdrop-blur-xl sm:px-5">
      <span className="mr-2 hidden shrink-0 font-bold tracking-tight sm:inline">Google Agentic Browser <span className="font-normal opacity-60">· independent concept</span></span>
      {destinations.map(([icon, label, href]) => (
        <Link key={href} href={href} className="shrink-0 whitespace-nowrap rounded-full border border-white/15 bg-white/5 px-3 py-2 font-medium transition hover:bg-blue-500/25">
          <span aria-hidden="true">{icon}</span> {label}
        </Link>
      ))}
    </nav>
  );
}
