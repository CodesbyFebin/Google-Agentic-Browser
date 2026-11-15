import { WorkspaceNavigation } from "@/components/browser/workspace-navigation";

export default function AgentsEditionLayout({ children }: { children: React.ReactNode }) {
  return <><WorkspaceNavigation />{children}</>;
}
