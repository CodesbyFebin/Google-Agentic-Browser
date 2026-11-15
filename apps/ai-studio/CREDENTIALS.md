# Secure credentials setup

This project uses Google Gemini through the server-side `@google/genai` SDK.
No working API key or Google account token is included in the repository.

## Google AI Studio

1. In [Google AI Studio](https://aistudio.google.com/) create or select your Gemini API key.
2. In AI Studio Build / deployment settings, add **GEMINI_API_KEY** as a secret, never as browser-visible source code.
3. For local work, copy `.env.example` to `.env.local` and set the key there. Keep `.env.local` untracked.
4. Keep **GEMINI_MODEL=gemini-3.1-flash-lite** until you have verified another model through your API key's model list. The Hydrogen identifier from some playground builds is not a guaranteed public API model.
5. Firebase sign-in is required for all live Gemini API calls. For a private local development session only, set `GEMINI_ALLOW_GUEST_DEV=true` to test without sign-in. This option is automatically ineffective in production.

## Approval signing

- Generate a cryptographically random secret of at least 32 characters and configure **GOOGLE_SESSION_SECRET** in your server secret manager.
- The server requires this secret in production; local development uses an ephemeral fallback.
- Keep **ENABLE_APPROVED_GOOGLE_WRITES=false** for demo deployments. When intentionally enabling live Google Workspace writes, sign in with Firebase and approve the exact action in the UI. Never enable it for a public demo without a production security review.
- Real-money payments are simulated even when approved.

## Firebase and Google Workspace

- The Firebase web configuration (`firebase-applet-config.json`) is public client configuration, **not** a replacement for server authentication. Configure allowed Authentication domains in Firebase Console.
- Firestore rules protect user data. Deploy and verify `firestore.rules` for the selected Firebase project before enabling persistence.
- Optional Google Workspace OAuth access is opt-in and incremental. Ask for the minimum read scope first; document writes, mail sends and calendar writes must remain approval-gated.
- Do not commit OAuth access/refresh tokens, service-account private keys, or a downloaded credentials JSON file.

## Google Cloud Run / Vercel

Set `GEMINI_API_KEY` and `GOOGLE_SESSION_SECRET` using **Google Secret Manager** (Cloud Run) or **Secret** environment variables (Vercel). Set the model and feature flags as ordinary configuration. Keep production and development secrets isolated.

GitHub Actions should run unit tests and build checks without live Gemini keys. A pass in CI proves the code builds, not that a paid model is accessible. Verify a real Gemini call privately with your configured key after deployment.

## Verification checklist

- [ ] `.env.local` is ignored by Git.
- [ ] No real key appears in source files or README examples.
- [ ] Unauthenticated `POST /api/ai/chat` returns HTTP 401 in production.
- [ ] Model-unavailable and quota errors appear as errors, not fabricated AI outputs.
- [ ] Approved simulated purchases never settle real funds.
- [ ] Live Google Workspace account writes remain disabled unless explicitly enabled by the operator.
