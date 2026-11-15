# Contributing to Google Agentic Browser

Thanks for helping improve the prototype. Please use a pull request rather than pushing directly to the default branch when possible.

## Applications and setup

There are two independently installable Next.js applications. The root project is the browser showcase and `apps/ai-studio/` is the full-stack AI Studio workspace. Follow the relevant README for environment variables and local development. Both default to port 3000; run them separately or configure distinct ports.

Use Node.js 22 or a compatible later supported runtime and npm. For the root project:

```bash
npm ci
cp .env.example .env
npm run db:generate
npm run db:push
npm run dev
```

For AI Studio:

```bash
cd apps/ai-studio
npm ci
cp .env.example .env.local
npm run doctor
npm run dev
```

Never commit filled-in environment files or live keys.

## Quality checks

```bash
# Root
npm run lint
npm run typecheck
npm test
npm run build

# In apps/ai-studio
npm run lint
npm run typecheck
npm test
npm run build
```

Check CI for additional environment assumptions. PRs that touch both apps should verify both.

## Pull requests

Create a focused branch, describe the behavior change and add tests when practical. Use the pull request template. Link a related issue for substantial design changes.

Preserve verified Firebase authentication, bounded server-side AI access, safe URL handling, single-use human approvals, and the simulation-only payment boundary. Google Workspace write actions must remain gated and disabled by default unless a separately reviewed change explicitly specifies otherwise.

For security flaws, follow [SECURITY.md](SECURITY.md) instead of opening a public issue.
