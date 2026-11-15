const path = require("node:path");
const { normalizeForStandalone } = require("./db-url.cjs");

normalizeForStandalone();
process.env.NODE_ENV = "production";
require(path.resolve(process.cwd(), ".next/standalone/server.js"));
