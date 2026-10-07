CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TABLE IF NOT EXISTS roles (
  id SERIAL PRIMARY KEY,
  name VARCHAR(30) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  full_name VARCHAR(120) NOT NULL,
  email VARCHAR(160) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  role_id INT NOT NULL REFERENCES roles(id),
  phone VARCHAR(30),
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cultivation_rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  location VARCHAR(200),
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cultivation_trays (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES cultivation_rooms(id) ON DELETE SET NULL,
  code VARCHAR(60) UNIQUE NOT NULL,
  mushroom_type VARCHAR(120) NOT NULL,
  rack VARCHAR(50),
  status VARCHAR(30) NOT NULL DEFAULT 'AVAILABLE',
  growth_day INT NOT NULL DEFAULT 0,
  expected_harvest_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS rental_packages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  duration_days INT NOT NULL,
  price NUMERIC(12,2) NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS rentals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_id UUID NOT NULL REFERENCES users(id),
  tray_id UUID NOT NULL REFERENCES cultivation_trays(id),
  package_id UUID NOT NULL REFERENCES rental_packages(id),
  start_date DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date DATE,
  status VARCHAR(30) NOT NULL DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS iot_devices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID REFERENCES cultivation_rooms(id) ON DELETE SET NULL,
  name VARCHAR(100) NOT NULL,
  device_code VARCHAR(80) UNIQUE NOT NULL,
  device_type VARCHAR(40) NOT NULL DEFAULT 'ESP32',
  status VARCHAR(30) NOT NULL DEFAULT 'OFFLINE',
  last_seen TIMESTAMPTZ
);

CREATE TABLE IF NOT EXISTS sensors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id UUID REFERENCES iot_devices(id) ON DELETE CASCADE,
  sensor_type VARCHAR(40) NOT NULL,
  unit VARCHAR(20) NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE IF NOT EXISTS sensor_readings (
  id BIGSERIAL PRIMARY KEY,
  sensor_id UUID NOT NULL REFERENCES sensors(id) ON DELETE CASCADE,
  tray_id UUID REFERENCES cultivation_trays(id) ON DELETE SET NULL,
  value NUMERIC(12,3) NOT NULL,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sensor_readings_time ON sensor_readings(recorded_at DESC);
CREATE INDEX IF NOT EXISTS idx_sensor_readings_sensor ON sensor_readings(sensor_id);

CREATE TABLE IF NOT EXISTS cameras (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tray_id UUID REFERENCES cultivation_trays(id) ON DELETE SET NULL,
  name VARCHAR(100) NOT NULL,
  stream_url TEXT,
  status VARCHAR(30) NOT NULL DEFAULT 'OFFLINE',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cultivation_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tray_id UUID NOT NULL REFERENCES cultivation_trays(id) ON DELETE CASCADE,
  stage VARCHAR(80) NOT NULL,
  progress_percent NUMERIC(5,2) NOT NULL DEFAULT 0,
  note TEXT,
  recorded_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS harvests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tray_id UUID NOT NULL REFERENCES cultivation_trays(id),
  quantity_kg NUMERIC(10,2),
  harvest_date DATE NOT NULL DEFAULT CURRENT_DATE,
  delivery_requested BOOLEAN NOT NULL DEFAULT FALSE,
  status VARCHAR(30) NOT NULL DEFAULT 'PLANNED',
  note TEXT
);

CREATE TABLE IF NOT EXISTS notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(160) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(40) NOT NULL DEFAULT 'INFO',
  is_read BOOLEAN NOT NULL DEFAULT FALSE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS environment_thresholds (
  id SERIAL PRIMARY KEY,
  room_id UUID REFERENCES cultivation_rooms(id) ON DELETE CASCADE,
  temperature_min NUMERIC(6,2) DEFAULT 24,
  temperature_max NUMERIC(6,2) DEFAULT 28,
  humidity_min NUMERIC(6,2) DEFAULT 85,
  humidity_max NUMERIC(6,2) DEFAULT 95,
  co2_max NUMERIC(10,2) DEFAULT 800,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
