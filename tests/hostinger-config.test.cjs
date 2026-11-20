"use strict";

const assert = require("node:assert/strict");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");
const test = require("node:test");
const { inspectHostinger } = require("../scripts/check-hostinger.cjs");

test("Hostinger build generates Prisma Client automatically", () => {
  const pkg = require("../package.json");
  assert.equal(pkg.scripts.prebuild, "prisma generate");
  assert.match(pkg.scripts.build, /next build/);
  assert.equal(pkg.scripts["hostinger:check"], "node scripts/check-hostinger.cjs");
});

test("missing database URL is reported without exposing secrets", () => {
  const secret = "top-secret-gemini-value";
  const result = inspectHostinger({ GEMINI_API_KEY: secret }, { nodeVersion: "22.13.0" });
  assert.ok(result.errors.some(message => message.includes("DATABASE_URL")));
  assert.equal(JSON.stringify(result).includes(secret), false);
});

test("SQLite first deployment passes with a schema initialization warning", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "gab-hostinger-"));
  try {
    const result = inspectHostinger(
      { DATABASE_URL: "file:./dev.db", GEMINI_MAX_REQUESTS_PER_HOUR: "40" },
      { root, nodeVersion: "22.13.0" },
    );
    assert.equal(result.errors.length, 0);
    assert.ok(result.warnings.some(message => message.includes("initialize the schema")));
    assert.ok(result.warnings.some(message => message.includes("durability")));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("existing writable SQLite file does not trigger missing-file warning", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "gab-hostinger-"));
  try {
    fs.mkdirSync(path.join(root, "prisma"));
    fs.writeFileSync(path.join(root, "prisma", "dev.db"), "");
    const result = inspectHostinger({ DATABASE_URL: "file:./dev.db" }, { root, nodeVersion: "22.13.0" });
    assert.equal(result.errors.length, 0);
    assert.equal(result.warnings.some(message => message.includes("does not exist")), false);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("rejects PostgreSQL URLs until a Prisma migration is implemented", () => {
  const secret = "postgresql://admin:password@private-host/database";
  const result = inspectHostinger({ DATABASE_URL: secret }, { nodeVersion: "22.13.0" });
  assert.ok(result.errors.some(message => message.includes("Supabase/PostgreSQL")));
  assert.equal(JSON.stringify(result).includes(secret), false);
});

test("warns on incomplete OAuth and local callback without leaking credentials", () => {
  const result = inspectHostinger(
    {
      DATABASE_URL: "file:./dev.db",
      GOOGLE_OAUTH_CLIENT_ID: "sensitive-client-id",
      GOOGLE_OAUTH_REDIRECT_URI: "http://localhost:3000/api/google/oauth/callback",
    },
    { nodeVersion: "22.13.0" },
  );
  assert.ok(result.warnings.some(message => message.includes("partially configured")));
  assert.ok(result.warnings.some(message => message.includes("localhost")));
  assert.equal(JSON.stringify(result).includes("sensitive-client-id"), false);
});

test("rejects unsupported Node.js versions", () => {
  const result = inspectHostinger({ DATABASE_URL: "file:./dev.db" }, { nodeVersion: "20.11.0" });
  assert.ok(result.errors.some(message => message.includes("Node.js 22")));
});
