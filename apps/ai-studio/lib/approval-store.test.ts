import test from 'node:test';
import assert from 'node:assert/strict';
import {
  createServerApproval,
  validateAndConsumeApproval,
  verifyApprovalSignature,
} from './server/approval-store';

test('server approval enforces signature, owner match, payload integrity, and one-time execution', () => {
  const approval = createServerApproval({
    ownerId: 'user_alice',
    missionId: 'msn_test_1',
    stepId: 'step-1',
    agentId: 'mercury',
    riskLevel: 'HIGH',
    action: {
      actionType: 'SPEND_MONEY_SIMULATED',
      title: 'Simulated SaaS Seat',
      reason: 'Procurement check',
      targetService: 'money_os',
      riskLevel: 'HIGH',
      estimatedCostUsd: 29,
      parameters: { merchant: 'Linear', amountUsd: 29 },
    },
  });

  assert.equal(verifyApprovalSignature(approval, 'user_alice'), true);
  assert.equal(verifyApprovalSignature(approval, 'user_bob'), false);

  // Wrong owner must fail
  const wrongOwner = validateAndConsumeApproval({
    approval,
    ownerId: 'user_bob',
    decision: 'APPROVE',
  });
  assert.equal(wrongOwner.ok, false);

  // Tampered payload parameters must fail
  const tampered = validateAndConsumeApproval({
    approval: {
      ...approval,
      parameters: { merchant: 'EvilVendor', amountUsd: 9999 },
    },
    ownerId: 'user_alice',
    decision: 'APPROVE',
  });
  assert.equal(tampered.ok, false);

  // Valid approval executes once
  const firstApprove = validateAndConsumeApproval({
    approval,
    ownerId: 'user_alice',
    decision: 'APPROVE',
  });
  assert.equal(firstApprove.ok, true);
  assert.equal(firstApprove.approval?.status, 'EXECUTED');

  // Replaying same approval ID must fail (one-time enforcement)
  const replayApprove = validateAndConsumeApproval({
    approval,
    ownerId: 'user_alice',
    decision: 'APPROVE',
  });
  assert.equal(replayApprove.ok, false);
});

test('rejected or expired approvals never execute', () => {
  const rejectTarget = createServerApproval({
    ownerId: 'user_alice',
    missionId: 'msn_reject',
    stepId: 'step-2',
    agentId: 'orion',
    riskLevel: 'HIGH',
    action: {
      actionType: 'SEND_EMAIL',
      title: 'Send summary email',
      reason: 'User test',
      targetService: 'gmail',
      riskLevel: 'HIGH',
      parameters: { to: 'team@example.com', subject: 'Hello' },
    },
  });

  const rejected = validateAndConsumeApproval({
    approval: rejectTarget,
    ownerId: 'user_alice',
    decision: 'REJECT',
  });
  assert.equal(rejected.ok, true);
  assert.equal(rejected.approval?.status, 'REJECTED');
  assert.equal(rejected.approval?.executedAtMs, undefined);

  // Cannot later approve after rejection
  const afterReject = validateAndConsumeApproval({
    approval: rejectTarget,
    ownerId: 'user_alice',
    decision: 'APPROVE',
  });
  assert.equal(afterReject.ok, false);

  // Expired approval must fail
  const expiredTarget = createServerApproval({
    ownerId: 'user_alice',
    missionId: 'msn_expired',
    stepId: 'step-3',
    agentId: 'mercury',
    riskLevel: 'MEDIUM',
    ttlMs: -5000,
    action: {
      actionType: 'WRITE_DRIVE_FILE',
      title: 'Write Drive report',
      reason: 'Archive findings',
      targetService: 'drive',
      riskLevel: 'MEDIUM',
      parameters: { fileName: 'report.md' },
    },
  });

  const expiredRes = validateAndConsumeApproval({
    approval: expiredTarget,
    ownerId: 'user_alice',
    decision: 'APPROVE',
  });
  assert.equal(expiredRes.ok, false);
});
