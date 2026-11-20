# Live-only workspace (no mock data)

Path: `/live` on the **AI Studio** Next.js app, not the Hostinger showcase.

This route is deliberately separate from the existing concept/demo homepage. It uses the latest uploaded Browser+Merged(1).tar.gz as a **visual reference**, but does not copy its fake Gemini replies, sample Linear/Notion boards, invented agent scores, USDC balances, fake approval actions, or missing `actions` API.

## Actually wired

| Feature | Live provider / behavior | Requirement |
|---|---|---|
| GitHub repository, stars, forks, commits | GitHub REST API via `GET /api/live/github`; refresh every 90 seconds, fail closed | Public GitHub availability |
| Gmail recent messages | Existing `GET /api/workspace/gmail` with the user's OAuth bearer token | Firebase Google sign-in + Gmail consent |
| Calendar upcoming events | Existing `GET /api/workspace/calendar` | Calendar OAuth consent |
| Drive recent files | Existing `GET /api/workspace/drive` | Drive OAuth consent |
| Docs document content | Existing `GET /api/workspace/docs?documentId=...` | Docs OAuth consent and valid document ID |
| Gemini chat | Existing `POST /api/ai/chat`, `stream:false`, Google search grounding | Verified Firebase sign-in, server `GEMINI_API_KEY`, Gemini quota |
| Mission plan | Existing `POST /api/ai/plan`; **planning only**, never claims execution | Verified sign-in + Gemini key |
| Cloud notes | Real Firestore `spaces` document read/write with owner-enforced rules | Verified sign-in + deployed Firestore rules |
| Reports | Generated with Gemini and saved via Firestore `reports` only after successful write | Gemini + verified sign-in + Firestore |
| Other Google apps | Open the real Google website in a new tab | User's Google login on that site |

The UI shows **Disconnected**, **Error**, or **Unavailable** when required credentials/scopes or providers are missing. It never inserts fallback counts or claims a write succeeded before the provider confirms it.

## Not wired / not represented as real

- **Money / USDC / checkout**: No verified payment provider, merchant account, server-side transaction ledger or settlement approval path is configured. No payment controls are enabled.
- **Linear / Notion**: No OAuth connection or API credentials. The uploaded screenshots' boards were hardcoded; they are not imported as live data.
- **Google Sheets / Meet / Maps / YouTube / Photos / Keep / Translate / Search**: These buttons open the real service. They do **not** imply their APIs are connected.
- **Autonomous browser execution**: Gemini can plan and summarize, but the `/live` route does not claim to have executed web actions. Sensitive writes must be implemented with authenticated provider calls and server-enforced approvals.
- **Gemini key and Google OAuth consent**: The repository cannot supply these. Configure through secure deployment settings; never commit keys or paste them into chat.

## Production setup

1. Deploy the AI Studio app from `apps/ai-studio` with Node.js 24 and the existing `npm run build`.
2. Set `GEMINI_API_KEY` as a server-only environment secret for the Vercel project. Do not use a `NEXT_PUBLIC_` prefix for this key.
3. Configure Firebase Authentication, add the production host to authorized domains, enable Google sign-in and deploy `firestore.rules` to the correct Firestore database.
4. Configure Google OAuth consent and required Gmail, Drive, Docs and Calendar scopes. Users explicitly sign in and consent; the access token remains in browser memory.
5. Open `/live`. Sign in and connect Google Workspace. Confirm real provider data loads. Disconnect to verify the cards show **Disconnected**, not sample data.
6. Test Gemini with a real key and quota, then save notes and reports and verify them directly in Firestore.

The original demo UI remains accessible at `/` so existing features and deployments are not overwritten. **Do not label the demo homepage as production-live.** If the goal is to remove all simulation globally, first migrate every old feature to a real provider or hide it behind an explicit demo route, and do not enable payment execution without a verified provider and approval flow.
