INSERT INTO roles(name) VALUES
('ADMIN'), ('FARM_OPERATOR'), ('CUSTOMER')
ON CONFLICT (name) DO NOTHING;

INSERT INTO cultivation_rooms(name, code, location)
VALUES ('Phòng trồng 01','ROOM-01','Khu A')
ON CONFLICT (code) DO NOTHING;

INSERT INTO rental_packages(name,duration_days,price,description)
VALUES
('Gói 30 ngày',30,1500000,'Thuê 1 khay trong 30 ngày'),
('Gói 60 ngày',60,2700000,'Thuê 1 khay trong 60 ngày')
ON CONFLICT DO NOTHING;

INSERT INTO cultivation_trays(room_id,code,mushroom_type,rack,status,growth_day,expected_harvest_date)
SELECT id,'TRAY-A101','Nấm Bào Ngư Xám','Kệ 03','RENTED',14,CURRENT_DATE+16
FROM cultivation_rooms WHERE code='ROOM-01'
ON CONFLICT (code) DO NOTHING;

INSERT INTO iot_devices(room_id,name,device_code,status,last_seen)
SELECT id,'ESP32 Room 01','ESP32-ROOM-01','ONLINE',NOW()
FROM cultivation_rooms WHERE code='ROOM-01'
ON CONFLICT (device_code) DO NOTHING;

INSERT INTO sensors(device_id,sensor_type,unit)
SELECT id,'TEMPERATURE','°C' FROM iot_devices WHERE device_code='ESP32-ROOM-01'
AND NOT EXISTS (SELECT 1 FROM sensors s JOIN iot_devices d ON d.id=s.device_id WHERE d.device_code='ESP32-ROOM-01' AND s.sensor_type='TEMPERATURE');

INSERT INTO sensors(device_id,sensor_type,unit)
SELECT id,'HUMIDITY','%' FROM iot_devices WHERE device_code='ESP32-ROOM-01'
AND NOT EXISTS (SELECT 1 FROM sensors s JOIN iot_devices d ON d.id=s.device_id WHERE d.device_code='ESP32-ROOM-01' AND s.sensor_type='HUMIDITY');

INSERT INTO sensors(device_id,sensor_type,unit)
SELECT id,'CO2','ppm' FROM iot_devices WHERE device_code='ESP32-ROOM-01'
AND NOT EXISTS (SELECT 1 FROM sensors s JOIN iot_devices d ON d.id=s.device_id WHERE d.device_code='ESP32-ROOM-01' AND s.sensor_type='CO2');

INSERT INTO cameras(tray_id,name,stream_url,status)
SELECT id,'Camera TRAY-A101','', 'ONLINE'
FROM cultivation_trays WHERE code='TRAY-A101'
AND NOT EXISTS (SELECT 1 FROM cameras c JOIN cultivation_trays t ON t.id=c.tray_id WHERE t.code='TRAY-A101');
