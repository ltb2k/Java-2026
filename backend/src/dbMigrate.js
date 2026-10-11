const pool = require("./config/db");

const REQUIRED_TABLES = ["roles", "users", "rentals", "cultivation_rooms", "iot_devices", "cameras", "harvests"];

async function verifySchema() {
  const tables = await pool.query(
    "SELECT name, to_regclass('public.' || name) AS relation FROM unnest($1::text[]) AS name",
    [[...REQUIRED_TABLES, "transactions"]]
  );
  const missing = tables.rows.filter((row) => !row.relation).map((row) => row.name);
  if (missing.length) {
    throw new Error(`Database schema is missing required tables: ${missing.join(", ")}. Apply database/schema.sql or run npm run db:migrate after reviewing the database.`);
  }
  const index = await pool.query("SELECT to_regclass('public.users_email_lower_uidx') AS relation");
  if (!index.rows[0].relation) {
    throw new Error("Database schema is missing the case-insensitive email index. Run npm run db:migrate after reviewing the database.");
  }
}

async function migrate() {
  const tables = await pool.query(
    "SELECT name, to_regclass('public.' || name) AS relation FROM unnest($1::text[]) AS name",
    [REQUIRED_TABLES]
  );
  const missing = tables.rows.filter((row) => !row.relation).map((row) => row.name);
  if (missing.length) {
    throw new Error(`Base schema is missing required tables: ${missing.join(", ")}. Apply database/schema.sql first.`);
  }

  const duplicateEmails = await pool.query(`
    SELECT 1 FROM users GROUP BY lower(email) HAVING count(*) > 1 LIMIT 1`);
  if (duplicateEmails.rowCount) {
    throw new Error("Duplicate emails differing only by case must be resolved before startup.");
  }

  const client = await pool.connect();
  try {
    await client.query("BEGIN");
    await client.query(`
      ALTER TABLE iot_devices ADD COLUMN IF NOT EXISTS is_on BOOLEAN NOT NULL DEFAULT FALSE;
      ALTER TABLE iot_devices ADD COLUMN IF NOT EXISTS api_key TEXT;
      ALTER TABLE cameras ADD COLUMN IF NOT EXISTS room_id UUID REFERENCES cultivation_rooms(id) ON DELETE SET NULL;
      ALTER TABLE harvests ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES users(id) ON DELETE SET NULL;
      CREATE UNIQUE INDEX IF NOT EXISTS users_email_lower_uidx ON users (lower(email));
      CREATE TABLE IF NOT EXISTS transactions (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        rental_id UUID REFERENCES rentals(id) ON DELETE CASCADE,
        customer_id UUID NOT NULL REFERENCES users(id),
        amount NUMERIC(12,2) NOT NULL,
        method VARCHAR(30) NOT NULL DEFAULT 'OFFLINE',
        status VARCHAR(30) NOT NULL DEFAULT 'RECORDED',
        note TEXT,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);
    await client.query("COMMIT");
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    throw error;
  } finally {
    client.release();
  }
}

module.exports = migrate;
module.exports.verifySchema = verifySchema;

if (require.main === module) {
  migrate().then(() => {
    console.log("Database migration completed.");
  }).catch((error) => {
    console.error("Database migration failed.");
    if (error.message.includes("missing required tables") || error.message.includes("Duplicate emails")) {
      console.error(error.message);
    }
    process.exitCode = 1;
  }).finally(() => pool.end());
}
