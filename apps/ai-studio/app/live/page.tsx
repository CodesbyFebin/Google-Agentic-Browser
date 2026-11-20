import { BrowserStateProvider } from '@/components/BrowserStateProvider';
import { LiveWorkspace } from '@/components/LiveWorkspace';

export const metadata = {
  title: 'Live Workspace | Agentic Browser',
  description: 'Authenticated live Google Workspace, Gemini, Firestore and GitHub data. No simulated results.',
};

export default function LivePage() {
  return <BrowserStateProvider><LiveWorkspace /></BrowserStateProvider>;
}
