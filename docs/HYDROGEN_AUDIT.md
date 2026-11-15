# Hydrogen generated build — code review and integration decision

Source: the uploaded `Pasted markdown(20261115-035953).md`, produced by AI Studio/Hydrogen. It is a **generated code proposal**, not a full checkout or a tested deployment. Its author stated that its sandbox contained only seven image files, and that no build, test suite, or deployment was executed. This review does not certify the full proposal.

## Findings

| Priority | Generated proposal issue | Resolution |
| --- | --- | --- |
| High | A global `X-Frame-Options: DENY` would prevent the current Next.js home page from embedding its same-origin browser UI iframe. | **Rejected** blanket header; keep the existing render path. Configure route-specific CSP / framing rules during hardening. |
| High | An approval function marked actions `EXECUTED` in Firestore **before** the external side effect succeeded. A failed provider call could be recorded as successful and blocked from retrying. | **Rejected** executor. Live Studio returns proposals only. Future executor needs durable `APPROVED → EXECUTING → SUCCEEDED/FAILED` states, provider idempotency keys, leases and reconciliation. |
| High | `save_note` appeared in a supposed `READ_ONLY_ALLOWLIST`, despite causing a Firestore write. | **Rejected** capability definition. All proposed steps are unexecuted; any future writes need separately defined authorization. |
| High | The proposed URL-validation routine resolved DNS, then fetched by hostname separately, which does not reliably stop DNS rebinding or redirects to private endpoints. | **Rejected** arbitrary URL fetch tooling. Future browsing must use an isolated browser runtime, request destination checks at connection time, redirect revalidation and egress controls. |
| Medium | Several endpoints and privileged features assumed Firebase Auth / rules / secrets not present in the existing codebase. | **Not merged**. Existing Next.js SQLite demo remains separate; Google OAuth is limited to encrypted-cookie, read-only Drive metadata. |
| Medium | Generated examples included billing, sending, Workspace mutation, and token management without integration tests against real providers. | **Not enabled**. Payment and account side effects remain mock UI only. |
| Medium | Generated snippets were embedded in escaped Markdown; no complete dependency lockfile or deployable project was supplied. | **Selective integration**. Implemented and tested native code in the existing project, not wholesale copy/paste. |

## What is actually integrated

1. Official `@google/genai` SDK for server-side chat and structured agent planning, with input bounds, timeouts and sanitized provider errors.
2. AI Studio panel integrated into the pre-existing Google-themed UI, with six specialized planning roles, visible proposal statuses and approval-required flags.
3. Google OAuth authorization-code flow with PKCE, CSRF state, encrypted short-lived HttpOnly session cookies, and read-only Drive metadata listing.
4. No executor, no third-party payment APIs, no Gmail send, no Docs/Calendar modifications, no refresh tokens, and no automatic change of account permissions.

## Verification results (2026-11-15)

- `npm run typecheck` — **pass**.
- `npm run test:smoke` — **pass**, including parsing and mounting the Gemini Studio module.
- `npm run build` — **pass** with 23 Next.js app routes generated.
- Production HTTP smoke — **pass**: `/`, `/google-agentic-browser.html`, `/google-studio.js`, `/api/google/status`, access-denied Drive, OAuth missing-credentials response, invalid prompt guards, and Gemini missing-key response.
- `npm run lint` — **not passing**: 26 errors / 1 warning in legacy React components and CommonJS scripts (mainly React hooks rules and CommonJS lint configuration). These pre-existing code-quality issues do not block typecheck/build but remain cleanup work.
- Real provider invocation — **not tested** because no Gemini API key or Google OAuth credentials were supplied. No actual Google Drive files were read.

## Remaining work

- A successful configuration-error response does **not** count as a verified live Gemini/Drive invocation.
- Live Google Gemini/Drive integration requires an API key and OAuth client owned by the user, configured securely in the deployment environment. Both must be tested interactively with the actual key/account before claiming end-to-end connectivity.
- Production service still needs user authentication, durable rate limiting, cost budgets, per-user isolation, observability, CSP hardening, session refresh/revocation, and an independent payment/action executor with a correct approval state machine.
- The primary UI is a working browser-like **web prototype**, not a Chromium engine or a general-purpose browsing agent. Many original demonstration actions remain simulated.
