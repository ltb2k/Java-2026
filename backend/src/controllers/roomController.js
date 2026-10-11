const pool = require("../config/db");

exports.list = async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT rm.*,
        (SELECT COUNT(*)::int FROM cultivation_trays t WHERE t.room_id=rm.id) tray_count
      FROM cultivation_rooms rm ORDER BY rm.created_at DESC`);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.create = async (req, res) => {
  try {
    const { name, code, location, status } = req.body;
    const r = await pool.query(
      "INSERT INTO cultivation_rooms(name,code,location,status) VALUES($1,$2,$3,$4) RETURNING *",
      [name, code, location || null, status || "ACTIVE"]);
    await pool.query(
      `INSERT INTO environment_thresholds(room_id) VALUES($1)
       ON CONFLICT DO NOTHING`, [r.rows[0].id]).catch(() => {});
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(400).json({ message: e.message }); }
};

exports.update = async (req, res) => {
  try {
    const { name, code, location, status } = req.body;
    const r = await pool.query(`
      UPDATE cultivation_rooms SET
        name=COALESCE($1,name), code=COALESCE($2,code),
        location=COALESCE($3,location), status=COALESCE($4,status)
      WHERE id=$5 RETURNING *`,
      [name || null, code || null, location ?? null, status || null, req.params.id]);
    if (!r.rowCount) return res.status(404).json({ message: "Room not found" });
    res.json(r.rows[0]);
  } catch (e) { res.status(400).json({ message: e.message }); }
};

exports.remove = async (req, res) => {
  try {
    const r = await pool.query("DELETE FROM cultivation_rooms WHERE id=$1 RETURNING id", [req.params.id]);
    if (!r.rowCount) return res.status(404).json({ message: "Room not found" });
    res.json({ deleted: true });
  } catch (e) { res.status(400).json({ message: e.message }); }
};
