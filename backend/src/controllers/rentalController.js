const pool = require("../config/db");

exports.list = async (req, res) => {
  try {
    const staff = req.user.role === "ADMIN" || req.user.role === "FARM_OPERATOR";
    const params = [];
    let where = "";
    if (!staff) { params.push(req.user.id); where = "WHERE rent.customer_id=$1"; }
    const r = await pool.query(`
      SELECT rent.*, t.code tray_code, t.mushroom_type, t.status tray_status,
        u.full_name customer_name, u.email customer_email, pkg.name package_name, pkg.price, pkg.duration_days
      FROM rentals rent
      JOIN cultivation_trays t ON t.id=rent.tray_id
      JOIN users u ON u.id=rent.customer_id
      JOIN rental_packages pkg ON pkg.id=rent.package_id
      ${where}
      ORDER BY rent.created_at DESC`, params);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.create = async (req, res) => {
  try {
    const staff = req.user.role === "ADMIN" || req.user.role === "FARM_OPERATOR";
    const customerId = staff ? (req.body.customerId || req.user.id) : req.user.id;
    const { trayId, packageId } = req.body;
    const tray = await pool.query("SELECT * FROM cultivation_trays WHERE id=$1", [trayId]);
    if (!tray.rowCount) return res.status(404).json({ message: "Tray not found" });
    if (tray.rows[0].status !== "AVAILABLE") return res.status(400).json({ message: "Khay không còn trống" });
    const pkg = await pool.query("SELECT * FROM rental_packages WHERE id=$1 AND is_active=true", [packageId]);
    if (!pkg.rowCount) return res.status(400).json({ message: "Gói thuê không hợp lệ" });
    const end = new Date();
    end.setDate(end.getDate() + pkg.rows[0].duration_days);
    const rental = await pool.query(`
      INSERT INTO rentals(customer_id,tray_id,package_id,end_date) VALUES($1,$2,$3,$4) RETURNING *`,
      [customerId, trayId, packageId, end.toISOString().slice(0, 10)]);
    await pool.query("UPDATE cultivation_trays SET status='RENTED' WHERE id=$1", [trayId]);
    await pool.query(
      "INSERT INTO transactions(rental_id,customer_id,amount,note) VALUES($1,$2,$3,$4)",
      [rental.rows[0].id, customerId, pkg.rows[0].price, "Rental payment recorded offline"]);
    res.status(201).json(rental.rows[0]);
  } catch (e) { res.status(400).json({ message: e.message }); }
};

exports.update = async (req, res) => {
  try {
    const { status, endDate } = req.body;
    const r = await pool.query(`
      UPDATE rentals SET status=COALESCE($1,status), end_date=COALESCE($2,end_date)
      WHERE id=$3 RETURNING *`, [status || null, endDate || null, req.params.id]);
    if (!r.rowCount) return res.status(404).json({ message: "Rental not found" });
    if (status === "COMPLETED" || status === "CANCELLED") {
      await pool.query("UPDATE cultivation_trays SET status='AVAILABLE' WHERE id=$1", [r.rows[0].tray_id]);
    }
    res.json(r.rows[0]);
  } catch (e) { res.status(400).json({ message: e.message }); }
};

exports.transactions = async (req, res) => {
  try {
    const staff = req.user.role === "ADMIN" || req.user.role === "FARM_OPERATOR";
    const params = [];
    let where = "";
    if (!staff) { params.push(req.user.id); where = "WHERE tx.customer_id=$1"; }
    const r = await pool.query(`
      SELECT tx.*, t.code tray_code, pkg.name package_name
      FROM transactions tx
      LEFT JOIN rentals rent ON rent.id=tx.rental_id
      LEFT JOIN cultivation_trays t ON t.id=rent.tray_id
      LEFT JOIN rental_packages pkg ON pkg.id=rent.package_id
      ${where}
      ORDER BY tx.created_at DESC`, params);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
};
