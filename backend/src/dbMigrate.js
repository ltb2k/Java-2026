import { query, pool } from "./db.js";

export async function runMigrations() {
  console.log("Running database migrations...");
  try {
    // 1. Users table updates
    await query(`
      ALTER TABLE users
        ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        ADD COLUMN IF NOT EXISTS email_verified BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS verification_token TEXT,
        ADD COLUMN IF NOT EXISTS failed_login_attempts INT NOT NULL DEFAULT 0,
        ADD COLUMN IF NOT EXISTS locked_until TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    `);

    // 2. Rooms table updates
    await query(`
      ALTER TABLE rooms
        ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    `);

    // 3. Rental packages updates
    await query(`
      ALTER TABLE rental_packages
        ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    `);

    // 4. Trays table updates
    await query(`
      ALTER TABLE trays
        ADD COLUMN IF NOT EXISTS growth_stage VARCHAR(30) NOT NULL DEFAULT 'PREPARATION',
        ADD COLUMN IF NOT EXISTS is_archived BOOLEAN NOT NULL DEFAULT FALSE,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    `);

    // 5. Rentals table updates
    await query(`
      ALTER TABLE rentals
        ADD COLUMN IF NOT EXISTS package_id INT REFERENCES rental_packages(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS quantity INT NOT NULL DEFAULT 1,
        ADD COLUMN IF NOT EXISTS notes TEXT,
        ADD COLUMN IF NOT EXISTS rejection_reason TEXT,
        ADD COLUMN IF NOT EXISTS approved_by INT REFERENCES users(id),
        ADD COLUMN IF NOT EXISTS approved_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    `);

    // 6. Rental Trays mapping table
    await query(`
      CREATE TABLE IF NOT EXISTS rental_trays (
        rental_id INT NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
        tray_id INT NOT NULL REFERENCES trays(id) ON DELETE CASCADE,
        PRIMARY KEY (rental_id, tray_id)
      );
    `);

    // 7. Link codes table
    await query(`
      CREATE TABLE IF NOT EXISTS link_codes (
        id SERIAL PRIMARY KEY,
        rental_id INT NOT NULL REFERENCES rentals(id) ON DELETE CASCADE,
        code VARCHAR(32) NOT NULL UNIQUE,
        expires_at TIMESTAMPTZ NOT NULL,
        used_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 8. Devices table updates
    await query(`
      ALTER TABLE devices
        ADD COLUMN IF NOT EXISTS room_id INT REFERENCES rooms(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS status VARCHAR(30) NOT NULL DEFAULT 'ONLINE',
        ADD COLUMN IF NOT EXISTS last_seen_at TIMESTAMPTZ,
        ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    `);

    // 9. Environment Thresholds table
    await query(`
      CREATE TABLE IF NOT EXISTS env_thresholds (
        id SERIAL PRIMARY KEY,
        metric VARCHAR(30) UNIQUE NOT NULL CHECK (metric IN ('TEMPERATURE','HUMIDITY','CO2')),
        lower_bound NUMERIC(10,2) NOT NULL,
        upper_bound NUMERIC(10,2) NOT NULL,
        unit VARCHAR(20) NOT NULL,
        updated_by INT REFERENCES users(id),
        updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // Seed default thresholds if not present
    await query(`
      INSERT INTO env_thresholds (metric, lower_bound, upper_bound, unit)
      VALUES
        ('TEMPERATURE', 20.0, 30.0, '°C'),
        ('HUMIDITY', 70.0, 95.0, '%'),
        ('CO2', 400.0, 1200.0, 'ppm')
      ON CONFLICT (metric) DO NOTHING;
    `);

    // 10. Consecutive violations table
    await query(`
      CREATE TABLE IF NOT EXISTS consecutive_violations (
        id SERIAL PRIMARY KEY,
        room_id INT NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
        metric VARCHAR(30) NOT NULL CHECK (metric IN ('TEMPERATURE','HUMIDITY','CO2')),
        count INT NOT NULL DEFAULT 0,
        last_value NUMERIC(10,2),
        last_recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
        UNIQUE (room_id, metric)
      );
    `);

    // 11. Sensor readings table updates
    await query(`
      ALTER TABLE sensor_readings
        ADD COLUMN IF NOT EXISTS room_id INT REFERENCES rooms(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS device_id INT REFERENCES devices(id) ON DELETE SET NULL,
        ADD COLUMN IF NOT EXISTS unit VARCHAR(20),
        ADD COLUMN IF NOT EXISTS message_id VARCHAR(64);
    `);

    // 12. Alerts table updates
    await query(`
      ALTER TABLE alerts
        ADD COLUMN IF NOT EXISTS room_id INT REFERENCES rooms(id) ON DELETE CASCADE,
        ADD COLUMN IF NOT EXISTS metric VARCHAR(30),
        ADD COLUMN IF NOT EXISTS status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        ADD COLUMN IF NOT EXISTS resolved_at TIMESTAMPTZ;
    `);

    // 13. Device commands table
    await query(`
      CREATE TABLE IF NOT EXISTS device_commands (
        id SERIAL PRIMARY KEY,
        command_id VARCHAR(64) UNIQUE NOT NULL,
        device_id INT NOT NULL REFERENCES devices(id) ON DELETE CASCADE,
        action VARCHAR(50) NOT NULL,
        payload JSONB,
        status VARCHAR(30) NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING','ACKED','FAILED','TIMEOUT')),
        issued_by INT REFERENCES users(id),
        result TEXT,
        acked_at TIMESTAMPTZ,
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 14. Growth logs table
    await query(`
      CREATE TABLE IF NOT EXISTS growth_logs (
        id SERIAL PRIMARY KEY,
        tray_id INT NOT NULL REFERENCES trays(id) ON DELETE CASCADE,
        stage VARCHAR(30) NOT NULL CHECK (stage IN ('PREPARATION','INCUBATION','FRUITING','READY_TO_HARVEST','HARVESTED','COMPLETED')),
        notes TEXT,
        created_by INT REFERENCES users(id),
        created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
      );
    `);

    // 15. Harvests table updates
    await query(`
      ALTER TABLE harvests
        ADD COLUMN IF NOT EXISTS quality_grade VARCHAR(20) DEFAULT 'STANDARD',
        ADD COLUMN IF NOT EXISTS planned_date DATE,
        ADD COLUMN IF NOT EXISTS recorded_by INT REFERENCES users(id),
        ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ NOT NULL DEFAULT NOW();
    `);

    console.log("Migrations applied successfully.");
  } catch (error) {
    console.error("Migration error:", error);
    throw error;
  }
}

// If run directly: node src/dbMigrate.js
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigrations()
    .then(() => pool.end())
    .catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
