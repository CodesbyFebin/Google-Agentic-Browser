# Google Agentic Browser

> **The Browser That Does — With Your Approval.**
> *Independent AI-native browser workspace concept prototype. Not an official Google product.*

Google Agentic Browser combines a dark multi-pane browser workspace (Spaces, persistent tabs, 1–4 pane split layouts, command palette, local-only URL reader) with a real **Google Gemini (`@google/genai`)** orchestration engine, **six specialized AI agents**, **server-enforced human approval checkpoints**, **Custom Agent Studio**, **Money OS (Simulation Mode)**, **Firebase Authentication & Cloud Firestore persistence**, and **incremental Google Workspace OAuth** (Drive, Docs, Calendar, Gmail).

**Status:** full-stack MVP prototype, not a production browser engine or an official Google product. This folder is a **standalone Next.js application** within the [parent repository](../../README.md). It does not share the root app's routes or database. Gemini, Google sign-in and Workspace calls need credentials and project configuration; CI builds without them.

## Quick start

Requires **Node.js 22+** and npm.

```bash
cd apps/ai-studio
npm ci
cp .env.example .env.local
# Add GEMINI_API_KEY privately; configure Firebase Auth for your own project.
npm run doctor
npm run dev
```

Open <http://localhost:3000>. **No API key is bundled.** `npm run doctor` checks configuration presence without printing secret values. `npm run doctor -- --strict` fails if the necessary credentials are missing, useful for private deployment checks. Use `.env.local` locally and Secret Manager or your deployment's Secret variables in production. Do not paste keys into GitHub issues, screenshots, PRs or chats.

---

## Key Features

- **Multi-Space Browser Workspace**: Five isolated Spaces (`Work`, `Money`, `Personal`, `Research`, `Focus`) with 1–4 pane resizable/draggable split layouts, tab management, Space notes, Focus Mode, Zen Mode, and `Cmd/Ctrl+K` Command Palette.
- **Real Server-Side Gemini AI (`@google/genai`)**:
  - Streaming conversational chat (`POST /api/ai/stream`), standard chat (`/api/ai/chat`), page/document summarization (`/api/ai/summarize`), analysis (`/api/ai/analyze`), structured mission planning (`/api/ai/plan`), function-calling tools (`/api/ai/tools`), and live model catalog (`/api/ai/models`).
  - Defaults to the documented Gemini API model `gemini-3.1-flash-lite`. Experimental model IDs such as `gemini-4-hydrogen` require explicit account access and are not assumed to be generally available.
  - Live Gemini calls require a verified Google sign-in by default. Local development can explicitly enable `GEMINI_ALLOW_GUEST_DEV=true`; production never permits guest Gemini traffic.
- **Six Specialized AI Agents**:
  - **ORION** (Orchestrator), **ROVER** (Research), **ATLAS** (Analysis & Reports), **AEGIS** (Deterministic Safety & Policy Gate), **MERCURY** (Procurement & Budgets), and **CHRONICLE** (Knowledge & Mission Replay).
  - These are coordinated planning roles and a deterministic approval gate, **not six autonomous agents with unrestricted real-world permissions**.
- **Mandatory Human-in-the-Loop Approvals**:
  - Consequential actions (`SPEND_MONEY_SIMULATED`, `SEND_EMAIL`, `CREATE_CALENDAR_EVENT`, `WRITE_DRIVE_FILE`, `UPDATE_GOOGLE_DOC`, `DELETE_CONTENT`, `PUBLISH_CONTENT`, `SHARE_FILE`) pause execution and require explicit user approval validated server-side via HMAC-SHA256 signed, expiring, payload-hashed, single-use tokens (`/api/approvals/create` and `/api/approvals/decide`). **Live account writes are additionally disabled by default** and require explicit deployment opt-in and authenticated Google identity.
- **Custom Agent Studio**:
  - Create, duplicate, edit, persist, and run custom agents across 7 templates (`Code`, `Data`, `Research`, `Image`, `Video`, `Build`, `Custom`) with configurable tool allowlists and approval policies.
- **Money OS (Simulation Mode)**:
  - Simulated balances, monthly/daily/per-transaction policy caps, approval gating, and simulated transaction receipts. Real financial settlement is disabled by default (`realPaymentsEnabled: false`).
- **Google Workspace OAuth (Least-Privilege & Incremental)**:
  - Connects client-side via Firebase GoogleAuthProvider incremental scopes and sends short-lived access tokens to server routes only in memory (`x-workspace-token` / `Authorization: Bearer`). Displays honest **Disconnected** states until explicitly authorized.
- **Mission Recording & Replay**:
  - Chronological Activity & Replay scrubber for inspecting mission steps, approvals, and Chronicle reports without re-triggering external side effects.

---

## Architecture Overview

See [`ARCHITECTURE.md`](./ARCHITECTURE.md) for detailed component diagrams, mission lifecycle state machine, security model, and Firestore schema documentation.

| Boundary | Implementation | Exposure |
| --- | --- | --- |
| Workspace UI → API | Next.js App Router with validated JSON payloads | Browser sends Firebase ID token for protected calls |
| API → Gemini | Official `@google/genai` SDK; plan, chat, streaming, summarization, analysis and tools | Server-only Gemini key; live calls require verified sign-in (except deliberate local dev override) |
| API → user data | Firestore REST using signed-in user's Firebase token | Owner-scoped access enforced by deployed Firestore rules |
| UI → Google Workspace | Incremental Google OAuth token passed to server in request memory | Access only after user's OAuth consent; account writes additionally approval-gated |
| Approval → action | Payload-bound HMAC token, expiry, one-time consume, policy evaluation | External writes off by default; real-money settlement never enabled |

### Implemented API routes

| Routes | Responsibility |
| --- | --- |
| `POST /api/ai/chat`, `/api/ai/stream` | Gemini chat and streaming |
| `POST /api/ai/plan`, `/api/ai/analyze`, `/api/ai/summarize`, `/api/ai/tools` | AI planning, analysis, summaries and structured tool calls |
| `GET /api/ai/models` | Model availability/catalog |
| `POST /api/missions/step`, `POST /api/studio/run` | Signed-in mission-step and custom-agent execution using Gemini |
| `POST /api/approvals/create`, `POST /api/approvals/decide` | Issue and consume exact-action human approvals |
| `/api/firestore/workspace`, `/api/firestore/logs` | Authenticated user workspace and activity data |
| `/api/workspace/drive`, `/api/workspace/docs`, `/api/workspace/calendar`, `/api/workspace/gmail` | Consented Google Workspace operations |
| `POST /api/fetch-page`, `GET /api/health` | Local-development-only page reader (disabled in production due to DNS-rebinding risk) and non-secret readiness status |

The app has an **in-process** rate limiter; it is not a durable per-user billing quota. Live integration and container runtime tests require your configured services. The working AI feature path is: UI → authenticated Next.js API → Gemini SDK → validated response/stream → UI.

---

## Environment Variables

Copy `.env.example` to `.env.local` for local development (never commit real secrets):

```bash
GEMINI_API_KEY="" # Set privately in .env.local or your deployment secret manager
GEMINI_MODEL="gemini-3.1-flash-lite"
APP_URL="http://localhost:3000"
GOOGLE_SESSION_SECRET="" # Generate a random value, minimum 32 characters
GEMINI_ALLOW_GUEST_DEV="false"
ENABLE_APPROVED_GOOGLE_WRITES="false"
```

---

For Google AI Studio, Firebase, Google Cloud Run and local credential setup, see [CREDENTIALS.md](./CREDENTIALS.md). Never paste Gemini API keys, OAuth client secrets or service-account JSON into GitHub commits or chat messages.

---

## Local Development

```bash
npm ci
npm run doctor
npm run dev
```

Open `http://localhost:3000`.

### Running Verification & Automated Tests

```bash
# Unit & security invariant tests
npm test

# Validate server configuration without printing secret values
npm run doctor

# TypeScript & Next.js production build
npm run typecheck
npm run build

# ESLint (includes @firebase/eslint-plugin-security-rules on firestore.rules)
npm run lint
```

---

## Firebase & Google Workspace Setup

1. Firebase configuration lives in `firebase-applet-config.json` (generated via AI Studio Firebase provisioning).
2. Security rules are defined in `firestore.rules` and validated against `firebase-blueprint.json` with default-deny, `email_verified == true` writes, owner isolation, and immutable audit logs.
3. Requested Google Workspace OAuth scopes:
   - `https://www.googleapis.com/auth/drive.readonly`
   - `https://www.googleapis.com/auth/drive.file`
   - `https://www.googleapis.com/auth/documents`
   - `https://www.googleapis.com/auth/calendar.events`
   - `https://www.googleapis.com/auth/gmail.readonly`
   - `https://www.googleapis.com/auth/gmail.compose`

---

## Deploying to Google Cloud Run

The included multi-stage [`Dockerfile`](./Dockerfile) builds Next.js **standalone output** with Node.js 22. Run from **`apps/ai-studio/`**, not from the monorepo root. Create `GEMINI_API_KEY` and `GOOGLE_SESSION_SECRET` in Google Secret Manager, grant the Cloud Run service identity access, configure Firebase Auth domains and deploy Firestore rules before enabling authenticated data flows. Do not put secrets in Docker build arguments or images.

```bash
gcloud builds submit --tag REGION-docker.pkg.dev/YOUR_PROJECT_ID/YOUR_REPOSITORY/google-agentic-browser
gcloud run deploy google-agentic-browser \
  --image REGION-docker.pkg.dev/YOUR_PROJECT_ID/YOUR_REPOSITORY/google-agentic-browser \
  --region asia-south1 \
  --allow-unauthenticated \
  --set-secrets GEMINI_API_KEY=GEMINI_API_KEY:latest,GOOGLE_SESSION_SECRET=GOOGLE_SESSION_SECRET:latest \
  --set-env-vars ENABLE_APPROVED_GOOGLE_WRITES=false,GEMINI_ALLOW_GUEST_DEV=false
```

Replace the project, region and Artifact Registry repository placeholders; make sure the repository exists first. The public HTTP route serves a sign-in screen, but **all live Gemini calls remain authenticated**. This is a deployment example, not evidence of an actual Cloud Run deployment or successful credentialed API call.

---

## Disclaimer

Google Agentic Browser is an **independent concept prototype** built for demonstration and engineering research. It is **not an official Google product**. Money OS runs strictly in **Simulation Mode** with no real payment processor settlement.
