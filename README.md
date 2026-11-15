# Google Agentic Browser

<img width="1672" height="941" alt="Google Agentic Browser Neon Banner" src="https://github.com/user-attachments/assets/2a82a32e-d7e7-495b-b96d-3e7c23af8d64" />

> **From browsing pages to completing goals — with Gemini-powered plans and a human in control.**

**Stage:** Idea-stage startup · **Buildathon:** Startup Buildathon India 2026 · **Technology:** Next.js, TypeScript, Google Gemini SDK, Google OAuth

Google Agentic Browser is an independent Google-inspired browser workspace prototype by Febin Francis. It combines six agent personas, spaces and tabs, split views, simulated approval checkpoints, activity replay, a Money OS concept, live Gemini planning, and an optional read-only Google Drive connection. It is **not an official Google product or a replacement browser engine**.

The problem: work gets scattered between tabs, apps, logins, and approval dialogs. The goal is to turn that fragmented work into one inspectable mission, while keeping consequential decisions with a person.

<img width="1672" height="941" alt="Google Agentic Browser Dashboard" src="https://github.com/user-attachments/assets/8b943bdf-6ecd-47c2-b0bd-ca3b53b8a613" />

## Build and run

One workspace built from all the supplied Google Browser concepts, the Ardia/Nova Next.js browser, the AgentPAL × PayPal Money OS, and the supplied HTML UI/design. The **user-selected HTML design is the primary interface**; the other implementations remain accessible as alternate workspaces.

Requires Node.js 20.9+.

```bash
npm install
cp .env.example .env
npm run db:generate
npm run db:push
npm run dev
```

Open <http://localhost:3000>. If port 3000 is in use, stop the conflicting process or update the `dev` script to another port.

For the complete server-backed production build, run `npm run build` and then `npm run start` with the same `DATABASE_URL`. The start script normalizes relative SQLite paths for the packaged server.

## Included workspaces

| Route | Purpose |
| --- | --- |
| `/` | **Primary unified UI** based on the supplied HTML style; agents, mission recorder, Spaces, split view, Google-style app launcher, Activity decisions, Money OS approvals and demo Workspace consent. |
| `/money` | Full AgentPAL × PayPal Money OS concept with Command Center, wallet screens, agent mesh, rules, invoices, transactions and analytics. |
| `/agents-edition` | The newly supplied merged React **Agents Edition**: seven right-panel tabs, six-agent mission store, synchronized recorder, approvals, activity feed, scope concepts and SQLite-backed sample records. |
| `/guardian` | Google Browser (2): approval workflow, activity explanations, autonomy policy, mini-wallet, Google Workspace permission concepts and quick notes. |
| `/mission` | Google Browser (4): updated React mission orchestration, agent passports, x402 approval gates, replay and Google app mockups. Includes corrections from Browser (4) to the earlier Browser (3). |
| `/classic` | Preserved Ardia/Nova browser shell with advanced tabs, Spaces, themes, command palette, split panes and its AI panel. |
| `/reference/mission-control-demo.html` | Untouched original HTML reference (also matches the separately supplied pasted Markdown and pasted HTML). |

### Live Gemini AI Studio panel

Open **✧ AI Studio** in the main browser header or sidebar. It uses Google's official `@google/genai` JavaScript SDK on the **Next.js server** to create structured multi-agent plans. The Gemini API key never goes to the browser. The six Studio roles are Nova (orchestration), Scout (research), Atlas (analysis), Sentinel (safety), Scribe (writing), and Studio (Gemini). **These are planning personas, not six autonomous executors.**

Optional Google Workspace connection requests only `openid`, `email`, `profile`, and `drive.metadata.readonly`. OAuth uses state, PKCE, encrypted HttpOnly cookies and a short-lived access token. The panel lists recent Drive file metadata, not document content. No Google data changes or paid actions are implemented.

Set `GEMINI_API_KEY` and optionally `GEMINI_MODEL`, `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REDIRECT_URI` and `GOOGLE_SESSION_SECRET` in **server-only** environment variables (see `.env.example`). Configure a Google Cloud OAuth consent screen and authorize the exact callback URL. Without secrets the interface still runs, but reports the integrations as unconfigured; no pretend live AI response is produced.

| API | Purpose | Mode |
| --- | --- | --- |
| `POST /api/agent/studio` | Gemini-generated structured plans, flagged for approval | Live with key; proposal-only |
| `POST /api/chat` | Gemini-backed assistant replies | Live with key |
| `GET /api/google/status` | Integration readiness and connection status | Read-only |
| `GET /api/google/oauth/start`, `GET /api/google/oauth/callback` | Google OAuth consent / callback | Read-only Drive scope |
| `GET /api/google/drive` | Lists recent Drive file names and metadata | Read-only |
| `POST /api/google/disconnect` | Clears the encrypted session cookie | Explicit user action |

Before a publicly accessible production deployment with a Gemini key, add authenticated users, a durable per-user rate limit, API quota/cost controls, and operational logs. This prototype does **not** safely execute a plan or transfer money merely because a user clicked a demo approval.

The main UI is served from `public/google-agentic-browser.html` with the demo extension (`public/unified-features.js` / `.css`) and the live integration panel (`public/google-studio.js` / `.css`). The original design, tokens, typography and color themes are preserved.

The supplied [Agents Edition engineering blueprint](docs/BLUEPRINT.md) is retained in full. It describes a potential Manifest V3 Chrome extension with agent passports, approval policies, A2UI schemas, least-privilege OAuth and x402 tooling. **Those future extensions are specifications, not implemented live integrations.**

### Standalone version

If you only want the design and interactive demo without a Next.js server, serve `public/` as a static directory and open `google-agentic-browser.html`. The standalone UI does not require a database. It uses the supplied Tailwind CDN, so an internet connection is required for utility styles.

## Checks

```bash
npm run test:smoke
npm run typecheck
npm run build
```

## Important prototype boundaries

- This is an **independent, Google-inspired concept**, not an official Google product or actual Chromium-based browser. The in-app pages are representations; they are not a native browser engine.
- Original mission playback, demo permission dialogs, approval flows, wallets and payment events are **simulated**. Only the separately labeled Gemini planning/chat and optional **read-only Google Drive metadata** features use real Google APIs when configured. No PayPal account, cryptocurrency wallet or payment service is connected.
- The standalone UI stores demo decisions in browser-local storage. The Next.js `/actions` adapter stores records in memory, which are lost on server restart. The separate Prisma APIs need `DATABASE_URL` and a prepared SQLite database. In Agents Edition, `/api/payments` stores seeded demo orders/approvals, `/api/connect` stores a process-local sample consent log, and `/api/agent/mission` stores simulated mission runs.
- The new `/api/chat`, `/api/agent`, and `/api/agent/studio` integrations use the official `@google/genai` SDK. Other legacy Next.js UI explanations mentioning `z-ai-web-dev-sdk` are historical. Without a valid API key, live requests return a configuration error instead of simulated answers. The SDK integration is not an end-to-end verified live call until a key and quota are supplied.
- High-stakes actions in the demo always require an explicit approval; "Demo autonomy" does not authorize spending or sending anything.

See [docs/INTEGRATION.md](docs/INTEGRATION.md) for source mapping and operational boundaries.
