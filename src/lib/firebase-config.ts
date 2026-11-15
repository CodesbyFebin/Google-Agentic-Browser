/** Firebase web configuration contains public project identifiers, never Admin credentials. */
export type FirebaseWebConfig = {
  apiKey: string;
  authDomain: string;
  projectId: string;
  appId: string;
  messagingSenderId?: string;
  storageBucket?: string;
};

export function firebaseWebConfig(): FirebaseWebConfig | null {
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY || '';
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN || '';
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || '';
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID || '';
  if (!apiKey || !authDomain || !projectId || !appId) return null;
  // Fail closed on malformed configuration: the auth client must only target the
  // declared Firebase project's own Google-hosted auth domain.
  if (!/^[a-zA-Z0-9_-]{3,100}$/.test(projectId) ||
      authDomain !== `${projectId}.firebaseapp.com` ||
      !/^[a-zA-Z0-9_-]{20,180}$/.test(apiKey)) return null;
  return {
    apiKey, authDomain, projectId, appId,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || undefined,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET || undefined,
  };
}
