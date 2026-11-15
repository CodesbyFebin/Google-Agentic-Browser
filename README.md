# Google Agentic Browser
<img width="1672" height="941" alt="Google Agentic Browser Neon Banner" src="https://github.com/user-attachments/assets/2a82a32e-d7e7-495b-b96d-3e7c23af8d64" />
> **An AI-first browser workspace concept that turns tabs into coordinated tasks — with people in control of every consequential action.**

**Stage:** Idea-stage startup / interactive prototype · **Built for:** Startup Buildathon India 2026 · **Status:** Concept demo, not a production browser

Google Agentic Browser reimagines the browser as a place where specialized AI agents can help plan, coordinate, and explain work across tabs and apps. The central idea is **trustworthy delegation**: let agents organize the work, but require explicit human approval before spending, granting access, sending, or publishing.

This is an **independent, Google-inspired project by Febin Francis**. It is not made by, sponsored by, or affiliated with Google.

## The problem

Today, multi-step online work is fragmented across tabs, tools, notes, logins, and approval dialogs. AI assistants can produce answers, but users still have to coordinate each step, decide what to trust, and reconstruct what happened.
<img width="1672" height="941" alt="Google Agentic Browser Dashboard" src="https://github.com/user-attachments/assets/8b943bdf-6ecd-47c2-b0bd-ca3b53b8a613" />

## The proposed solution

A single browser-style workspace combining:

- **Agent missions:** a six-agent concept team (Nova Prime, Scout Fox, Professor Octo, Sentinel Owl, Bee Buyer, and Scribe Turtle) for planning, research, review, purchasing scenarios, and reporting.
- **Human-in-the-loop controls:** simulated approval gates for high-impact actions, including payment requests and account permissions.
- **Activity and replay:** time-ordered decisions, `WHY` explanations, a mission recorder, and a replay scrubber.
- **Spaces and tabs:** Work, Money, Personal, Research, and Focus spaces; command palette, split views, and customizable themes.
- **Money OS concept:** simulated orders, wallet views, spending rules, approvals, and audit receipts.
- **Connection concepts:** illustrative least-privilege Google Workspace OAuth scopes and quota/consent panels.
- **Unified visual design:** the primary interface preserves the original HTML-based UI style, with alternate concept workspaces available.

### Demo flow

1. Start a mission inside the browser workspace.
2. Watch the agent roster coordinate a scripted sequence of tasks.
3. Review the decision log and pause at a payment or access-consent checkpoint.
4. Approve or deny the simulated action, then replay the event trail.

**Important:** These missions, account dialogs, wallet values, payment events, and connections are simulations. No actual Google, PayPal, crypto-wallet, or third-party account is connected by the demo.

## Prototype architecture

| Layer | Current prototype |
| --- | --- |
| Interface | Next.js 16, React 19, TypeScript, Tailwind CSS |
| UI workspaces | Main unified HTML/JavaScript interface plus React editions |
| Data | Browser-local demo state; optional Prisma + SQLite APIs in the server-backed editions |
| Agent missions | Scripted demo orchestration, approvals, recording, and replay |
| AI routes | Optional `z-ai-web-dev-sdk` paths; **not a verified Gemini integration** |
| Payments and OAuth | Mock interfaces and simulated events only |

The consolidated project contains the main UI and companion routes for **Money OS**, **Agents Edition**, **Guardian**, **Mission**, and **Classic Browser**. Technical design notes describe a possible Chrome Manifest V3 extension, capability-scoped execution, secure OAuth, enforceable approval policies, and Google AI/Cloud integration.

## Local setup

When the full source package is present in this repository, use Node.js **20.9+**:

```bash
npm install
cp .env.example .env
npm run db:generate
npm run db:push
npm run dev
```

Then open <http://localhost:3000>.

Useful checks:

```bash
npm run test:smoke
npm run typecheck
npm run build
```

**Repository note:** The project source was assembled separately as a unified package; the source files will need to be published here before these setup commands work from a fresh GitHub clone.

## Roadmap

- [x] Unified interactive UI and alternate concept views
- [x] Scripted six-agent mission runner with demo approvals and replay
- [x] Simulated Money OS and Workspace consent experiences
- [ ] Publish the consolidated source package and reproducible deployment
- [ ] Build a secure Chrome Manifest V3 extension proof of concept
- [ ] Integrate actual Gemini / Google Cloud APIs with permissioned tools
- [ ] Add real connector authorization, isolated execution, and auditable receipts
- [ ] Validate workflows with early users and teams

## Vision

**From browsing pages to completing goals — with a clear record of what every agent did and a human in charge.**

---

*Google Agentic Browser is an independent idea-stage prototype, not an official Google product or a replacement browser engine. Product names and marks belong to their respective owners.*
