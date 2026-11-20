# Hostinger deployment: agenticbrowser.live

This guide deploys **the repository-root Next.js showcase** on Hostinger while keeping the separate AI Studio (`apps/ai-studio`) on Vercel. The current repository does **not** contain a Supabase/PostgreSQL integration for the root Prisma database.

## Hostinger build form

| Setting | Value |
| --- | --- |
| Framework | Next.js |
| Node.js | 22.x (matches root GitHub CI) |
| Root directory | `./` |
| Package manager | npm |
| Build command | `npm run build` |
| Output directory | `.next` |

`npm run build` now invokes the package's `prebuild` hook to generate Prisma Client, then builds Next.js and copies the static assets into the standalone output. You can use `npx prisma generate && npm run build` if the form is already configured that way; it just generates the client twice.

The root package's start command launches `.next/standalone/server.js` with the repository's existing SQLite path normalization. Do not set the root directory to `apps/ai-studio`.

## Minimal initial environment

Set these values in **Hostinger's secure environment-variable form**, not in source control or chat:

```dotenv
DATABASE_URL=file:./dev.db
GEMINI_MAX_REQUESTS_PER_HOUR=40
```

- `GEMINI_API_KEY` is optional for a demo-only launch. Enter a real server-side key only when live Gemini calls are needed.
- OAuth requires `GOOGLE_OAUTH_CLIENT_ID`, `GOOGLE_OAUTH_CLIENT_SECRET`, `GOOGLE_OAUTH_REDIRECT_URI` (the exact production callback), and a strong `GOOGLE_SESSION_SECRET`. Configure the corresponding Google Cloud OAuth callback before enabling.
- Firebase variables are optional; enable them only when the root showcase's Firebase integration is configured and authorized for the production domain.
- Remove unused empty rows if Hostinger imports all 14 variables from `.env.example`. Never fill optional secrets with placeholder text.
- Do not expose Gemini, OAuth, or Supabase service-role secrets with a `NEXT_PUBLIC_` prefix.

## Database safety and first run

The current Prisma datasource is **SQLite** (`prisma/schema.prisma`). `DATABASE_URL=file:./dev.db` resolves relative to the Prisma schema, typically `prisma/dev.db`. The repository's standalone launcher normalizes this path.

**Generating Prisma Client does not initialize the SQLite tables.** For API routes that use Prisma, you must initialize the schema after configuring a writable database location. If you have SSH/terminal access and a verified backup, run:

```bash
npm run db:push
```

Do not run schema changes on a production database with existing data without reviewing the migration and backing up the database. The build does **not** automatically run `prisma db push`, reset a database, or delete data.

**Do not rely on SQLite for production user data until Hostinger confirms that its database file persists across deployments, restarts and scaling.** If the platform uses ephemeral storage, the showcase can still be demonstrated, but persistent API-backed notes and history need a supported durable database strategy.

A Supabase PostgreSQL connection string cannot be used in `DATABASE_URL` with the current `provider = "sqlite"`. A PostgreSQL migration requires schema changes, migration planning, data backup and regression testing. Do not paste Supabase credentials into the SQLite setting.

## Diagnostics and smoke test

After the build, run `npm run hostinger:check` in the application environment if shell access is available. It checks Node.js compatibility, whether `DATABASE_URL` is a SQLite URL, whether the SQLite file exists/is accessible, incomplete OAuth setup, and whether the standalone build exists. It **never prints credential values**, does not modify the database, and treats first-run missing tables as a warning.

Then verify:

1. `https://agenticbrowser.live` loads with HTTPS and the V3 showcase UI.
2. The homepage and browser panels render on desktop and mobile.
3. `npm run hostinger:check` reports no errors; address any warnings before storing user data.
4. API routes requiring the database work only after the schema is initialized and persistence is verified.
5. No secrets appear in the browser, build logs, or committed files.

## Keep AI Studio separate

- **Main website:** `agenticbrowser.live` — Hostinger, repository root.
- **AI Studio:** `app.agenticbrowser.live` — existing Vercel project, `apps/ai-studio`.
- **DNS:** The `app` CNAME should point to the Vercel-provided target `4f456db47a8c3394.vercel-dns-017.com`. Confirm the current target in Vercel before editing DNS. Keep Hostinger's root, `www`, and email records intact.
- **AI Studio backend:** Gemini and Firebase/Firestore remain on Vercel. This Hostinger deployment does not move or replace them.

Do not assume a GitHub build automatically means the Hostinger deployment succeeded; confirm the hosting deployment result and the live HTTPS website separately.
