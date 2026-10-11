const pool = require("../config/db");

function isStaff(role) {
  return role === "ADMIN" || role === "FARM_OPERATOR";
}

exports.list = async (req, res) => {
  try {
    const scope = req.query.scope || (isStaff(req.user.role) ? "all" : "mine");
    let sql = `
      SELECT t.*, r.name room_name, r.code room_code,
        (SELECT stage FROM cultivation_progress p WHERE p.tray_id=t.id ORDER BY recorded_at DESC LIMIT 1) latest_stage,
        (SELECT progress_percent FROM cultivation_progress p WHERE p.tray_id=t.id ORDER BY recorded_at DESC LIMIT 1) progress_percent,
        rent.id rental_id, rent.status rental_status, rent.start_date, rent.end_date,
        u.full_name customer_name, pkg.name package_name
      FROM cultivation_trays t
      LEFT JOIN cultivation_rooms r ON r.id=t.room_id
      LEFT JOIN LATERAL (
        SELECT * FROM rentals WHERE tray_id=t.id AND status='ACTIVE' ORDER BY created_at DESC LIMIT 1
      ) rent ON TRUE
      LEFT JOIN users u ON u.id=rent.customer_id
      LEFT JOIN rental_packages pkg ON pkg.id=rent.package_id`;
    const params = [];
    if (scope === "available") sql += " WHERE t.status='AVAILABLE'";
    else if (scope === "mine" || !isStaff(req.user.role)) {
      params.push(req.user.id);
      sql += " WHERE rent.customer_id=$1";
    }
    sql += " ORDER BY t.created_at DESC";
    const r = await pool.query(sql, params);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.get = async (req, res) => {
  try {
    const r = await pool.query(`
      SELECT t.*, rm.name room_name, rm.code room_code
      FROM cultivation_trays t LEFT JOIN cultivation_rooms rm ON rm.id=t.room_id
      WHERE t.id=$1`, [req.params.id]);
    if (!r.rowCount) return res.status(404).json({ message: "Tray not found" });
    if (!isStaff(req.user.role)) {
      const own = await pool.query(
        "SELECT 1 FROM rentals WHERE tray_id=$1 AND customer_id=$2 AND status='ACTIVE'",
        [req.params.id, req.user.id]);
      if (!own.rowCount) return res.status(403).json({ message: "Forbidden" });
    }
    res.json(r.rows[0]);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.create = async (req, res) => {
  try {
    const { roomId, code, mushroomType, rack, status, growthDay, expectedHarvestDate } = req.body;
    const r = await pool.query(`
      INSERT INTO cultivation_trays(room_id,code,mushroom_type,rack,status,growth_day,expected_harvest_date)
      VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [roomId || null, code, mushroomType, rack || null, status || "AVAILABLE", growthDay || 0, expectedHarvestDate || null]);
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(400).json({ message: e.message }); }
};

exports.update = async (req, res) => {
  try {
    const { status, growthDay, expectedHarvestDate, roomId, mushroomType, rack } = req.body;
    const r = await pool.query(`
      UPDATE cultivation_trays SET
        status=COALESCE($1,status), growth_day=COALESCE($2,growth_day),
        expected_harvest_date=COALESCE($3,expected_harvest_date), room_id=COALESCE($4,room_id),
        mushroom_type=COALESCE($5,mushroom_type), rack=COALESCE($6,rack)
      WHERE id=$7 RETURNING *`,
      [status || null, growthDay ?? null, expectedHarvestDate || null, roomId || null, mushroomType || null, rack ?? null, req.params.id]);
    if (!r.rowCount) return res.status(404).json({ message: "Tray not found" });
    res.json(r.rows[0]);
  } catch (e) { res.status(400).json({ message: e.message }); }
};

exports.remove = async (req, res) => {
  try {
    const r = await pool.query("DELETE FROM cultivation_trays WHERE id=$1 RETURNING id", [req.params.id]);
    if (!r.rowCount) return res.status(404).json({ message: "Tray not found" });
    res.json({ deleted: true });
  } catch (e) { res.status(400).json({ message: e.message }); }
};

exports.registerCode = async (req, res) => {
  try {
    const { code, packageId } = req.body;
    if (!code) return res.status(400).json({ message: "Thiếu mã khay" });
    const tray = await pool.query("SELECT * FROM cultivation_trays WHERE upper(code)=upper($1)", [code]);
    if (!tray.rowCount) return res.status(404).json({ message: "Không tìm thấy khay" });
    const t = tray.rows[0];
    const active = await pool.query(
      "SELECT * FROM rentals WHERE tray_id=$1 AND status='ACTIVE' ORDER BY created_at DESC LIMIT 1", [t.id]);
    if (active.rowCount) {
      if (active.rows[0].customer_id !== req.user.id) {
        return res.status(403).json({ message: "Khay đã được gán cho khách khác" });
      }
      return res.json({ tray: t, rental: active.rows[0], linked: true });
    }
    if (!packageId) return res.status(400).json({ message: "Khay chưa thuê. Vui lòng chọn gói thuê." });
    const pkg = await pool.query("SELECT * FROM rental_packages WHERE id=$1 AND is_active=true", [packageId]);
    if (!pkg.rowCount) return res.status(400).json({ message: "Gói thuê không hợp lệ" });
    const end = new Date();
    end.setDate(end.getDate() + pkg.rows[0].duration_days);
    const rental = await pool.query(`
      INSERT INTO rentals(customer_id,tray_id,package_id,end_date) VALUES($1,$2,$3,$4) RETURNING *`,
      [req.user.id, t.id, packageId, end.toISOString().slice(0, 10)]);
    await pool.query("UPDATE cultivation_trays SET status='RENTED' WHERE id=$1", [t.id]);
    await pool.query(
      "INSERT INTO transactions(rental_id,customer_id,amount,note) VALUES($1,$2,$3,$4)",
      [rental.rows[0].id, req.user.id, pkg.rows[0].price, "Tray code registration"]);
    res.status(201).json({ tray: { ...t, status: "RENTED" }, rental: rental.rows[0], linked: false });
  } catch (e) { res.status(400).json({ message: e.message }); }
};
