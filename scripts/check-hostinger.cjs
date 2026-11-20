#!/usr/bin/env node
"use strict";

// Read-only Hostinger deployment diagnostics. Never print environment variable values.
const fs = require("node:fs");
const path = require("node:path");

function inspectHostinger(env = process.env, options = {}) {
  const root = options.root || process.cwd();
  const nodeVersion = options.nodeVersion || process.versions.node;
  const errors = [];
  const warnings = [];
  const info = [];

  const major = Number(String(nodeVersion).split(".")[0]);
  if (!Number.isInteger(major) || major < 22) {
    errors.push("Node.js 22 or newer is required for the supported Hostinger build.");
  } else if (major !== 22) {
    info.push("Node.js 22.x is the version used by the root application's GitHub CI.");
  }

  const databaseUrl = (env.DATABASE_URL || "").trim();
  if (!databaseUrl) {
    errors.push("DATABASE_URL is missing. Set it in Hostinger's environment-variable form.");
  } else if (!databaseUrl.startsWith("file:")) {
    errors.push("DATABASE_URL is not a SQLite file URL. The current Prisma schema uses SQLite; a Supabase/PostgreSQL URL requires a tested migration first.");
  } else {
    const dbFile = databaseUrl.slice(5);
    if (!dbFile || dbFile === ":memory:") {
      errors.push("DATABASE_URL must point to a SQLite file, not an empty or in-memory database.");
    } else {
      const absolutePath = path.isAbsolute(dbFile)
        ? dbFile
        : path.resolve(root, "prisma", dbFile);
      if (!fs.existsSync(absolutePath)) {
        warnings.push("SQLite database file does not exist yet. Prisma Client generation alone does not create tables; initialize the schema after configuring persistent storage.");
      } else {
        try {
          fs.accessSync(absolutePath, fs.constants.R_OK | fs.constants.W_OK);
        } catch {
          errors.push("SQLite database file is not readable and writable by the application process.");
        }
      }
      warnings.push("SQLite durability depends on Hostinger's filesystem and deployment lifecycle. Verify persistence before saving real user data.");
    }
  }

  if (!env.GEMINI_API_KEY) {
    info.push("GEMINI_API_KEY is not configured; live Gemini requests are unavailable.");
  }

  const oauthKeys = ["GOOGLE_OAUTH_CLIENT_ID", "GOOGLE_OAUTH_CLIENT_SECRET", "GOOGLE_OAUTH_REDIRECT_URI", "GOOGLE_SESSION_SECRET"];
  const configuredOauth = oauthKeys.filter(key => Boolean(env[key]));
  if (configuredOauth.length > 0 && configuredOauth.length < oauthKeys.length) {
    warnings.push("Google OAuth is only partially configured. Provide all four OAuth/session variables to enable the integration.");
  }
  if (env.GOOGLE_OAUTH_REDIRECT_URI && /localhost|127\.0\.0\.1/i.test(env.GOOGLE_OAUTH_REDIRECT_URI)) {
    warnings.push("Google OAuth redirect URI still targets localhost; configure the production callback before enabling OAuth.");
  }
  if (env.GOOGLE_SESSION_SECRET && env.GOOGLE_SESSION_SECRET.length < 32) {
    warnings.push("GOOGLE_SESSION_SECRET should be a cryptographically random value of at least 32 characters.");
  }

  if (!fs.existsSync(path.join(root, ".next", "standalone", "server.js"))) {
    info.push("Standalone server build not found yet. Run npm run build before starting the app.");
  }

  return { errors, warnings, info };
}

if (require.main === module) {
  const result = inspectHostinger();
  for (const message of result.errors) console.error("ERROR:", message);
  for (const message of result.warnings) console.warn("WARNING:", message);
  for (const message of result.info) console.log("INFO:", message);
  if (!result.errors.length) console.log("Hostinger configuration check: PASS (review warnings above).");
  process.exitCode = result.errors.length ? 1 : 0;
}

module.exports = { inspectHostinger };
