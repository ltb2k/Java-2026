INSERT INTO rooms (name, location) VALUES
('Phòng 01', 'Khu A - Kệ 03')
ON CONFLICT DO NOTHING;

INSERT INTO rental_packages (name, duration_days, price, description) VALUES
('Gói 30 ngày', 30, 1500000, 'Theo dõi khay nấm trong 30 ngày')
ON CONFLICT DO NOTHING;

INSERT INTO trays (code, room_id, package_id, status, growth_day, growth_total_days, mushroom_variety)
SELECT 'TRAY-A101', r.id, p.id, 'RENTED', 14, 30, 'Nấm Bào Ngư Xám'
FROM rooms r, rental_packages p
WHERE r.name='Phòng 01' AND p.name='Gói 30 ngày'
AND NOT EXISTS (SELECT 1 FROM trays WHERE code='TRAY-A101');

INSERT INTO devices (name, device_type, tray_id, is_on)
SELECT 'Máy phun sương', 'MISTER', id, TRUE FROM trays WHERE code='TRAY-A101'
AND NOT EXISTS (SELECT 1 FROM devices WHERE device_type='MISTER');

INSERT INTO devices (name, device_type, tray_id, is_on)
SELECT 'Quạt thông gió', 'FAN', id, FALSE FROM trays WHERE code='TRAY-A101'
AND NOT EXISTS (SELECT 1 FROM devices WHERE device_type='FAN');

INSERT INTO devices (name, device_type, tray_id, is_on)
SELECT 'Đèn LED tán xạ', 'LED', id, TRUE FROM trays WHERE code='TRAY-A101'
AND NOT EXISTS (SELECT 1 FROM devices WHERE device_type='LED');

INSERT INTO sensor_readings (tray_id, sensor_type, value, recorded_at)
SELECT t.id, x.sensor_type, x.value, NOW() - x.offset_minutes * INTERVAL '1 minute'
FROM trays t
CROSS JOIN (VALUES
 ('TEMPERATURE', 25.8, 0),
 ('HUMIDITY', 89.2, 0),
 ('CO2', 640, 0),
 ('TEMPERATURE', 26.5, 180),
 ('HUMIDITY', 90.0, 180),
 ('CO2', 680, 180),
 ('TEMPERATURE', 24.8, 360),
 ('HUMIDITY', 92.0, 360),
 ('CO2', 610, 360)
) AS x(sensor_type, value, offset_minutes)
WHERE t.code='TRAY-A101';

INSERT INTO alerts (tray_id, severity, title, message)
SELECT id, 'INFO', 'Hệ thống sẵn sàng', 'Database đã được khởi tạo thành công.'
FROM trays WHERE code='TRAY-A101'
AND NOT EXISTS (SELECT 1 FROM alerts WHERE title='Hệ thống sẵn sàng');
