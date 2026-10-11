const pool = require("../config/db");

exports.list = async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT d.*, rm.name room_name, rm.code room_code
      FROM iot_devices d LEFT JOIN cultivation_rooms rm ON rm.id=d.room_id
      ORDER BY d.name`);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.create = async (req, res) => {
  try {
    const { roomId, name, deviceCode, deviceType, apiKey } = req.body;
    const r = await pool.query(`
      INSERT INTO iot_devices(room_id,name,device_code,device_type,api_key)
      VALUES($1,$2,$3,$4,$5) RETURNING *`,
      [roomId || null, name, deviceCode, deviceType || "ESP32", apiKey || null]);
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(400).json({ message: e.message }); }
};

exports.update = async (req, res) => {
  try {
    const { name, roomId, deviceType, status, apiKey } = req.body;
    const r = await pool.query(`
      UPDATE iot_devices SET
        name=COALESCE($1,name), room_id=COALESCE($2,room_id),
        device_type=COALESCE($3,device_type), status=COALESCE($4,status),
        api_key=COALESCE($5,api_key)
      WHERE id=$6 RETURNING *`,
      [name || null, roomId || null, deviceType || null, status || null, apiKey ?? null, req.params.id]);
    if (!r.rowCount) return res.status(404).json({ message: "Device not found" });
    res.json(r.rows[0]);
  } catch (e) { res.status(400).json({ message: e.message }); }
};

exports.toggle = async (req, res) => {
  try {
    const current = await pool.query("SELECT * FROM iot_devices WHERE id=$1", [req.params.id]);
    if (!current.rowCount) return res.status(404).json({ message: "Device not found" });
    const nextOn = typeof req.body.isOn === "boolean" ? req.body.isOn : !current.rows[0].is_on;
    const status = req.body.status || (nextOn ? "ONLINE" : "OFFLINE");
    const r = await pool.query(`
      UPDATE iot_devices SET is_on=$1, status=$2 WHERE id=$3 RETURNING *`,
      [nextOn, status, req.params.id]);
    res.json(r.rows[0]);
  } catch (e) { res.status(400).json({ message: e.message }); }
};

exports.remove = async (req, res) => {
  try {
    const r = await pool.query("DELETE FROM iot_devices WHERE id=$1 RETURNING id", [req.params.id]);
    if (!r.rowCount) return res.status(404).json({ message: "Device not found" });
    res.json({ deleted: true });
  } catch (e) { res.status(400).json({ message: e.message }); }
};

exports.commands = async (req, res) => {
  try {
    const { deviceCode, roomId } = req.query;
    let sql = "SELECT device_code,device_type,is_on,status FROM iot_devices WHERE 1=1";
    const params = [];
    if (deviceCode) {
      const hub = await pool.query("SELECT room_id FROM iot_devices WHERE device_code=$1", [deviceCode]);
      if (!hub.rowCount) return res.status(404).json({ message: "Unknown device" });
      params.push(hub.rows[0].room_id);
      sql += ` AND room_id=$${params.length} AND device_type IN ('MIST','FAN','LED','HEATER')`;
    } else if (roomId) {
      params.push(roomId);
      sql += ` AND room_id=$${params.length}`;
    }
    const r = await pool.query(sql, params);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
};
