import { NextRequest, NextResponse } from 'next/server';
import { encryptGoogleSession, GOOGLE_SESSION_COOKIE, GOOGLE_STATE_COOKIE, GOOGLE_VERIFIER_COOKIE, googleOAuthConfigured, oauthCookieOptions, stateMatches } from '@/lib/google-oauth';

export const runtime = 'nodejs';

export async function GET(req: NextRequest) {
  const safeUrl = new URL('/', req.url);
  const fail = (reason: string) => {
    safeUrl.searchParams.set('google_error', reason);
    const response = NextResponse.redirect(safeUrl);
    response.cookies.delete(GOOGLE_STATE_COOKIE);
    response.cookies.delete(GOOGLE_VERIFIER_COOKIE);
    return response;
  };
  if (!googleOAuthConfigured()) return fail('configuration');
  const code = req.nextUrl.searchParams.get('code');
  const receivedState = req.nextUrl.searchParams.get('state') || '';
  const storedState = req.cookies.get(GOOGLE_STATE_COOKIE)?.value || '';
  const verifier = req.cookies.get(GOOGLE_VERIFIER_COOKIE)?.value || '';
  if (req.nextUrl.searchParams.has('error')) return fail('access_denied');
  if (!code || !storedState || !verifier || !stateMatches(receivedState, storedState)) return fail('state');
  try {
    const response = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_OAUTH_CLIENT_ID!,
        client_secret: process.env.GOOGLE_OAUTH_CLIENT_SECRET!,
        redirect_uri: process.env.GOOGLE_OAUTH_REDIRECT_URI!,
        grant_type: 'authorization_code',
        code_verifier: verifier,
      }),
      cache: 'no-store',
    });
    if (!response.ok) return fail('exchange');
    const tokens = await response.json();
    if (typeof tokens.access_token !== 'string') return fail('exchange');
    const userResponse = await fetch('https://openidconnect.googleapis.com/v1/userinfo', {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
      cache: 'no-store',
    });
    const user = userResponse.ok ? await userResponse.json() : {};
    const expiry = Math.min(Math.max(Number(tokens.expires_in) || 3600, 60), 3600);
    const encrypted = encryptGoogleSession({
      accessToken: tokens.access_token,
      expiresAt: Date.now() + expiry * 1000,
      email: typeof user.email === 'string' ? user.email : undefined,
      scope: String(tokens.scope || ''),
    });
    safeUrl.searchParams.set('google_connected', '1');
    const result = NextResponse.redirect(safeUrl);
    result.cookies.set(GOOGLE_SESSION_COOKIE, encrypted, oauthCookieOptions(expiry));
    result.cookies.delete(GOOGLE_STATE_COOKIE);
    result.cookies.delete(GOOGLE_VERIFIER_COOKIE);
    return result;
  } catch {
    return fail('connection');
  }
}
