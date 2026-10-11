const pool = require("../config/db");
const { notifyUsers, staffIds } = require("../utils/notify");

exports.list = async (req, res) => {
  try {
    const staff = req.user.role === "ADMIN" || req.user.role === "FARM_OPERATOR";
    const params = [];
    let where = "";
    if (!staff) {
      params.push(req.user.id);
      where = `WHERE h.customer_id=$1 OR EXISTS (
        SELECT 1 FROM rentals rent
        WHERE rent.tray_id=h.tray_id AND rent.customer_id=$1 AND rent.status='ACTIVE'
      )`;
    }
    const r = await pool.query(`
      SELECT h.*, t.code tray_code, t.mushroom_type, u.full_name customer_name
      FROM harvests h
      JOIN cultivation_trays t ON t.id=h.tray_id
      LEFT JOIN users u ON u.id=h.customer_id
      ${where}
      ORDER BY h.harvest_date DESC`, params);
    res.json(r.rows);
  } catch (e) { console.error("Controller request failed", { code: e.code || "UNKNOWN" }); return res.status(500).json({ message: "Internal server error" }); }
};

exports.create = async (req, res) => {
  try {
    const { trayId, quantityKg, harvestDate, deliveryRequested, note, status } = req.body;
    const own = await pool.query(
      "SELECT customer_id FROM rentals WHERE tray_id=$1 AND status='ACTIVE' LIMIT 1", [trayId]);
    const customerId = own.rowCount ? own.rows[0].customer_id : (req.user.role === "CUSTOMER" ? req.user.id : null);
    const r = await pool.query(`
      INSERT INTO harvests(tray_id,customer_id,quantity_kg,harvest_date,delivery_requested,note,status)
      VALUES($1,$2,$3,COALESCE($4,CURRENT_DATE),$5,$6,$7) RETURNING *`,
      [trayId, customerId, quantityKg || null, harvestDate || null, !!deliveryRequested, note || null, status || "PLANNED"]);
    res.status(201).json(r.rows[0]);
  } catch (e) { console.error("Controller request failed", { code: e.code || "UNKNOWN" }); return res.status(500).json({ message: "Internal server error" }); }
};

exports.update = async (req, res) => {
  try {
    const { status, quantityKg, deliveryRequested, note, harvestDate } = req.body;
    const r = await pool.query(`
      UPDATE harvests SET
        status=COALESCE($1,status), quantity_kg=COALESCE($2,quantity_kg),
        delivery_requested=COALESCE($3,delivery_requested), note=COALESCE($4,note),
        harvest_date=COALESCE($5,harvest_date)
      WHERE id=$6 RETURNING *`,
      [status || null, quantityKg ?? null, typeof deliveryRequested === "boolean" ? deliveryRequested : null,
        note ?? null, harvestDate || null, req.params.id]);
    if (!r.rowCount) return res.status(404).json({ message: "Harvest not found" });
    if (status === "COMPLETED") {
      await pool.query("UPDATE cultivation_trays SET status='HARVESTED' WHERE id=$1", [r.rows[0].tray_id]);
    }
    res.json(r.rows[0]);
  } catch (e) { console.error("Controller request failed", { code: e.code || "UNKNOWN" }); return res.status(500).json({ message: "Internal server error" }); }
};

exports.requestCollection = async (req, res) => {
  try {
    const { trayId, note } = req.body;
    const own = await pool.query(
      "SELECT 1 FROM rentals WHERE tray_id=$1 AND customer_id=$2 AND status='ACTIVE'",
      [trayId, req.user.id]);
    if (!own.rowCount && req.user.role === "CUSTOMER") {
      return res.status(403).json({ message: "Khay không thuộc tài khoản của bạn" });
    }
    const r = await pool.query(`
      INSERT INTO harvests(tray_id,customer_id,delivery_requested,note,status)
      VALUES($1,$2,TRUE,$3,'REQUESTED') RETURNING *`,
      [trayId, req.user.id, note || "Yêu cầu thu hoạch / giao hàng"]);
    await notifyUsers(await staffIds(), "Yêu cầu thu hoạch",
      `Khách hàng yêu cầu thu hoạch khay ${trayId}.`, "HARVEST");
    res.status(201).json(r.rows[0]);
  } catch (e) { console.error("Controller request failed", { code: e.code || "UNKNOWN" }); return res.status(500).json({ message: "Internal server error" }); }
};
