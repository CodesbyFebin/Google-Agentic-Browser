import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AuthRequiredError, requireAuthenticatedSession } from '@/lib/server/auth';
import {
  serverAppendActivityLog,
  serverRunOwnerQuery,
} from '@/lib/server/firestore';
import { checkRateLimit, redactSecrets } from '@/lib/security';

const CreateLogSchema = z.object({
  id: z.string().min(1).max(128).regex(/^[a-zA-Z0-9_-]+$/),
  missionId: z.string().max(128).optional(),
  agentId: z.string().max(64).optional(),
  eventType: z.string().min(1).max(64),
  summary: z.string().min(1).max(2000),
  status: z.string().min(1).max(32),
});

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuthenticatedSession(req);
    const rate = checkRateLimit(`fs-logs-get:${session.uid}`, 40, 60_000);
    if (!rate.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 });
    }

    const logs = await serverRunOwnerQuery(
      session.idToken,
      'activityLogs',
      session.uid,
      50
    );
    return NextResponse.json({ logs });
  } catch (err) {
    if (err instanceof AuthRequiredError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load activity logs.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuthenticatedSession(req);
    const rate = checkRateLimit(`fs-logs-post:${session.uid}`, 60, 60_000);
    if (!rate.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 });
    }

    const body = await req.json();
    const parsed = CreateLogSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid activity log payload.', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    await serverAppendActivityLog(session.idToken, session.uid, {
      ...parsed.data,
      summary: redactSecrets(parsed.data.summary),
    });
    return NextResponse.json({ ok: true, id: parsed.data.id });
  } catch (err) {
    if (err instanceof AuthRequiredError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to write activity log.' },
      { status: 500 }
    );
  }
}
