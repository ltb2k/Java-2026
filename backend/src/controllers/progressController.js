const pool = require("../config/db");
const { notifyUsers } = require("../utils/notify");

exports.list = async (req, res) => {
  try {
    const { trayId } = req.query;
    const staff = req.user.role === "ADMIN" || req.user.role === "FARM_OPERATOR";
    const params = [];
    const conditions = [];
    if (trayId) { params.push(trayId); conditions.push(`p.tray_id=$${params.length}`); }
    if (!staff) {
      params.push(req.user.id);
      conditions.push(`EXISTS (SELECT 1 FROM rentals rent WHERE rent.tray_id=p.tray_id AND rent.customer_id=$${params.length} AND rent.status='ACTIVE')`);
    }
    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const r = await pool.query(`
      SELECT p.*, t.code tray_code FROM cultivation_progress p
      JOIN cultivation_trays t ON t.id=p.tray_id ${where}
      ORDER BY p.recorded_at DESC LIMIT 200`, params);
    res.json(r.rows);
  } catch (e) { console.error("Controller request failed", { code: e.code || "UNKNOWN" }); return res.status(500).json({ message: "Internal server error" }); }
};

exports.create = async (req, res) => {
  try {
    const { trayId, stage, progressPercent, note } = req.body;
    if (typeof trayId !== "string" || !trayId || typeof stage !== "string" || !stage.trim() || stage.length > 80 ||
        typeof progressPercent !== "number" || !Number.isFinite(progressPercent) || progressPercent < 0 || progressPercent > 100 ||
        (note != null && (typeof note !== "string" || note.length > 2000))) {
      return res.status(400).json({ message: "Thông tin tiến độ không hợp lệ" });
    }
    const r = await pool.query(`
      INSERT INTO cultivation_progress(tray_id,stage,progress_percent,note)
      VALUES($1,$2,$3,$4) RETURNING *`,
      [trayId, stage.trim(), progressPercent, note || null]);
    await pool.query(
      "UPDATE cultivation_trays SET status=CASE WHEN $2>=100 THEN 'HARVEST_READY' ELSE 'GROWING' END WHERE id=$1",
      [trayId, progressPercent]);
    const owners = await pool.query(
      "SELECT customer_id FROM rentals WHERE tray_id=$1 AND status='ACTIVE'", [trayId]);
    await notifyUsers(owners.rows.map((x) => x.customer_id),
      "Cập nhật tiến độ nuôi trồng",
      `Khay đã chuyển sang giai đoạn: ${stage.trim()} (${progressPercent}%).`,
      "PROGRESS");
    res.status(201).json(r.rows[0]);
  } catch (e) { console.error("Controller request failed", { code: e.code || "UNKNOWN" }); return res.status(500).json({ message: "Internal server error" }); }
};
