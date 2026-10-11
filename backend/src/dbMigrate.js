const pool = require("./config/db");

async function migrate() {
  await pool.query(`
    ALTER TABLE iot_devices ADD COLUMN IF NOT EXISTS is_on BOOLEAN NOT NULL DEFAULT FALSE;
    ALTER TABLE iot_devices ADD COLUMN IF NOT EXISTS api_key TEXT;
    ALTER TABLE cameras ADD COLUMN IF NOT EXISTS room_id UUID REFERENCES cultivation_rooms(id) ON DELETE SET NULL;
    ALTER TABLE harvests ADD COLUMN IF NOT EXISTS customer_id UUID REFERENCES users(id) ON DELETE SET NULL;
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
}

module.exports = migrate;
