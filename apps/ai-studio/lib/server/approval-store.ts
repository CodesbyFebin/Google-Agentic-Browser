import crypto from 'node:crypto';
import type {
  ApprovalRequest,
  ProposedActionPayload,
  RiskLevel,
} from '../types';

interface GlobalApprovalState {
  ephemeralSecret: string;
  executedApprovalIds: Set<string>;
  storedApprovals: Map<string, ApprovalRequest & { ownerId: string }>;
}

const globalForApproval = globalThis as unknown as {
  __gabApprovalState?: GlobalApprovalState;
};

function getGlobalState(): GlobalApprovalState {
  if (!globalForApproval.__gabApprovalState) {
    globalForApproval.__gabApprovalState = {
      ephemeralSecret: crypto.randomBytes(32).toString('hex'),
      executedApprovalIds: new Set<string>(),
      storedApprovals: new Map<string, ApprovalRequest & { ownerId: string }>(),
    };
  }
  return globalForApproval.__gabApprovalState;
}

function getSigningSecret(): string {
  const envSecret = process.env.GOOGLE_SESSION_SECRET?.trim();
  if (envSecret && envSecret.length >= 32 && envSecret !== 'CHANGE_ME_TO_A_RANDOM_32_BYTE_SECRET') {
    return envSecret;
  }
  if (process.env.NODE_ENV === 'production') {
    throw new Error('A 32+ character GOOGLE_SESSION_SECRET is required in production.');
  }
  return getGlobalState().ephemeralSecret;
}

export function computePayloadHash(
  actionType: string,
  targetService: string,
  parameters: Record<string, string | number | boolean>
): string {
  const canonical = JSON.stringify({
    actionType,
    targetService,
    parameters: Object.keys(parameters)
      .sort()
      .reduce<Record<string, string | number | boolean>>((acc, k) => {
        acc[k] = parameters[k];
        return acc;
      }, {}),
  });
  return crypto.createHash('sha256').update(canonical).digest('hex');
}

export function signApprovalToken(params: {
  id: string;
  ownerId: string;
  missionId: string;
  payloadHash: string;
  expiresAtMs: number;
}): string {
  const body = `${params.id}:${params.ownerId}:${params.missionId}:${params.payloadHash}:${params.expiresAtMs}`;
  return crypto
    .createHmac('sha256', getSigningSecret())
    .update(body)
    .digest('hex');
}

export function verifyApprovalSignature(
  approval: Pick<
    ApprovalRequest,
    'id' | 'missionId' | 'payloadHash' | 'expiresAtMs' | 'serverToken'
  >,
  ownerId: string
): boolean {
  const expected = signApprovalToken({
    id: approval.id,
    ownerId,
    missionId: approval.missionId,
    payloadHash: approval.payloadHash,
    expiresAtMs: approval.expiresAtMs,
  });
  const a = Buffer.from(approval.serverToken || '', 'utf8');
  const b = Buffer.from(expected, 'utf8');
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

// Server-side idempotency & state registry (prevents replay or double-execution)
const { executedApprovalIds, storedApprovals } = getGlobalState();

export function createServerApproval(params: {
  ownerId: string;
  missionId: string;
  stepId: string;
  agentId: string;
  action: ProposedActionPayload;
  riskLevel: RiskLevel;
  ttlMs?: number;
}): ApprovalRequest {
  const id = `apr_${crypto.randomBytes(8).toString('hex')}`;
  const now = Date.now();
  const expiresAtMs = now + (params.ttlMs ?? 15 * 60 * 1000);
  const payloadHash = computePayloadHash(
    params.action.actionType,
    params.action.targetService,
    params.action.parameters
  );
  const serverToken = signApprovalToken({
    id,
    ownerId: params.ownerId,
    missionId: params.missionId,
    payloadHash,
    expiresAtMs,
  });

  const record: ApprovalRequest = {
    id,
    missionId: params.missionId,
    stepId: params.stepId,
    agentId: params.agentId,
    actionType: params.action.actionType,
    title: params.action.title,
    reason: params.action.reason,
    targetService: params.action.targetService,
    riskLevel: params.riskLevel,
    estimatedCostUsd: params.action.estimatedCostUsd,
    requiredScopes: params.action.requiredScopes,
    parameters: params.action.parameters,
    status: 'PENDING',
    serverToken,
    payloadHash,
    expiresAtMs,
    createdAtMs: now,
  };

  storedApprovals.set(id, { ...record, ownerId: params.ownerId });
  return record;
}

export interface ApprovalValidationResult {
  ok: boolean;
  reason?: string;
  approval?: ApprovalRequest;
}

/**
 * Validates and atomically consumes a human approval decision.
 * Enforces: authenticity (HMAC), ownership, expiration, payload match, and one-time execution.
 */
export function validateAndConsumeApproval(params: {
  approval: ApprovalRequest;
  ownerId: string;
  decision: 'APPROVE' | 'REJECT';
  editedParameters?: Record<string, string | number | boolean>;
}): ApprovalValidationResult {
  const { approval, ownerId, decision } = params;

  if (executedApprovalIds.has(approval.id)) {
    return {
      ok: false,
      reason: 'Approval has already been consumed (one-time execution enforced).',
    };
  }

  const serverRecord = storedApprovals.get(approval.id);
  if (serverRecord) {
    if (serverRecord.ownerId !== ownerId) {
      return { ok: false, reason: 'Owner mismatch on approval request.' };
    }
    if (serverRecord.status !== 'PENDING') {
      return {
        ok: false,
        reason: `Approval is no longer pending (current status: ${serverRecord.status}).`,
      };
    }
  }

  if (approval.status !== 'PENDING') {
    return {
      ok: false,
      reason: `Cannot decide an approval in "${approval.status}" state.`,
    };
  }

  if (Date.now() > approval.expiresAtMs) {
    if (serverRecord) serverRecord.status = 'EXPIRED';
    return {
      ok: false,
      reason: 'Approval token has expired. Create a new checkpoint to proceed.',
    };
  }

  if (!verifyApprovalSignature(approval, ownerId)) {
    return {
      ok: false,
      reason: 'Server approval signature verification failed.',
    };
  }

  const expectedHash = computePayloadHash(
    approval.actionType,
    approval.targetService,
    approval.parameters
  );
  if (expectedHash !== approval.payloadHash) {
    return {
      ok: false,
      reason: 'Action parameters do not match the signed approval payload.',
    };
  }

  // Consume one-time execution lock
  executedApprovalIds.add(approval.id);
  const now = Date.now();

  if (decision === 'REJECT') {
    const rejected: ApprovalRequest = {
      ...approval,
      status: 'REJECTED',
      decidedAtMs: now,
      decidedBy: ownerId,
    };
    if (serverRecord) {
      storedApprovals.set(approval.id, { ...rejected, ownerId });
    }
    return { ok: true, approval: rejected };
  }

  // Approved: if user explicitly edited parameters during approval, recompute cleanly
  const finalParams = params.editedParameters ?? approval.parameters;
  const approved: ApprovalRequest = {
    ...approval,
    parameters: finalParams,
    status: 'EXECUTED',
    decidedAtMs: now,
    executedAtMs: now,
    decidedBy: ownerId,
  };
  if (serverRecord) {
    storedApprovals.set(approval.id, { ...approved, ownerId });
  }
  return { ok: true, approval: approved };
}
