
require("dotenv").config();

const { Pool } = require("pg");

if (!process.env.DATABASE_URL) {
  throw new Error("Thiếu DATABASE_URL trong file backend/.env");
}

const pool = new Pool({
  connectionString: String(process.env.DATABASE_URL),
});

pool.on("error", (err) => {
  console.error("PostgreSQL pool error:", err);
});

module.exports = pool;
