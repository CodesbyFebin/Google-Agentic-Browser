export type SpaceSlug = 'work' | 'money' | 'personal' | 'research' | 'focus';

export type SplitLayout = 1 | 2 | 3 | 4;

export type SidebarTabId =
  | 'gemini'
  | 'studio'
  | 'agents'
  | 'money'
  | 'activity'
  | 'connect'
  | 'settings';

export type TabKind = 'app' | 'web' | 'workspace' | 'note' | 'report';

export interface BrowserTab {
  id: string;
  spaceId: string;
  title: string;
  url: string;
  kind: TabKind;
  pinned: boolean;
  paneIndex: number;
  summary?: string;
  extractedText?: string;
  isLoading?: boolean;
  error?: string | null;
  updatedAtMs: number;
}

export interface SpaceState {
  id: string;
  slug: SpaceSlug;
  name: string;
  description: string;
  splitLayout: SplitLayout;
  paneSplitRatio: number; // 25..75 percentage for primary split
  activePaneIndex: number;
  notes: string;
  history: string[];
}

export type CoreAgentId =
  | 'orion'
  | 'rover'
  | 'atlas'
  | 'aegis'
  | 'mercury'
  | 'chronicle';

export interface CoreAgentDefinition {
  id: CoreAgentId;
  name: string;
  role: string;
  tagline: string;
  accentColor: string;
  systemInstruction: string;
  allowedTools: string[];
  maxSteps: number;
  requiresApprovalFor: string[];
}

export type StudioTemplateId =
  | 'code'
  | 'data'
  | 'research'
  | 'image'
  | 'video'
  | 'build'
  | 'custom';

export interface CustomAgentConfig {
  id: string;
  name: string;
  template: StudioTemplateId;
  description: string;
  systemInstruction: string;
  model: string;
  tools: string[];
  inputSchemaDescription: string;
  outputSchemaDescription: string;
  requireApproval: boolean;
  maxSteps: number;
  updatedAtMs: number;
}

export interface AgentStudioExecutionLog {
  id: string;
  agentId: string;
  agentName: string;
  prompt: string;
  output: string;
  model: string;
  status: 'COMPLETED' | 'AWAITING_APPROVAL' | 'UNAVAILABLE' | 'ERROR';
  estimatedTokens: number;
  createdAtMs: number;
}

export type MissionStatus =
  | 'CREATED'
  | 'PLANNING'
  | 'RUNNING'
  | 'AWAITING_APPROVAL'
  | 'PAUSED'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export type MissionStepStatus =
  | 'PENDING'
  | 'RUNNING'
  | 'AWAITING_APPROVAL'
  | 'COMPLETED'
  | 'REJECTED'
  | 'FAILED';

export interface MissionStep {
  id: string;
  agentId: CoreAgentId;
  title: string;
  instruction: string;
  status: MissionStepStatus;
  output?: string;
  requiresApproval?: boolean;
  proposedAction?: ProposedActionPayload;
  startedAtMs?: number;
  completedAtMs?: number;
}

export type SensitiveActionType =
  | 'SPEND_MONEY_SIMULATED'
  | 'SEND_EMAIL'
  | 'CREATE_CALENDAR_EVENT'
  | 'WRITE_DRIVE_FILE'
  | 'UPDATE_GOOGLE_DOC'
  | 'DELETE_CONTENT'
  | 'PUBLISH_CONTENT'
  | 'SHARE_FILE';

export type RiskLevel = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export interface ProposedActionPayload {
  actionType: SensitiveActionType;
  title: string;
  reason: string;
  targetService: 'money_os' | 'gmail' | 'calendar' | 'drive' | 'docs' | 'chronicle';
  riskLevel: RiskLevel;
  estimatedCostUsd?: number;
  requiredScopes?: string[];
  parameters: Record<string, string | number | boolean>;
}

export type ApprovalStatus =
  | 'PENDING'
  | 'APPROVED'
  | 'REJECTED'
  | 'EXECUTED'
  | 'EXPIRED';

export interface ApprovalRequest {
  id: string;
  missionId: string;
  stepId: string;
  agentId: CoreAgentId | string;
  actionType: SensitiveActionType;
  title: string;
  reason: string;
  targetService: string;
  riskLevel: RiskLevel;
  estimatedCostUsd?: number;
  requiredScopes?: string[];
  parameters: Record<string, string | number | boolean>;
  status: ApprovalStatus;
  serverToken: string;
  payloadHash: string;
  expiresAtMs: number;
  createdAtMs: number;
  decidedAtMs?: number;
  executedAtMs?: number;
  decidedBy?: string;
  executionResult?: string;
}

export interface Mission {
  id: string;
  spaceId: string;
  title: string;
  objective: string;
  status: MissionStatus;
  activeAgentId: CoreAgentId;
  planSummary: string;
  steps: MissionStep[];
  finalReport?: string;
  error?: string;
  createdAtMs: number;
  updatedAtMs: number;
}

export interface ActivityEvent {
  id: string;
  missionId?: string;
  agentId?: string;
  eventType:
    | 'COMMAND'
    | 'MISSION_CREATED'
    | 'MISSION_PLANNED'
    | 'AGENT_STEP'
    | 'GEMINI_CALL'
    | 'TOOL_CALL'
    | 'APPROVAL_REQUESTED'
    | 'APPROVAL_APPROVED'
    | 'APPROVAL_REJECTED'
    | 'ACTION_EXECUTED'
    | 'WORKSPACE_API'
    | 'ERROR'
    | 'MISSION_COMPLETED';
  summary: string;
  detail?: string;
  status: 'INFO' | 'SUCCESS' | 'WARNING' | 'ERROR';
  createdAtMs: number;
}

export interface SavedReport {
  id: string;
  missionId?: string;
  title: string;
  content: string;
  createdAtMs: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  content: string;
  model?: string;
  estimatedTokens?: number;
  groundingUrls?: { title: string; uri: string }[];
  createdAtMs: number;
}

export interface SpendingPolicy {
  monthlyBudgetUsd: number;
  perTxLimitUsd: number;
  dailyLimitUsd: number;
  simulatedBalanceUsd: number;
  requireApprovalAboveUsd: number;
  realPaymentsEnabled: false; // Always false in prototype Simulation Mode
}

export interface SimulatedTransaction {
  id: string;
  approvalId: string;
  missionId?: string;
  merchant: string;
  description: string;
  amountUsd: number;
  isSimulated: true;
  createdAtMs: number;
}

export type WorkspaceServiceId = 'drive' | 'docs' | 'calendar' | 'gmail';

export interface WorkspaceConnectionState {
  service: WorkspaceServiceId;
  label: string;
  connected: boolean;
  scopes: string[];
  lastCheckedMs?: number;
  error?: string;
}

export interface BrowserSettings {
  defaultModel: string;
  defaultSplit: SplitLayout;
  compactDensity: boolean;
  autoSummarizeTabs: boolean;
  strictApprovalMode: boolean;
}
