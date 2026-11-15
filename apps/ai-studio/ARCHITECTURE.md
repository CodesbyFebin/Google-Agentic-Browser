# Architecture — Google Agentic Browser

## 1. System Topology

```text
Browser UI (Next.js App Router + React 19 + Tailwind CSS v4)
 ├── TopToolbar / SpacesSidebar / MobileSpaceBar / CenterWorkspace / RightSidebar
 ├── BrowserStateProvider (local state + Firebase Auth + Firestore cloud sync)
 └── In-Memory Workspace Token Store (never persisted to localStorage/Firestore)
        │
        ▼ (HTTPS / JSON / SSE Stream + x-firebase-token + x-workspace-token)
Next.js Route Handlers (/app/api/*)
 ├── Auth Guard (lib/server/auth.ts — jose JWKS verification of Firebase ID tokens)
 ├── Rate Limiter & SSRF Guard (lib/security.ts)
 ├── Gemini Server Client (lib/server/gemini.ts — @google/genai + GEMINI_API_KEY)
 ├── Server Approval Store (lib/server/approval-store.ts — HMAC-SHA256 + idempotency)
 └── Workspace API Adapters (/api/workspace/{drive,docs,calendar,gmail})
        │
        ├──▶ Google Gemini API (server-side secret only)
        ├──▶ Cloud Firestore (firestore.rules + firebase-blueprint.json)
        └──▶ Google Workspace REST APIs (least-privilege user OAuth Bearer token)
```

---

## 2. Six-Agent Orchestration Model

1. **ORION (Mission Orchestrator)**: Decomposes user objectives into validated, ordered specialist steps via `/api/ai/plan`.
2. **ROVER (Research Agent)**: Performs grounded research and summarizes inspected public web content wrapped in `<untrusted_data>` tags.
3. **ATLAS (Analysis Agent)**: Compares options, ranks trade-offs, and drafts structured Markdown evaluations.
4. **AEGIS (Safety & Policy Agent)**: Deterministic backend evaluator (`evaluateActionPolicy`) enforcing spend caps, prompt-injection detection, and mandatory human approval requirements.
5. **MERCURY (Procurement Agent)**: Prepares simulated purchase proposals in Money OS Simulation Mode.
6. **CHRONICLE (Knowledge Agent)**: Archives final mission reports and maintains chronological activity logs for read-only Mission Replay.

---

## 3. Mission Lifecycle & Human Approval Gate

```text
CREATED ──▶ PLANNING ──▶ RUNNING ──▶ COMPLETED
                          │   ▲
                          ▼   │ (Server-verified APPROVE)
                    AWAITING_APPROVAL
                          │
                          ├──▶ PAUSED (User pause or REJECT)
                          └──▶ CANCELLED / FAILED
```

### Mandatory Approval Guarantees (`lib/server/approval-store.ts`)
- Every sensitive action (`SPEND_MONEY_SIMULATED`, `SEND_EMAIL`, `CREATE_CALENDAR_EVENT`, `WRITE_DRIVE_FILE`, `UPDATE_GOOGLE_DOC`, `DELETE_CONTENT`, `PUBLISH_CONTENT`, `SHARE_FILE`) creates an HMAC-SHA256 signed checkpoint tied to `(id, ownerId, missionId, payloadHash, expiresAtMs)`.
- Rejection (`decision: 'REJECT'`) records `REJECTED`, pauses the mission, and triggers zero side effects.
- Expiration, payload tampering, owner mismatch, or replay of an already-consumed approval ID is blocked with HTTP `403`.

---

## 4. Security Defenses

- **SSRF Protection (`validateExternalUrl`)**: Blocks `localhost`, `127.0.0.0/8`, `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `169.254.169.254`, `*.internal`, `*.local`, IPv6 loopback/ULA/link-local, credentials-in-URL, and non-HTTP(S) schemes in `/api/fetch-page`.
- **Prompt Injection Defense (`detectPromptInjection`, `wrapUntrustedContent`)**: External webpage/document text is explicitly fenced inside `<untrusted_data>` with instructions treating embedded directives as passive data.
- **Secret Handling**: `GEMINI_API_KEY` and `GOOGLE_SESSION_SECRET` remain strictly server-side; `redactSecrets()` strips Bearer tokens, Google API keys, and OAuth tokens before logging.
- **Firestore Security (`firestore.rules`)**: Global default-deny, `email_verified == true` requirement on writes, strict `ownerId == request.auth.uid` checks, immutable `createdAt`/`activityLogs`/`simulatedTransactions`, and `realPaymentsEnabled == false` enforcement on `spendingPolicies`.
