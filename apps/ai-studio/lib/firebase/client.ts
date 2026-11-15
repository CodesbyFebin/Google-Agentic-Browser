'use client';

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import {
  browserLocalPersistence,
  getAuth,
  GoogleAuthProvider,
  onAuthStateChanged,
  setPersistence,
  signInWithPopup,
  signOut,
  type Auth,
  type User,
} from 'firebase/auth';
import {
  doc,
  getDocFromServer,
  getFirestore,
  type Firestore,
} from 'firebase/firestore';
import firebaseConfig from '../../firebase-applet-config.json';

export const WORKSPACE_SCOPES = [
  'https://www.googleapis.com/auth/drive.readonly',
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/documents',
  'https://www.googleapis.com/auth/calendar.events',
  'https://www.googleapis.com/auth/gmail.readonly',
  'https://www.googleapis.com/auth/gmail.compose',
] as const;

const app: FirebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

const configWithDb = firebaseConfig as typeof firebaseConfig & {
  firestoreDatabaseId?: string;
};

export const db: Firestore = configWithDb.firestoreDatabaseId
  ? getFirestore(app, configWithDb.firestoreDatabaseId)
  : getFirestore(app);

export const auth: Auth = getAuth(app);
if (typeof window !== 'undefined') {
  setPersistence(auth, browserLocalPersistence).catch(() => {});
}

// In-memory-only OAuth access token (never persisted to localStorage/sessionStorage)
let cachedWorkspaceAccessToken: string | null = null;
let grantedScopes: string[] = [];
let isSigningIn = false;

export function getCachedWorkspaceAccessToken(): string | null {
  return cachedWorkspaceAccessToken;
}

export function getGrantedWorkspaceScopes(): string[] {
  return [...grantedScopes];
}

export function clearWorkspaceToken(): void {
  cachedWorkspaceAccessToken = null;
  grantedScopes = [];
}

export function isFirebaseSigningIn(): boolean {
  return isSigningIn;
}

export function subscribeAuthState(
  onUser: (user: User | null, workspaceToken: string | null) => void
): () => void {
  return onAuthStateChanged(auth, (user) => {
    if (!user) {
      clearWorkspaceToken();
    }
    onUser(user, cachedWorkspaceAccessToken);
  });
}

/**
 * Standard Google Sign-In for Firebase Authentication (profile + email only).
 * Does NOT automatically grant Google Workspace data scopes.
 */
export async function signInWithGoogleIdentity(): Promise<User> {
  isSigningIn = true;
  try {
    const provider = new GoogleAuthProvider();
    provider.setCustomParameters({ prompt: 'select_account' });
    const result = await signInWithPopup(auth, provider);
    return result.user;
  } finally {
    isSigningIn = false;
  }
}

/**
 * Incremental OAuth 2.0 consent flow for Google Workspace (Drive, Docs, Calendar, Gmail).
 */
export async function connectGoogleWorkspaceScopes(
  requestedScopes: string[] = [...WORKSPACE_SCOPES]
): Promise<{ user: User; accessToken: string; scopes: string[] }> {
  isSigningIn = true;
  try {
    const provider = new GoogleAuthProvider();
    for (const scope of requestedScopes) {
      provider.addScope(scope);
    }
    provider.setCustomParameters({
      prompt: 'consent',
      include_granted_scopes: 'true',
    });

    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);
    if (!credential?.accessToken) {
      throw new Error(
        'Google Workspace authorization completed, but no OAuth access token was returned.'
      );
    }

    cachedWorkspaceAccessToken = credential.accessToken;
    grantedScopes = Array.from(new Set([...grantedScopes, ...requestedScopes]));
    return {
      user: result.user,
      accessToken: credential.accessToken,
      scopes: grantedScopes,
    };
  } finally {
    isSigningIn = false;
  }
}

export async function signOutFirebase(): Promise<void> {
  clearWorkspaceToken();
  await signOut(auth);
}

export async function getFreshIdToken(): Promise<string | null> {
  if (!auth.currentUser) return null;
  return auth.currentUser.getIdToken();
}

export async function testFirestoreConnection(): Promise<{
  ok: boolean;
  error?: string;
}> {
  try {
    await getDocFromServer(doc(db, 'test', 'connection'));
    return { ok: true };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    if (message.includes('the client is offline')) {
      return {
        ok: false,
        error: 'Firestore client appears offline. Verify Firebase configuration.',
      };
    }
    // Permission-denied when unauthenticated is expected before sign-in
    return { ok: true };
  }
}

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(
  error: unknown,
  operationType: OperationType,
  path: string | null
): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid ?? null,
      email: auth.currentUser?.email ?? null,
      emailVerified: auth.currentUser?.emailVerified ?? null,
      isAnonymous: auth.currentUser?.isAnonymous ?? null,
      tenantId: auth.currentUser?.tenantId ?? null,
      providerInfo:
        auth.currentUser?.providerData?.map((provider) => ({
          providerId: provider.providerId,
          email: provider.email,
        })) ?? [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}
