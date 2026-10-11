const pool = require("../config/db");

exports.list = async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT d.id,d.room_id,d.name,d.device_code,d.device_type,d.status,d.is_on,d.last_seen,
        CASE WHEN d.last_seen IS NOT NULL AND d.last_seen >= NOW()-INTERVAL '5 minutes' THEN 'ONLINE' ELSE 'NOT_CONNECTED' END connection_status,
        rm.name room_name, rm.code room_code
      FROM iot_devices d LEFT JOIN cultivation_rooms rm ON rm.id=d.room_id
      ORDER BY d.name`);
    res.json(r.rows);
  } catch (e) { console.error("Controller request failed", { code: e.code || "UNKNOWN" }); return res.status(500).json({ message: "Internal server error" }); }
};

exports.create = async (req, res) => {
  try {
    const { roomId, name, deviceCode, deviceType, apiKey } = req.body;
    const r = await pool.query(`
      INSERT INTO iot_devices(room_id,name,device_code,device_type,api_key)
      VALUES($1,$2,$3,$4,$5)
      RETURNING id,room_id,name,device_code,device_type,status,is_on,last_seen`,
      [roomId || null, name, deviceCode, deviceType || "ESP32", apiKey || null]);
    res.status(201).json(r.rows[0]);
  } catch (e) { console.error("Controller request failed", { code: e.code || "UNKNOWN" }); return res.status(500).json({ message: "Internal server error" }); }
};

exports.update = async (req, res) => {
  try {
    const { name, roomId, deviceType, status, apiKey } = req.body;
    const r = await pool.query(`
      UPDATE iot_devices SET
        name=COALESCE($1,name), room_id=COALESCE($2,room_id),
        device_type=COALESCE($3,device_type), status=COALESCE($4,status),
        api_key=COALESCE($5,api_key)
      WHERE id=$6 RETURNING id,room_id,name,device_code,device_type,status,is_on,last_seen`,
      [name || null, roomId || null, deviceType || null, status || null, apiKey ?? null, req.params.id]);
    if (!r.rowCount) return res.status(404).json({ message: "Device not found" });
    res.json(r.rows[0]);
  } catch (e) { console.error("Controller request failed", { code: e.code || "UNKNOWN" }); return res.status(500).json({ message: "Internal server error" }); }
};

exports.toggle = async (req, res) => {
  try {
    const current = await pool.query("SELECT id,is_on FROM iot_devices WHERE id=$1", [req.params.id]);
    if (!current.rowCount) return res.status(404).json({ message: "Device not found" });
    const nextOn = typeof req.body.isOn === "boolean" ? req.body.isOn : !current.rows[0].is_on;
    const status = req.body.status || (nextOn ? "ONLINE" : "OFFLINE");
    const r = await pool.query(`
      UPDATE iot_devices SET is_on=$1, status=$2 WHERE id=$3
      RETURNING id,room_id,name,device_code,device_type,status,is_on,last_seen`,
      [nextOn, status, req.params.id]);
    res.json(r.rows[0]);
  } catch (e) { console.error("Controller request failed", { code: e.code || "UNKNOWN" }); return res.status(500).json({ message: "Internal server error" }); }
};

exports.remove = async (req, res) => {
  try {
    const r = await pool.query("DELETE FROM iot_devices WHERE id=$1 RETURNING id", [req.params.id]);
    if (!r.rowCount) return res.status(404).json({ message: "Device not found" });
    res.json({ deleted: true });
  } catch (e) { console.error("Controller request failed", { code: e.code || "UNKNOWN" }); return res.status(500).json({ message: "Internal server error" }); }
};

exports.commands = async (req, res) => {
  try {
    const deviceCode = typeof req.query.deviceCode === "string" ? req.query.deviceCode.trim() : "";
    if (!deviceCode) return res.status(400).json({ message: "Device code is required" });
    const hub = await pool.query("SELECT room_id,api_key FROM iot_devices WHERE device_code=$1", [deviceCode]);
    if (!hub.rowCount) return res.status(404).json({ message: "Unknown device" });
    const expected = hub.rows[0].api_key || process.env.IOT_INGEST_KEY;
    if (!expected) return res.status(503).json({ message: "Device authentication is not configured" });
    const provided = req.headers["x-device-key"];
    if (typeof provided !== "string" || provided !== expected) {
      return res.status(401).json({ message: "Invalid device key" });
    }
    if (!hub.rows[0].room_id) return res.json([]);
    const r = await pool.query(`
      SELECT device_code,device_type,is_on,status FROM iot_devices
      WHERE room_id=$1 AND device_type IN ('MIST','FAN','LED','HEATER')`, [hub.rows[0].room_id]);
    res.json(r.rows);
  } catch (e) { console.error("Controller request failed", { code: e.code || "UNKNOWN" }); return res.status(500).json({ message: "Internal server error" }); }
};
