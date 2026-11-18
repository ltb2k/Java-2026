-- ============================================================
-- Seed dữ liệu mẫu cho môi trường phát triển
-- Chỉ chạy khi database trống hoặc dev env
-- ============================================================

-- Admin user (password: Admin@2026!)
-- Hash được tạo bằng bcrypt với 10 rounds
INSERT INTO users (full_name, email, password_hash, role, status, is_active, email_verified) VALUES
('System Admin', 'admin@mushroom.local', '$2a$10$mfDkFVNEhv5GBN.QbCZUmO7QWIBlyB8EHt/Y4Hzl1DFT.P5oIvxFS', 'ADMIN', 'ACTIVE', TRUE, TRUE),
('Nguyen Van Operator', 'operator@mushroom.local', '$2a$10$mfDkFVNEhv5GBN.QbCZUmO7QWIBlyB8EHt/Y4Hzl1DFT.P5oIvxFS', 'OPERATOR', 'ACTIVE', TRUE, TRUE),
('Tran Thi Customer', 'customer@mushroom.local', '$2a$10$mfDkFVNEhv5GBN.QbCZUmO7QWIBlyB8EHt/Y4Hzl1DFT.P5oIvxFS', 'CUSTOMER', 'ACTIVE', TRUE, TRUE)
ON CONFLICT (email) DO NOTHING;

-- NOTE: password hash above corresponds to: Admin@2026!
-- Run `npm run create-admin` to regenerate the admin password securely.

-- Rooms
INSERT INTO rooms (name, location, status) VALUES
('Phòng A01', 'Khu A - Tầng 1', 'ACTIVE'),
('Phòng A02', 'Khu A - Tầng 1', 'ACTIVE'),
('Phòng B01', 'Khu B - Tầng 2', 'ACTIVE'),
('Phòng B02', 'Khu B - Tầng 2', 'MAINTENANCE'),
('Phòng C01', 'Khu C - Tầng 3', 'ACTIVE')
ON CONFLICT DO NOTHING;

-- Rental Packages
INSERT INTO rental_packages (name, duration_days, price, description, status) VALUES
('Gói 15 ngày', 15, 750000, 'Theo dõi khay nấm trong 15 ngày', 'ACTIVE'),
('Gói 30 ngày', 30, 1500000, 'Theo dõi khay nấm trong 30 ngày (phổ biến nhất)', 'ACTIVE'),
('Gói 60 ngày', 60, 2500000, 'Theo dõi khay nấm trong 60 ngày', 'ACTIVE')
ON CONFLICT DO NOTHING;

-- Trays (5 per room = 25 trays total)
INSERT INTO trays (code, room_id, status, growth_stage, mushroom_variety, growth_day, growth_total_days)
SELECT
  'TRAY-' || lpad(gs::text, 3, '0'),
  r.id,
  CASE WHEN gs % 5 = 0 THEN 'RENTED' WHEN gs % 7 = 0 THEN 'MAINTENANCE' ELSE 'AVAILABLE' END,
  CASE
    WHEN gs % 5 = 0 THEN 'FRUITING'
    WHEN gs % 3 = 0 THEN 'INCUBATION'
    ELSE 'PREPARATION'
  END,
  CASE gs % 3
    WHEN 0 THEN 'Nấm Bào Ngư Xám'
    WHEN 1 THEN 'Nấm Hương'
    ELSE 'Nấm Đầu Khỉ'
  END,
  (gs * 3 % 28) + 1,
  30
FROM generate_series(1, 25) AS gs
CROSS JOIN (SELECT id FROM rooms ORDER BY id LIMIT 1) AS r
ON CONFLICT (code) DO NOTHING;

-- Devices (sensors per room, actuators per tray)
INSERT INTO devices (name, device_type, room_id, is_on, status)
SELECT r.name || ' - Cảm biến', 'SENSOR_NODE', r.id, TRUE, 'ONLINE'
FROM rooms r ON CONFLICT DO NOTHING;

INSERT INTO devices (name, device_type, room_id, is_on, status)
SELECT r.name || ' - Quạt thông gió', 'FAN', r.id, FALSE, 'ONLINE'
FROM rooms r ON CONFLICT DO NOTHING;

INSERT INTO devices (name, device_type, room_id, is_on, status)
SELECT r.name || ' - Máy phun sương', 'MISTER', r.id, TRUE, 'ONLINE'
FROM rooms r ON CONFLICT DO NOTHING;

-- Environment Thresholds (defaults — SRS: không hard-code, nhưng seed với giá trị hợp lý)
INSERT INTO env_thresholds (metric, lower_bound, upper_bound, unit)
VALUES
  ('TEMPERATURE', 20.0, 30.0, '°C'),
  ('HUMIDITY', 70.0, 95.0, '%'),
  ('CO2', 400.0, 1200.0, 'ppm')
ON CONFLICT (metric) DO UPDATE SET
  lower_bound = EXCLUDED.lower_bound,
  upper_bound = EXCLUDED.upper_bound,
  unit = EXCLUDED.unit;

-- Sensor readings (sample data for 3 hours back)
INSERT INTO sensor_readings (room_id, sensor_type, value, unit, recorded_at)
SELECT
  r.id,
  s.sensor_type,
  CASE s.sensor_type
    WHEN 'TEMPERATURE' THEN (22 + random() * 6)::numeric(5,2)
    WHEN 'HUMIDITY' THEN (75 + random() * 15)::numeric(5,2)
    WHEN 'CO2' THEN (500 + random() * 400)::numeric(6,2)
  END,
  CASE s.sensor_type WHEN 'TEMPERATURE' THEN '°C' WHEN 'HUMIDITY' THEN '%' ELSE 'ppm' END,
  NOW() - (gs * INTERVAL '30 seconds')
FROM rooms r
CROSS JOIN (VALUES ('TEMPERATURE'), ('HUMIDITY'), ('CO2')) AS s(sensor_type)
CROSS JOIN generate_series(0, 23) AS gs;

-- Welcome alert
INSERT INTO alerts (room_id, metric, severity, title, message, status)
SELECT id, 'CO2', 'INFO', 'Hệ thống khởi động', 'Database đã được khởi tạo và sẵn sàng hoạt động.', 'ACTIVE'
FROM rooms WHERE name = 'Phòng A01'
ON CONFLICT DO NOTHING;
