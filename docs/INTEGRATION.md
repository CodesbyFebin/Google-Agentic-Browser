# Integration map

The **final UI follows the supplied `Pasted text(20261115-015954).txt`** design. That attachment is the same standalone HTML as the mission-control reference bundled in the earlier merged archive (apart from document-type capitalization). Its original colors, typography, glass panels, sidebars, toolbar, agent roster and animations are retained.

| Input | What was incorporated |
| --- | --- |
| Pasted HTML and pasted Markdown | Primary landing interface at `/`, with the original preserved under `/reference/mission-control-demo.html`. |
| `Google+Browser(2).tar.gz` | Guardian React workspace at `/guardian`, plus its approval queue, autonomy settings, decision log and permissions concepts added to the primary UI. |
| `Google+Browser(3).tar.gz` | Mission-control React design, app launcher and replay features, present in the primary UI and preserved via the newer `/mission` variant. |
| `Google+Browser(4).tar.gz` | Latest React mission workspace at `/mission`; fixes the earlier `spent(K())` calls to `spent(K)` and adds a fuller font stack. |
| `agentic-browser-unified-merged.zip` | Next.js foundation, Ardia/Nova classic browser, AgentPAL full Money OS, APIs and database schema. |
| `google-agentic-browser-merged.tar.gz` | Added a distinct `/agents-edition` workspace, React agent orchestration + recorder, Money/Activity/Connect panels, typed mission state, demo APIs and extended Prisma models. The attached local `.env` was excluded from the merged project. |
| `Google-Browser-Blueprint-12k.md` | Retained in `docs/BLUEPRINT.md` and summarized in the main interface's Blueprint view. Its proposed Manifest V3 extension, MCP/A2UI agent protocol layer, OAuth and live x402 integration are future scope. |
| `workspace-fd336514-...tar` | Earlier Next.js project snapshot: its shared browser source and database API structure were compared against the newer merged ZIP. Existing project material was retained where not superseded. |
| Nested Ardia source archive | Retained in the packaged `upload/` directory for reference; main Ardia-style shell is available at `/classic`. |

## Primary UI functionality

- Spaces, tabs, 1–4 panes, theme controls, Google-like app previews and launcher.
- Simulated multi-agent mission, human payment/OAuth checkpoints, digital twin, agent passports, and recorder/replay.
- Activity feed with confidence tags and an inspectable "Why this action?" explanation.
- Money OS panel with local demo approvals, rejection, recent transactions and creating new order requests.
- Workspace Consent panel with local-only grant/revoke examples and clearly marked unconnected scopes.
- Unified workspace switching across all new UI panels and links into the full React/Next modules when hosted in the full app.
- A roadmap panel differentiating current simulations from future browser-engine, extension, identity and tool integrations.

## Data boundaries

The primary UI uses browser `localStorage` for approvals, transactions, consent choices and activity entries; these are mock records and not regulated payment or identity data. The `/guardian` and `/money` React pages call `POST /actions` using `records.create` and `records.list`, both backed by an in-memory store. Prisma-backed `/api/notes`, `/api/history` and `/api/agent` are separate and require a configured database. `POST /api/agent` plans illustrative steps; it does not run a real browser robot. The added `/api/agent/mission` stores scripted recorder history, `/api/payments` manipulates local example payment records, and `/api/connect` logs *simulated* consent decisions.

## Production considerations

The standalone preview can be statically hosted. Deploying the full server would need robust authentication, durable audited records, per-user data isolation, verified OAuth and payment webhooks, service-side approval enforcement, and a real browsing engine before any connected workflows could safely be enabled. Nothing in this source authorizes such live actions by default.
