import type {
  ActivityEvent,
  CoreAgentId,
  Mission,
  MissionStatus,
  MissionStep,
  ProposedActionPayload,
} from './types';

const ALLOWED_TRANSITIONS: Record<MissionStatus, MissionStatus[]> = {
  CREATED: ['PLANNING', 'CANCELLED', 'FAILED'],
  PLANNING: ['RUNNING', 'AWAITING_APPROVAL', 'PAUSED', 'FAILED', 'CANCELLED'],
  RUNNING: ['RUNNING', 'AWAITING_APPROVAL', 'PAUSED', 'COMPLETED', 'FAILED', 'CANCELLED'],
  AWAITING_APPROVAL: ['RUNNING', 'PAUSED', 'COMPLETED', 'FAILED', 'CANCELLED'],
  PAUSED: ['RUNNING', 'AWAITING_APPROVAL', 'CANCELLED', 'FAILED'],
  COMPLETED: [],
  FAILED: ['RUNNING', 'CANCELLED'],
  CANCELLED: [],
};

export function canTransitionMissionStatus(
  from: MissionStatus,
  to: MissionStatus
): boolean {
  return ALLOWED_TRANSITIONS[from]?.includes(to) ?? false;
}

export interface PlannedStepInput {
  agentId: CoreAgentId;
  title: string;
  instruction: string;
  requiresApproval?: boolean;
  proposedAction?: ProposedActionPayload;
}

const VALID_AGENTS = new Set<CoreAgentId>([
  'orion',
  'rover',
  'atlas',
  'aegis',
  'mercury',
  'chronicle',
]);

export function validateMissionPlan(
  steps: PlannedStepInput[]
): { valid: boolean; reason?: string; sanitizedSteps: MissionStep[] } {
  if (!Array.isArray(steps) || steps.length === 0) {
    return {
      valid: false,
      reason: 'Mission plan must include at least one step.',
      sanitizedSteps: [],
    };
  }
  if (steps.length > 10) {
    return {
      valid: false,
      reason: 'Mission plan cannot exceed 10 steps.',
      sanitizedSteps: [],
    };
  }

  const sanitizedSteps: MissionStep[] = [];
  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    if (!VALID_AGENTS.has(step.agentId)) {
      return {
        valid: false,
        reason: `Unknown agent "${String(step.agentId)}" in step ${i + 1}.`,
        sanitizedSteps: [],
      };
    }
    const title = (step.title || '').trim().slice(0, 180);
    const instruction = (step.instruction || '').trim().slice(0, 2000);
    if (!title || !instruction) {
      return {
        valid: false,
        reason: `Step ${i + 1} is missing a title or instruction.`,
        sanitizedSteps: [],
      };
    }
    sanitizedSteps.push({
      id: `step-${i + 1}-${step.agentId}`,
      agentId: step.agentId,
      title,
      instruction,
      status: 'PENDING',
      requiresApproval: Boolean(step.requiresApproval || step.proposedAction),
      proposedAction: step.proposedAction,
    });
  }

  return { valid: true, sanitizedSteps };
}

export function buildReplayTimeline(
  mission: Mission | null,
  events: ActivityEvent[]
): ActivityEvent[] {
  const filtered = mission
    ? events.filter((ev) => !ev.missionId || ev.missionId === mission.id)
    : events;
  return [...filtered].sort((a, b) => a.createdAtMs - b.createdAtMs);
}
