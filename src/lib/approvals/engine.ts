/** Durable, internal-only approval lifecycle. There are deliberately NO HTTP endpoints or executors. */
import 'server-only';
import { randomUUID } from 'node:crypto';
import { db } from '@/lib/db';
import { actionHash, assertApprovalTransition, canonicalActionPayload, type ApprovalRecord, type ApprovalStatus } from './state';
import { getToolClass } from '@/lib/agents/tools';

function record(row: {
  ownerId: string; approvedById: string | null; toolName: string;
  actionHash: string; status: string; expiresAt: Date; idempotencyKey: string;
}): ApprovalRecord {
  return { ...row, status: row.status as ApprovalStatus };
}

export async function proposeProtectedAction(params: {
  ownerId: string; toolName: string; payload: unknown; ttlMs?: number;
}) {
  if (!params.ownerId.trim()) throw new Error('Authenticated owner required.');
  if (getToolClass(params.toolName) !== 'APPROVAL_REQUIRED_WRITE') {
    throw new Error('Only protected tools can request external-action approval.');
  }
  const ttlMs = params.ttlMs ?? 10 * 60_000;
  if (ttlMs < 1000 || ttlMs > 30 * 60_000) throw new Error('Invalid approval expiry.');
  const payloadJson = canonicalActionPayload(params.payload);
  if (payloadJson.length > 20_000) throw new Error('Action payload too large.');
  return db.actionApproval.create({
    data: {
      ownerId: params.ownerId,
      toolName: params.toolName,
      payloadJson,
      actionHash: actionHash(params.toolName, params.payload),
      status: 'PENDING',
      expiresAt: new Date(Date.now() + ttlMs),
      idempotencyKey: randomUUID(),
    },
  });
}

/** Call only after server-side identity verification; never trust an AI-supplied actorId. */
export async function decideProtectedAction(params: {
  approvalId: string; authenticatedOwnerId: string; expectedHash: string; approve: boolean;
}) {
  return db.$transaction(async tx => {
    const row = await tx.actionApproval.findUnique({ where: { id: params.approvalId } });
    if (!row) throw new Error('Approval not found.');
    const target = params.approve ? 'APPROVED' : 'DENIED';
    assertApprovalTransition(record(row), target, {
      actorId: params.authenticatedOwnerId, expectedHash: params.expectedHash,
    });
    const updated = await tx.actionApproval.updateMany({
      where: { id: row.id, ownerId: params.authenticatedOwnerId, status: 'PENDING', actionHash: params.expectedHash },
      data: { status: target, approvedById: params.approve ? params.authenticatedOwnerId : null },
    });
    if (updated.count !== 1) throw new Error('Approval was already decided.');
    return target;
  });
}

/** Single-use atomic claim. No provider call is made here. */
export async function claimApprovedAction(params: {
  approvalId: string; authenticatedOwnerId: string; expectedHash: string; idempotencyKey: string;
}) {
  return db.$transaction(async tx => {
    const row = await tx.actionApproval.findUnique({ where: { id: params.approvalId } });
    if (!row) throw new Error('Approval not found.');
    assertApprovalTransition(record(row), 'EXECUTING', {
      actorId: params.authenticatedOwnerId,
      expectedHash: params.expectedHash,
      idempotencyKey: params.idempotencyKey,
    });
    const updated = await tx.actionApproval.updateMany({
      where: {
        id: row.id, ownerId: params.authenticatedOwnerId,
        approvedById: params.authenticatedOwnerId,
        actionHash: params.expectedHash, status: 'APPROVED',
        expiresAt: { gt: new Date() }, idempotencyKey: params.idempotencyKey,
      },
      data: { status: 'EXECUTING', executionStartedAt: new Date() },
    });
    if (updated.count !== 1) throw new Error('Action was claimed or expired.');
    return { payload: JSON.parse(row.payloadJson) as unknown, toolName: row.toolName, idempotencyKey: row.idempotencyKey };
  });
}

/** Only an authenticated, trusted server executor may call this after provider reconciliation. */
export async function settleClaimedAction(params: {
  approvalId: string; authenticatedOwnerId: string; expectedHash: string;
  idempotencyKey: string; succeeded: boolean; failureReason?: string;
}) {
  const row = await db.actionApproval.findUnique({ where: { id: params.approvalId } });
  if (!row) throw new Error('Approval not found.');
  const target = params.succeeded ? 'EXECUTED' : 'EXECUTION_FAILED';
  assertApprovalTransition(record(row), target, {
    actorId: params.authenticatedOwnerId,
    expectedHash: params.expectedHash,
    idempotencyKey: params.idempotencyKey,
  });
  const updated = await db.actionApproval.updateMany({
    where: {
      id: row.id, ownerId: params.authenticatedOwnerId,
      status: 'EXECUTING', actionHash: params.expectedHash, idempotencyKey: params.idempotencyKey,
    },
    data: params.succeeded
      ? { status: target, executedAt: new Date() }
      : { status: target, failedAt: new Date(), failureReason: (params.failureReason || 'Provider execution failed').slice(0, 300) },
  });
  if (updated.count !== 1) throw new Error('Action already settled.');
  return target;
}
