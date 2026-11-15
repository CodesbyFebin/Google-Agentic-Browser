// Create the SQLite file before Prisma's schema engine synchronizes tables.
// This also makes first-run initialization work in restricted containers.
const { loadDatabaseUrl } = require("./db-url.cjs");
try { loadDatabaseUrl(); }
catch (error) { console.error(error.message); process.exit(1); }

const { PrismaClient } = require("@prisma/client");
async function main() {
  const prisma = new PrismaClient();
  try {
    await prisma.$connect();
  } finally {
    await prisma.$disconnect();
  }
}
main().catch(error => { console.error("Database initialization failed:", error.message); process.exitCode = 1; });
