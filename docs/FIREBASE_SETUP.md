# Firebase setup — Google Agentic Browser

Firebase Authentication and Firestore power the optional private-notes panel in
**Agent Studio**. Google Workspace Drive OAuth is **a different connection**.
Neither sign-in grants agents permission to send messages, spend money or modify
an external account.

## 1. Firebase console

1. Create or select your Firebase project and register a **Web app**.
2. In Authentication → Sign-in method, enable **Google**.
3. In Authentication → Settings → Authorized domains, add the exact origins
   where this browser app runs, including your local development domain.
4. Create a Cloud Firestore database in **production mode**.
5. Review [firestore.rules](../firestore.rules) and deploy these rules to
   **your Firebase project** before using the notes feature. For example,
   with the Firebase CLI after `firebase login` and `firebase use PROJECT_ID`:
   `firebase deploy --only firestore:rules`.
   Review the active project ID carefully; rule deployment replaces the target
   project's Firestore rules. It is **not** performed automatically.

## 2. Local environment

Open `.env.local` (gitignored) next to `package.json` and enter the Firebase
web-app configuration copied from Firebase console → Project settings.

```env
NEXT_PUBLIC_FIREBASE_API_KEY=""
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="your-project-id.firebaseapp.com"
NEXT_PUBLIC_FIREBASE_PROJECT_ID="your-project-id"
NEXT_PUBLIC_FIREBASE_APP_ID=""
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=""
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=""
```

These are **public Firebase web configuration values**, not private service
account credentials. Firebase restricts access through Authentication and the
Firestore security rules you deploy. Do **not** put private service account
JSON, OAuth client secrets or Gemini API keys under `NEXT_PUBLIC_`.

## 3. Google Workspace (separate consent)

If you also want the read-only Drive search, create a Google Cloud OAuth Web
client and authorize exactly:

```text
http://localhost:3000/api/google/oauth/callback
```

Set `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`,
`GOOGLE_OAUTH_REDIRECT_URI`, and a random, 32-byte base64
`GOOGLE_SESSION_SECRET` as **server-only** environment variables.
Enable the Google Drive API in that Google Cloud project.

## 4. What is verified

- The Firebase web SDK uses `GoogleAuthProvider` with an explicit sign-in
  popup. The server checks Firebase ID tokens through Google's official
  Identity Toolkit `accounts:lookup` endpoint.
- Notes are stored at `users/{firebaseUid}/notes/{noteId}` in Firestore.
  Owner-only rules enforce reads and writes, restrict fields and prevent
  cross-user access. Notes are not written to the application's SQLite database.
- The **Firebase web SDK is loaded from Google's versioned CDN** only after
  public Firebase web config is present. It is not bundled in npm dependencies.
- This does **not** turn on production Gemini requests. Those remain disabled
  until server-verified identity, durable per-user AI rate limits/quotas and
  budget monitoring are integrated with the AI routes.

## 5. Gemini models (checked November 2026)

The default is now `gemini-3.8-flash` (stable). For lower cost, try
`gemini-3.5-flash-lite` if your account supports it. Older
`gemini-2.5-flash` may only be available to existing users. Model availability
and quota are account-specific; a live request is needed to validate your key.

Official references:

- [Firebase Google sign-in](https://firebase.google.com/docs/auth/web/google-signin)
- [Firestore security rules](https://firebase.google.com/docs/firestore/security/rules-conditions)
- [Firebase Authentication REST API](https://firebase.google.com/docs/reference/rest/auth)
- [Gemini models](https://ai.google.dev/gemini-api/docs/models)
