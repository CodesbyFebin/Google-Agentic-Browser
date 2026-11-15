/** Minimal Google OAuth 2.0 PKCE session support (server-only). */
import 'server-only';
import { createCipheriv, createDecipheriv, createHash, randomBytes, timingSafeEqual } from 'node:crypto';
import type { NextRequest } from 'next/server';

export const GOOGLE_STATE_COOKIE = 'gab_oauth_state';
export const GOOGLE_VERIFIER_COOKIE = 'gab_oauth_pkce';
export const GOOGLE_SESSION_COOKIE = 'gab_google_session';
export const GOOGLE_SCOPES = [
  'openid', 'email', 'profile',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
] as const;

type GoogleSession = {
  accessToken: string;
  expiresAt: number;
  email?: string;
  scope: string;
};

export function googleOAuthConfigured(): boolean {
  return Boolean(
    process.env.GOOGLE_OAUTH_CLIENT_ID &&
    process.env.GOOGLE_OAUTH_CLIENT_SECRET &&
    process.env.GOOGLE_OAUTH_REDIRECT_URI &&
    sessionSecret(),
  );
}

function sessionSecret(): Buffer | undefined {
  const raw = process.env.GOOGLE_SESSION_SECRET;
  if (!raw) return undefined;
  const buffer = Buffer.from(raw, 'base64');
  return buffer.length === 32 ? buffer : undefined;
}

export function oauthCookieOptions(maxAge: number) {
  return {
    httpOnly: true as const,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
    maxAge,
  };
}

export function randomToken(): string {
  return randomBytes(32).toString('base64url');
}

export function pkceChallenge(verifier: string): string {
  return createHash('sha256').update(verifier).digest('base64url');
}

export function stateMatches(a: string, b: string): boolean {
  const aa = Buffer.from(a);
  const bb = Buffer.from(b);
  return aa.length === bb.length && timingSafeEqual(aa, bb);
}

export function encryptGoogleSession(session: GoogleSession): string {
  const key = sessionSecret();
  if (!key) throw new Error('GOOGLE_SESSION_SECRET must be a base64-encoded 32-byte key');
  const iv = randomBytes(12);
  const cipher = createCipheriv('aes-256-gcm', key, iv);
  const ciphertext = Buffer.concat([cipher.update(JSON.stringify(session)), cipher.final()]);
  return [iv, cipher.getAuthTag(), ciphertext].map(b => b.toString('base64url')).join('.');
}

export function getGoogleSession(req: NextRequest): GoogleSession | null {
  const key = sessionSecret();
  const raw = req.cookies.get(GOOGLE_SESSION_COOKIE)?.value;
  if (!key || !raw) return null;
  try {
    const parts = raw.split('.');
    if (parts.length !== 3) return null;
    const [iv, tag, data] = parts.map(s => Buffer.from(s, 'base64url'));
    const decipher = createDecipheriv('aes-256-gcm', key, iv);
    decipher.setAuthTag(tag);
    const session = JSON.parse(Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')) as GoogleSession;
    return session.expiresAt > Date.now() + 1000 && typeof session.accessToken === 'string'
      ? session : null;
  } catch {
    return null;
  }
}
