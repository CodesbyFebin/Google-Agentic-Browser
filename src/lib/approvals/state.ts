/** Pure approval policy and hashing. No model-generated text can authorize an action. */
import { createHash } from 'node:crypto';

export type ApprovalStatus = 'PENDING' | 'APPROVED' | 'DENIED' | 'EXPIRED'
  | 'EXECUTING' | 'EXECUTED' | 'EXECUTION_FAILED';

export type ApprovalRecord = {
  ownerId: string;
  approvedById?: string | null;
  toolName: string;
  actionHash: string;
  status: ApprovalStatus;
  expiresAt: Date;
  idempotencyKey: string;
};

function canonical(value: unknown): string {
  if (value === null || typeof value === 'string' || typeof value === 'boolean') return JSON.stringify(value);
  if (typeof value === 'number' && Number.isFinite(value)) return JSON.stringify(value);
  if (Array.isArray(value)) return '[' + value.map(canonical).join(',') + ']';
  if (value && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype) {
    const record = value as Record<string, unknown>;
    return '{' + Object.keys(record).sort().map(key => JSON.stringify(key) + ':' + canonical(record[key])).join(',') + '}';
  }
  throw new Error('Action payload must contain only JSON-safe values.');
}

export function canonicalActionPayload(payload: unknown): string {
  return canonical(payload);
}

export function actionHash(toolName: string, payload: unknown): string {
  if (!/^[a-z][a-z0-9_]{1,79}$/.test(toolName)) throw new Error('Invalid tool name.');
  return createHash('sha256').update(toolName + '\n' + canonical(payload)).digest('hex');
}

export function assertApprovalTransition(
  record: ApprovalRecord,
  target: ApprovalStatus,
  context: { actorId: string; expectedHash: string; now?: Date; idempotencyKey?: string },
): void {
  const now = context.now ?? new Date();
  if (!context.actorId || record.ownerId !== context.actorId) throw new Error('Approval identity mismatch.');
  if (record.actionHash !== context.expectedHash) throw new Error('Approved action payload mismatch.');
  if (now >= record.expiresAt && (target === 'APPROVED' || target === 'EXECUTING')) {
    throw new Error('Approval has expired.');
  }
  const valid: Record<ApprovalStatus, ApprovalStatus[]> = {
    PENDING: ['APPROVED', 'DENIED', 'EXPIRED'],
    APPROVED: ['EXECUTING', 'EXPIRED'],
    EXECUTING: ['EXECUTED', 'EXECUTION_FAILED'],
    DENIED: [], EXPIRED: [], EXECUTED: [], EXECUTION_FAILED: [],
  };
  if (!valid[record.status].includes(target)) throw new Error('Invalid or repeated approval transition.');
  if (target === 'EXECUTING' && record.approvedById !== context.actorId) {
    throw new Error('An authenticated human must approve this action.');
  }
  if (['EXECUTING', 'EXECUTED', 'EXECUTION_FAILED'].includes(target)
      && context.idempotencyKey !== record.idempotencyKey) {
    throw new Error('Idempotency key mismatch.');
  }
}
