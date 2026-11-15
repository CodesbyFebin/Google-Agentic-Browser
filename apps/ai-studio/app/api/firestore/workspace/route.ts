import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { AuthRequiredError, requireAuthenticatedSession } from '@/lib/server/auth';
import {
  serverGetUserWorkspaceSnapshot,
  serverUpsertWorkspace,
} from '@/lib/server/firestore';
import { checkRateLimit } from '@/lib/security';

const WorkspaceUpdateSchema = z.object({
  name: z.string().min(1).max(80).optional(),
  activeSpaceSlug: z.enum(['work', 'money', 'personal', 'research', 'focus']),
  defaultModel: z.string().min(1).max(64),
  sidebarOpen: z.boolean(),
});

export async function GET(req: NextRequest) {
  try {
    const session = await requireAuthenticatedSession(req);
    const rate = checkRateLimit(`fs-ws-get:${session.uid}`, 40, 60_000);
    if (!rate.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 });
    }

    const snapshot = await serverGetUserWorkspaceSnapshot(
      session.idToken,
      session.uid
    );
    return NextResponse.json({
      uid: session.uid,
      ...snapshot,
    });
  } catch (err) {
    if (err instanceof AuthRequiredError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to load Firestore workspace.' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const session = await requireAuthenticatedSession(req);
    const rate = checkRateLimit(`fs-ws-post:${session.uid}`, 40, 60_000);
    if (!rate.allowed) {
      return NextResponse.json({ error: 'Rate limit exceeded.' }, { status: 429 });
    }

    const body = await req.json();
    const parsed = WorkspaceUpdateSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Invalid workspace payload.', details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const workspace = await serverUpsertWorkspace(
      session.idToken,
      session.uid,
      parsed.data
    );
    return NextResponse.json({ workspace });
  } catch (err) {
    if (err instanceof AuthRequiredError) {
      return NextResponse.json({ error: err.message }, { status: 401 });
    }
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Failed to save workspace to Firestore.' },
      { status: 500 }
    );
  }
}
