const pool = require("../config/db");

exports.list = async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT t.*, rm.name room_name, rm.code room_code
      FROM environment_thresholds t
      LEFT JOIN cultivation_rooms rm ON rm.id=t.room_id
      ORDER BY rm.name NULLS FIRST`);
    res.json(r.rows);
  } catch (e) { console.error("Controller request failed", { code: e.code || "UNKNOWN" }); return res.status(500).json({ message: "Internal server error" }); }
};

exports.upsert = async (req, res) => {
  try {
    const { roomId, temperatureMin, temperatureMax, humidityMin, humidityMax, co2Max } = req.body;
    const existing = await pool.query(
      roomId
        ? "SELECT id FROM environment_thresholds WHERE room_id=$1"
        : "SELECT id FROM environment_thresholds WHERE room_id IS NULL",
      roomId ? [roomId] : []);
    let r;
    if (existing.rowCount) {
      r = await pool.query(`
        UPDATE environment_thresholds SET
          temperature_min=COALESCE($1,temperature_min),
          temperature_max=COALESCE($2,temperature_max),
          humidity_min=COALESCE($3,humidity_min),
          humidity_max=COALESCE($4,humidity_max),
          co2_max=COALESCE($5,co2_max),
          updated_at=NOW()
        WHERE id=$6 RETURNING *`,
        [temperatureMin ?? null, temperatureMax ?? null, humidityMin ?? null,
          humidityMax ?? null, co2Max ?? null, existing.rows[0].id]);
    } else {
      r = await pool.query(`
        INSERT INTO environment_thresholds(room_id,temperature_min,temperature_max,humidity_min,humidity_max,co2_max)
        VALUES($1,$2,$3,$4,$5,$6) RETURNING *`,
        [roomId || null, temperatureMin ?? 24, temperatureMax ?? 28, humidityMin ?? 85, humidityMax ?? 95, co2Max ?? 800]);
    }
    res.json(r.rows[0]);
  } catch (e) { console.error("Controller request failed", { code: e.code || "UNKNOWN" }); return res.status(500).json({ message: "Internal server error" }); }
};
