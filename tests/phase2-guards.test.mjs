import assert from 'node:assert/strict';
import test from 'node:test';
import { actionHash, canonicalActionPayload, assertApprovalTransition } from '../src/lib/approvals/state.ts';
import { getToolClass, isReadOnlyTool, isProtectedActionTool, isToolEnabled } from '../src/lib/agents/tools.ts';

const now = new Date('2026-11-15T10:00:00Z');
const future = new Date('2026-11-15T10:10:00Z');
const hash = actionHash('workspace_gmail_send', { to: 'x@example.com', body: 'hello' });
const pending = {
  ownerId: 'human-1', toolName: 'workspace_gmail_send',
  actionHash: hash, status: 'PENDING', expiresAt: future, idempotencyKey: 'single-use-1',
};

test('hash is canonical, deterministic, and binds the tool and action payload', () => {
  assert.equal(hash, actionHash('workspace_gmail_send', { body: 'hello', to: 'x@example.com' }));
  assert.notEqual(hash, actionHash('workspace_gmail_send', { to: 'x@example.com', body: 'changed' }));
  assert.notEqual(hash, actionHash('workspace_docs_create', { to: 'x@example.com', body: 'hello' }));
  assert.equal(canonicalActionPayload({ b: 1, a: [2, 3] }), '{"a":[2,3],"b":1}');
  assert.throws(() => canonicalActionPayload({ secret: undefined }));
});

test('write tools are never read-only; disabled tools never become executors', () => {
  assert.equal(getToolClass('save_note'), 'INTERNAL_WRITE');
  assert.equal(isReadOnlyTool('save_note'), false);
  assert.equal(isProtectedActionTool('workspace_gmail_send'), true);
  assert.equal(isToolEnabled('workspace_gmail_send'), false);
  assert.equal(isToolEnabled('fetch_webpage'), false);
  assert.equal(getToolClass('nonexistent_tool'), null);
});

test('approval must be authenticated, unexpired, hash-bound and single-use', () => {
  const owner = { actorId: 'human-1', expectedHash: hash, now };
  assert.doesNotThrow(() => assertApprovalTransition(pending, 'APPROVED', owner));
  assert.throws(() => assertApprovalTransition(pending, 'APPROVED', { ...owner, actorId: 'agent' }));
  assert.throws(() => assertApprovalTransition(pending, 'APPROVED', { ...owner, expectedHash: 'wrong' }));
  assert.throws(() => assertApprovalTransition(pending, 'APPROVED', { ...owner, now: future }));
  assert.throws(() => assertApprovalTransition(pending, 'EXECUTING', owner));
  const approved = { ...pending, status: 'APPROVED', approvedById: 'human-1' };
  assert.doesNotThrow(() => assertApprovalTransition(approved, 'EXECUTING', { ...owner, idempotencyKey: 'single-use-1' }));
  assert.throws(() => assertApprovalTransition(approved, 'EXECUTING', { ...owner, idempotencyKey: 'wrong' }));
  assert.throws(() => assertApprovalTransition({ ...approved, status: 'EXECUTING' }, 'EXECUTING', { ...owner, idempotencyKey: 'single-use-1' }));
  assert.doesNotThrow(() => assertApprovalTransition({ ...approved, status: 'EXECUTING' }, 'EXECUTION_FAILED', { ...owner, idempotencyKey: 'single-use-1' }));
  assert.throws(() => assertApprovalTransition({ ...approved, status: 'EXECUTED' }, 'EXECUTED', { ...owner, idempotencyKey: 'single-use-1' }));
});
