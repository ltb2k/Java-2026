const pool = require("../config/db");
const { notifyUsers } = require("../utils/notify");

exports.list = async (req, res) => {
  try {
    const { trayId } = req.query;
    const params = [];
    let where = "";
    if (trayId) { params.push(trayId); where = "WHERE p.tray_id=$1"; }
    const r = await pool.query(`
      SELECT p.*, t.code tray_code FROM cultivation_progress p
      JOIN cultivation_trays t ON t.id=p.tray_id ${where}
      ORDER BY p.recorded_at DESC LIMIT 200`, params);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.create = async (req, res) => {
  try {
    const { trayId, stage, progressPercent, note } = req.body;
    const r = await pool.query(`
      INSERT INTO cultivation_progress(tray_id,stage,progress_percent,note)
      VALUES($1,$2,$3,$4) RETURNING *`,
      [trayId, stage, progressPercent || 0, note || null]);
    await pool.query(
      "UPDATE cultivation_trays SET status=CASE WHEN $2>=100 THEN 'HARVEST_READY' ELSE 'GROWING' END WHERE id=$1",
      [trayId, progressPercent || 0]);
    const owners = await pool.query(
      "SELECT customer_id FROM rentals WHERE tray_id=$1 AND status='ACTIVE'", [trayId]);
    await notifyUsers(owners.rows.map((x) => x.customer_id),
      "Cập nhật tiến độ nuôi trồng",
      `Khay đã chuyển sang giai đoạn: ${stage} (${progressPercent || 0}%).`,
      "PROGRESS");
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(400).json({ message: e.message }); }
};
