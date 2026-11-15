import assert from 'node:assert/strict';
import { test } from 'node:test';
import { NextRequest } from 'next/server';
import { GeminiServiceError, requireGeminiSession } from './gemini';
import { POST as runMissionStep } from '../../app/api/missions/step/route';

const testRequest = () => new NextRequest('http://localhost:3000/api/ai/chat', {
  method: 'POST',
  headers: { 'x-client-session': 'local-dev-check' },
});

test('a missing Firebase ID token cannot spend Gemini quota by default', async () => {
  const previous = process.env.GEMINI_ALLOW_GUEST_DEV;
  try {
    delete process.env.GEMINI_ALLOW_GUEST_DEV;
    await assert.rejects(requireGeminiSession(testRequest()), (error: unknown) => {
      assert.ok(error instanceof GeminiServiceError);
      assert.equal(error.code, 'AUTH_REQUIRED');
      assert.equal(error.status, 401);
      return true;
    });
  } finally {
    if (previous === undefined) delete process.env.GEMINI_ALLOW_GUEST_DEV;
    else process.env.GEMINI_ALLOW_GUEST_DEV = previous;
  }
});

test('guests are allowed only when development has explicitly opted in', async () => {
  const previous = process.env.GEMINI_ALLOW_GUEST_DEV;
  try {
    process.env.GEMINI_ALLOW_GUEST_DEV = 'true';
    const session = await requireGeminiSession(testRequest());
    assert.equal(session.authenticated, false);
    assert.equal(session.isDemoSession, true);
  } finally {
    if (previous === undefined) delete process.env.GEMINI_ALLOW_GUEST_DEV;
    else process.env.GEMINI_ALLOW_GUEST_DEV = previous;
  }
});

test('mission execution endpoint denies anonymous requests before invoking Gemini', async () => {
  const previous = process.env.GEMINI_ALLOW_GUEST_DEV;
  try {
    delete process.env.GEMINI_ALLOW_GUEST_DEV;
    const response = await runMissionStep(new NextRequest('http://localhost:3000/api/missions/step', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        missionId: 'mission-secure',
        objective: 'Research a product',
        step: { id: 'step-1', agentId: 'orion', title: 'Plan research', instruction: 'Draft a plan' },
      }),
    }));
    assert.equal(response.status, 401);
    assert.equal((await response.json()).code, 'AUTH_REQUIRED');
  } finally {
    if (previous === undefined) delete process.env.GEMINI_ALLOW_GUEST_DEV;
    else process.env.GEMINI_ALLOW_GUEST_DEV = previous;
  }
});
