import { NextRequest, NextResponse } from 'next/server';
import { firebaseWebConfig } from '@/lib/firebase-config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/** Verify a client Firebase ID token with Google's Identity Toolkit service.
 * This route never creates a privileged session, stores tokens, or exposes claims
 * supplied only by the browser. Account actions are not enabled.
 */
export async function GET(req: NextRequest) {
  const config = firebaseWebConfig();
  if (!config) return NextResponse.json({ error: 'Firebase Authentication is not configured.' }, { status: 503 });
  const authorization = req.headers.get('authorization') || '';
  const match = authorization.match(/^Bearer ([A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+)$/);
  if (!match || match[1].length > 8192) {
    return NextResponse.json({ error: 'A valid Firebase ID token is required.' }, { status: 401 });
  }
  try {
    const url = new URL('https://identitytoolkit.googleapis.com/v1/accounts:lookup');
    url.searchParams.set('key', config.apiKey);
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ idToken: match[1] }),
      signal: AbortSignal.timeout(8000),
      cache: 'no-store',
    });
    if (!response.ok) {
      return NextResponse.json({ error: 'Firebase ID token was rejected. Sign in again.' }, { status: 401 });
    }
    const result = await response.json() as { users?: Array<Record<string, unknown>> };
    const user = Array.isArray(result.users) ? result.users[0] : null;
    if (!user || user.disabled === true || typeof user.localId !== 'string' ||
        !/^[\w-]{1,128}$/.test(user.localId)) {
      return NextResponse.json({ error: 'The Firebase user is unavailable.' }, { status: 401 });
    }
    return NextResponse.json({
      authenticated: true,
      user: {
        uid: user.localId,
        email: typeof user.email === 'string' ? user.email.slice(0, 250) : null,
        emailVerified: user.emailVerified === true,
        displayName: typeof user.displayName === 'string' ? user.displayName.slice(0, 120) : null,
      },
    }, { headers: { 'Cache-Control': 'private, no-store' } });
  } catch {
    return NextResponse.json({ error: 'Firebase Authentication could not be reached.' }, { status: 502 });
  }
}
