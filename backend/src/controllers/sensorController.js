const pool = require("../config/db");
const { notifyStaffAndRoomCustomers } = require("../utils/notify");

async function thresholdsForRoom(roomId) {
  const r = await pool.query(`
    SELECT * FROM environment_thresholds
    WHERE room_id=$1 OR room_id IS NULL
    ORDER BY room_id NULLS LAST LIMIT 1`, [roomId]);
  return r.rows[0] || {
    temperature_min: 24, temperature_max: 28, humidity_min: 85, humidity_max: 95, co2_max: 800
  };
}

async function applyAutoControl(roomId, values, th) {
  const desired = { MIST: null, FAN: null, HEATER: null, LED: null };
  if (values.humidity != null && values.humidity < Number(th.humidity_min)) desired.MIST = true;
  if (values.humidity != null && values.humidity > Number(th.humidity_max)) desired.MIST = false;
  if (values.temperature != null && values.temperature > Number(th.temperature_max)) desired.FAN = true;
  if (values.temperature != null && values.temperature < Number(th.temperature_min)) {
    desired.HEATER = true;
    desired.FAN = false;
  }
  if (values.co2 != null && values.co2 > Number(th.co2_max)) desired.FAN = true;
  const actuators = [];
  for (const [type, on] of Object.entries(desired)) {
    if (on == null) continue;
    const r = await pool.query(`
      UPDATE iot_devices SET is_on=$1, status=CASE WHEN $1 THEN 'ONLINE' ELSE status END
      WHERE room_id=$2 AND device_type=$3 RETURNING device_code,device_type,is_on`,
      [on, roomId, type]);
    actuators.push(...r.rows);
  }
  return actuators;
}

exports.latest = async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT DISTINCT ON (s.sensor_type) s.sensor_type,s.unit,sr.value,sr.recorded_at,t.code tray_code
      FROM sensor_readings sr JOIN sensors s ON s.id=sr.sensor_id
      LEFT JOIN cultivation_trays t ON t.id=sr.tray_id
      ORDER BY s.sensor_type,sr.recorded_at DESC`);
    res.json(r.rows);
  } catch (e) { console.error("Controller request failed", { code: e.code || "UNKNOWN" }); return res.status(500).json({ message: "Internal server error" }); }
};

exports.history = async (req, res) => {
  try {
    const hours = Number(req.query.hours || 24);
    const r = await pool.query(`
      SELECT s.sensor_type,s.unit,sr.value,sr.recorded_at,t.code tray_code
      FROM sensor_readings sr JOIN sensors s ON s.id=sr.sensor_id
      LEFT JOIN cultivation_trays t ON t.id=sr.tray_id
      WHERE sr.recorded_at >= NOW()-($1||' hours')::interval
      ORDER BY sr.recorded_at ASC`, [hours]);
    res.json(r.rows);
  } catch (e) { console.error("Controller request failed", { code: e.code || "UNKNOWN" }); return res.status(500).json({ message: "Internal server error" }); }
};

exports.ingest = async (req, res) => {
  try {
    const body = req.body || {};
    const { deviceCode, temperature, humidity, co2, trayCode } = body;
    if (typeof deviceCode !== "string" || !deviceCode.trim() ||
        [temperature, humidity, co2].some((value) => value != null && (typeof value !== "number" || !Number.isFinite(value))) ||
        (trayCode != null && typeof trayCode !== "string")) {
      return res.status(400).json({ message: "Invalid sensor payload" });
    }
    const d = await pool.query("SELECT * FROM iot_devices WHERE device_code=$1", [deviceCode]);
    if (!d.rowCount) return res.status(404).json({ message: "Unknown device" });
    const device = d.rows[0];
    const providedKey = req.headers["x-device-key"] || req.body.apiKey;
    const expected = device.api_key || process.env.IOT_INGEST_KEY;
    if (!expected) return res.status(503).json({ message: "Device authentication is not configured" });
    if (typeof providedKey !== "string" || providedKey !== expected) {
      return res.status(401).json({ message: "Invalid device key" });
    }
    const tray = trayCode
      ? await pool.query("SELECT id FROM cultivation_trays WHERE code=$1", [trayCode])
      : { rowCount: 0 };
    const sensors = await pool.query("SELECT id,sensor_type FROM sensors WHERE device_id=$1 AND is_active=true", [device.id]);
    const map = { TEMPERATURE: temperature, HUMIDITY: humidity, CO2: co2 };
    for (const s of sensors.rows) {
      if (map[s.sensor_type] !== undefined && map[s.sensor_type] !== null) {
        await pool.query("INSERT INTO sensor_readings(sensor_id,tray_id,value) VALUES($1,$2,$3)",
          [s.id, tray.rowCount ? tray.rows[0].id : null, map[s.sensor_type]]);
      }
    }
    await pool.query("UPDATE iot_devices SET status='ONLINE', last_seen=NOW() WHERE id=$1", [device.id]);

    const th = await thresholdsForRoom(device.room_id);
    const alerts = [];
    if (temperature != null && (temperature < th.temperature_min || temperature > th.temperature_max)) {
      alerts.push(`Nhiệt độ ${temperature}°C ngoài ngưỡng ${th.temperature_min}–${th.temperature_max}°C`);
    }
    if (humidity != null && (humidity < th.humidity_min || humidity > th.humidity_max)) {
      alerts.push(`Độ ẩm ${humidity}% ngoài ngưỡng ${th.humidity_min}–${th.humidity_max}%`);
    }
    if (co2 != null && co2 > th.co2_max) {
      alerts.push(`CO₂ ${co2} ppm vượt mức tối đa ${th.co2_max} ppm`);
    }
    if (alerts.length && device.room_id) {
      await notifyStaffAndRoomCustomers(device.room_id, "Cảnh báo môi trường", alerts.join(". "), "ALERT");
    }
    const actuators = device.room_id
      ? await applyAutoControl(device.room_id, { temperature, humidity, co2 }, th)
      : [];
    res.status(201).json({ message: "Sensor data accepted", alerts, actuators });
  } catch (e) { console.error("Controller request failed", { code: e.code || "UNKNOWN" }); return res.status(500).json({ message: "Internal server error" }); }
};
