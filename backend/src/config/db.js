const { Pool } = require("pg");
require("dotenv").config();

function validateDatabaseUrl(value = process.env.DATABASE_URL) {
  if (!value) throw new Error("DATABASE_URL is required");
  let parsed;
  try { parsed = new URL(value); } catch { throw new Error("DATABASE_URL must be a valid PostgreSQL URL"); }
  if (!["postgres:", "postgresql:"].includes(parsed.protocol) || !parsed.hostname || !parsed.pathname || parsed.pathname === "/") {
    throw new Error("DATABASE_URL must point to a PostgreSQL database");
  }
}

validateDatabaseUrl();
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
pool.on("error", err => console.error("PostgreSQL pool error", { code: err.code || "UNKNOWN" }));
module.exports = pool;
