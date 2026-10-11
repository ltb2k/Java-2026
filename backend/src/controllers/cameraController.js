const pool = require("../config/db");

exports.list = async (req, res) => {
  try {
    const staff = req.user.role === "ADMIN" || req.user.role === "FARM_OPERATOR";
    const params = [];
    let join = `FROM cameras c
      LEFT JOIN cultivation_trays t ON t.id=c.tray_id
      LEFT JOIN cultivation_rooms rm ON rm.id=COALESCE(c.room_id,t.room_id)`;
    let where = "";
    if (!staff) {
      params.push(req.user.id);
      join += ` JOIN rentals rent ON rent.tray_id=t.id AND rent.status='ACTIVE' AND rent.customer_id=$1`;
    }
    const r = await pool.query(`
      SELECT c.*, t.code tray_code, rm.name room_name ${join} ${where}
      ORDER BY c.created_at DESC`, params);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.create = async (req, res) => {
  try {
    const { trayId, roomId, name, streamUrl, status } = req.body;
    const r = await pool.query(`
      INSERT INTO cameras(tray_id,room_id,name,stream_url,status)
      VALUES($1,$2,$3,$4,$5) RETURNING *`,
      [trayId || null, roomId || null, name, streamUrl || null, status || "OFFLINE"]);
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(400).json({ message: e.message }); }
};

exports.update = async (req, res) => {
  try {
    const { name, streamUrl, status, trayId, roomId } = req.body;
    const r = await pool.query(`
      UPDATE cameras SET
        name=COALESCE($1,name), stream_url=COALESCE($2,stream_url),
        status=COALESCE($3,status), tray_id=COALESCE($4,tray_id), room_id=COALESCE($5,room_id)
      WHERE id=$6 RETURNING *`,
      [name || null, streamUrl ?? null, status || null, trayId || null, roomId || null, req.params.id]);
    if (!r.rowCount) return res.status(404).json({ message: "Camera not found" });
    res.json(r.rows[0]);
  } catch (e) { res.status(400).json({ message: e.message }); }
};

exports.remove = async (req, res) => {
  try {
    const r = await pool.query("DELETE FROM cameras WHERE id=$1 RETURNING id", [req.params.id]);
    if (!r.rowCount) return res.status(404).json({ message: "Camera not found" });
    res.json({ deleted: true });
  } catch (e) { res.status(400).json({ message: e.message }); }
};
