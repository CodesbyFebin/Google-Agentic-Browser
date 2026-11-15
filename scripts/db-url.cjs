const fs = require("node:fs");
const path = require("node:path");

function loadDatabaseUrl(projectRoot = process.cwd()) {
  if (!process.env.DATABASE_URL) {
    const envPath = path.join(projectRoot, ".env");
    if (fs.existsSync(envPath)) {
      const match = fs.readFileSync(envPath, "utf8").match(/^\s*DATABASE_URL\s*=\s*(.+)\s*$/m);
      if (match) {
        const value = match[1].trim();
        process.env.DATABASE_URL = value.replace(/^(["'])(.*)\1$/, "$2");
      }
    }
  }
  if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is missing. Copy .env.example to .env or set DATABASE_URL.");
  }
  return process.env.DATABASE_URL;
}

function normalizeForStandalone(projectRoot = process.cwd()) {
  const url = loadDatabaseUrl(projectRoot);
  if (url.startsWith("file:") && !url.startsWith("file:/")) {
    // Prisma's SQLite `file:./dev.db` is relative to prisma/schema.prisma.
    // The standalone server has a different generated-client directory.
    process.env.DATABASE_URL = "file:" + path.resolve(projectRoot, "prisma", url.slice(5));
  }
  return process.env.DATABASE_URL;
}

module.exports = { loadDatabaseUrl, normalizeForStandalone };
