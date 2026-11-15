import { NextResponse } from 'next/server';
import { GOOGLE_SCOPES, GOOGLE_STATE_COOKIE, GOOGLE_VERIFIER_COOKIE, googleOAuthConfigured, oauthCookieOptions, pkceChallenge, randomToken } from '@/lib/google-oauth';

export const runtime = 'nodejs';

export async function GET() {
  if (!googleOAuthConfigured()) {
    return NextResponse.json({ error: 'Google OAuth is not configured. See .env.example.' }, { status: 503 });
  }
  const state = randomToken();
  const verifier = randomToken();
  const auth = new URL('https://accounts.google.com/o/oauth2/v2/auth');
  auth.searchParams.set('client_id', process.env.GOOGLE_OAUTH_CLIENT_ID!);
  auth.searchParams.set('redirect_uri', process.env.GOOGLE_OAUTH_REDIRECT_URI!);
  auth.searchParams.set('response_type', 'code');
  auth.searchParams.set('scope', GOOGLE_SCOPES.join(' '));
  auth.searchParams.set('state', state);
  auth.searchParams.set('code_challenge', pkceChallenge(verifier));
  auth.searchParams.set('code_challenge_method', 'S256');
  auth.searchParams.set('access_type', 'online'); // Do not request long-lived refresh tokens.
  const result = NextResponse.redirect(auth);
  result.cookies.set(GOOGLE_STATE_COOKIE, state, oauthCookieOptions(600));
  result.cookies.set(GOOGLE_VERIFIER_COOKIE, verifier, oauthCookieOptions(600));
  return result;
}
