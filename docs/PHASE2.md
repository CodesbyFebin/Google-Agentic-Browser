# Phase 2 — security and reliability hardening

## Scope

This phase hardens the independent browser-style prototype without converting it into a real Chromium browser or claiming external action execution.

### Agent Studio
- Canonical planning identities: **ORION** (Orchestrator), **ROVER** (Research), **ATLAS** (Analysis), **AEGIS** (Safety/Policy), **MERCURY** (Procurement), **CHRONICLE** (Knowledge/Records).
- The six personas are planning roles in a Gemini-generated workflow, **not** autonomous tool executors.
- The Code, Data, Research, Image, Video, Build, and Custom buttons are **planning templates**, not active media generation tools.
- The older demonstration editions retain their own historical persona branding until a unified React workspace migration.

### Gemini streaming
- `POST /api/ai/stream` uses `@google/genai` `generateContentStream`, returns SSE `ready`, `delta`, `done` and sanitized `error` events.
- The request is bounded to 4000 characters, 1400 output tokens, and 30 seconds.
- Client AbortController cancels fetch; server request abort and ReadableStream cancellation abort upstream and close the iterator. Cancellation is best effort and may not cancel provider billing.
- Missing API key returns HTTP 503. Public production AI routes are **fail-closed** until verified Firebase Auth and durable per-user quotas are added in Phase 3.

### Tool permissions and network safety
- Unknown tools are denied. Only enabled read-only policy/Drive metadata tools exist; all internal writes, external writes and arbitrary web fetch execution are disabled.
- User-provided webpages and file content must be treated as **untrusted data**, never privileged instructions.
- The unused `safeFetchText` helper pins DNS to a validated public IPv4 socket, enforces TLS, no redirects, a byte cap, and a timeout. It is **not** a complete browser sandbox or a public browsing feature.
- Same-origin iframe embedding is permitted. Third-party sites that block framing cannot be embedded and must open in an external tab.

### Approval lifecycle
- `ActionApproval` is distinct from the existing simulated Money OS `Approval` model.
- Proposed lifecycle: `PENDING → APPROVED/DENIED/EXPIRED → EXECUTING → EXECUTED/EXECUTION_FAILED`.
- Action hash = SHA-256 of tool name plus deterministic JSON payload; the approved payload cannot be swapped.
- Approval decisions require a server-verified owner identity, action hash and unexpired request. Claim is an atomic conditional database update with a unique idempotency key.
- No provider executor is connected. Failed/abandoned execution claims must be reconciled by a trusted operator before any retry. Provider-side idempotency and audit receipts are required before enabling writes.
- **Security boundary:** This is an internal foundation only; without Firebase Auth and authorization checks, no HTTP approval routes are exposed.

## Verification

CI runs `npm ci`, `prisma generate`, `npm run lint`, `npm run typecheck`, `npm run test` and `npm run build` on Node 22. No live Gemini/OAuth credentials are included in CI; the suite does not claim a successful provider call. Verify actual results from the GitHub Actions job before marking Phase 2 complete.

## Phase 3 blockers

Firebase Authentication and Firestore rules, durable per-user quotas, provider integration tests, action idempotency and reconciliation, and browser sandbox isolation remain necessary before production external execution.
