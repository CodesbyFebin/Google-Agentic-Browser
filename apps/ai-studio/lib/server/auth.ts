import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { NextRequest } from 'next/server';
import firebaseConfig from '../../firebase-applet-config.json';

const FIREBASE_JWKS = createRemoteJWKSet(
  new URL(
    'https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com'
  )
);

export interface VerifiedSession {
  authenticated: boolean;
  uid: string;
  email?: string;
  emailVerified?: boolean;
  isDemoSession: boolean;
  idToken?: string;
}

export function extractFirebaseIdToken(req: NextRequest): string | null {
  return (
    req.headers.get('x-firebase-token') ??
    extractBearer(req.headers.get('authorization'))
  );
}

/**
 * Verifies a Firebase Auth ID Token sent via `x-firebase-token` or `Authorization: Bearer <token>`.
 * When unauthenticated, returns an explicit non-privileged local session identifier.
 */
export async function verifyRequestSession(
  req: NextRequest
): Promise<VerifiedSession> {
  const headerToken = extractFirebaseIdToken(req);

  if (!headerToken) {
    const guestId = sanitizeSessionId(
      req.headers.get('x-client-session') || 'local-guest'
    );
    return {
      authenticated: false,
      uid: `guest_${guestId}`,
      isDemoSession: true,
    };
  }

  try {
    const projectId = firebaseConfig.projectId;
    const { payload } = await jwtVerify(headerToken, FIREBASE_JWKS, {
      issuer: `https://securetoken.google.com/${projectId}`,
      audience: projectId,
    });

    const uid = typeof payload.sub === 'string' ? payload.sub : '';
    if (!uid) {
      throw new Error('Missing subject claim in Firebase token');
    }

    return {
      authenticated: true,
      uid,
      email: typeof payload.email === 'string' ? payload.email : undefined,
      emailVerified: Boolean(payload.email_verified),
      isDemoSession: false,
      idToken: headerToken,
    };
  } catch {
    const guestId = sanitizeSessionId(
      req.headers.get('x-client-session') || 'local-guest'
    );
    return {
      authenticated: false,
      uid: `guest_${guestId}`,
      isDemoSession: true,
    };
  }
}

/**
 * Enforces an authenticated Firebase session for protected routes.
 * Throws AuthRequiredError (401) if no valid verified token is provided.
 */
export class AuthRequiredError extends Error {
  status = 401;
  constructor(
    message = 'Authentication required. Please Sign in with Google to access protected workspace data.'
  ) {
    super(message);
    this.name = 'AuthRequiredError';
  }
}

export async function requireAuthenticatedSession(
  req: NextRequest
): Promise<VerifiedSession & { authenticated: true; idToken: string }> {
  const session = await verifyRequestSession(req);
  if (!session.authenticated || !session.idToken) {
    throw new AuthRequiredError();
  }
  return session as VerifiedSession & { authenticated: true; idToken: string };
}

function extractBearer(authHeader: string | null): string | null {
  if (!authHeader) return null;
  const match = /^Bearer\s+(.+)$/i.exec(authHeader.trim());
  return match?.[1] ?? null;
}

function sanitizeSessionId(raw: string): string {
  const clean = raw.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 48);
  return clean || 'local-guest';
}
