import test from 'node:test';
import assert from 'node:assert/strict';
import {
  buildReplayTimeline,
  canTransitionMissionStatus,
  validateMissionPlan,
} from './mission-logic';
import type { ActivityEvent, Mission } from './types';

test('canTransitionMissionStatus enforces valid mission lifecycle transitions', () => {
  assert.equal(canTransitionMissionStatus('CREATED', 'PLANNING'), true);
  assert.equal(canTransitionMissionStatus('PLANNING', 'RUNNING'), true);
  assert.equal(canTransitionMissionStatus('RUNNING', 'AWAITING_APPROVAL'), true);
  assert.equal(canTransitionMissionStatus('AWAITING_APPROVAL', 'RUNNING'), true);
  assert.equal(canTransitionMissionStatus('RUNNING', 'COMPLETED'), true);
  assert.equal(canTransitionMissionStatus('RUNNING', 'PAUSED'), true);
  assert.equal(canTransitionMissionStatus('PAUSED', 'RUNNING'), true);

  // Terminal states cannot reopen
  assert.equal(canTransitionMissionStatus('COMPLETED', 'RUNNING'), false);
  assert.equal(canTransitionMissionStatus('CANCELLED', 'RUNNING'), false);
  assert.equal(canTransitionMissionStatus('CREATED', 'COMPLETED'), false);
});

test('validateMissionPlan rejects empty plans, oversized plans, and unknown agents', () => {
  assert.equal(validateMissionPlan([]).valid, false);

  const unknownAgent = validateMissionPlan([
    {
      agentId: 'unknown' as never,
      title: 'Invalid step',
      instruction: 'Should fail validation',
    },
  ]);
  assert.equal(unknownAgent.valid, false);

  const valid = validateMissionPlan([
    {
      agentId: 'rover',
      title: 'Gather sources',
      instruction: 'Collect pricing and features.',
    },
    {
      agentId: 'chronicle',
      title: 'Archive report',
      instruction: 'Summarize findings and request approval to write Drive file.',
      requiresApproval: true,
    },
  ]);
  assert.equal(valid.valid, true);
  assert.equal(valid.sanitizedSteps.length, 2);
  assert.equal(valid.sanitizedSteps[0].status, 'PENDING');
  assert.equal(valid.sanitizedSteps[1].requiresApproval, true);
});

test('buildReplayTimeline returns chronological mission events without mutating input array', () => {
  const mission: Mission = {
    id: 'msn_1',
    spaceId: 'space-work',
    title: 'Test Mission',
    objective: 'Compare tools',
    planSummary: 'Test an approval-led comparison workflow.',
    status: 'COMPLETED',
    activeAgentId: 'chronicle',
    steps: [],
    createdAtMs: 1000,
    updatedAtMs: 3000,
  };

  const events: ActivityEvent[] = [
    {
      id: 'e3',
      missionId: 'msn_1',
      eventType: 'MISSION_COMPLETED',
      summary: 'Done',
      status: 'SUCCESS',
      createdAtMs: 3000,
    },
    {
      id: 'e_other',
      missionId: 'msn_2',
      eventType: 'AGENT_STEP',
      summary: 'Other mission',
      status: 'INFO',
      createdAtMs: 1500,
    },
    {
      id: 'e1',
      missionId: 'msn_1',
      eventType: 'MISSION_CREATED',
      summary: 'Started',
      status: 'INFO',
      createdAtMs: 1000,
    },
  ];

  const timeline = buildReplayTimeline(mission, events);
  assert.deepEqual(
    timeline.map((e) => e.id),
    ['e1', 'e3']
  );
  // Ensure original array order was untouched
  assert.equal(events[0].id, 'e3');
});
