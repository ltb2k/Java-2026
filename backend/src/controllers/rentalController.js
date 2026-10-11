const pool = require("../config/db");

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

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
  } catch (e) { console.error("Controller request failed", { code: e.code || "UNKNOWN" }); return res.status(500).json({ message: "Internal server error" }); }
};

exports.create = async (req, res) => {
  let client;
  try {
    const staff = req.user.role === "ADMIN" || req.user.role === "FARM_OPERATOR";
    const customerId = staff ? (req.body.customerId || req.user.id) : req.user.id;
    const { trayId, packageId } = req.body;
    if (![trayId, packageId, customerId].every((id) => typeof id === "string" && UUID_RE.test(id))) {
      return res.status(400).json({ message: "Thông tin thuê khay không hợp lệ" });
    }
    client = await pool.connect();
    await client.query("BEGIN");
    const tray = await client.query("SELECT * FROM cultivation_trays WHERE id=$1 FOR UPDATE", [trayId]);
    if (!tray.rowCount) throw Object.assign(new Error("Tray not found"), { status: 404, publicMessage: "Tray not found" });
    if (tray.rows[0].status !== "AVAILABLE") throw Object.assign(new Error("Tray unavailable"), { status: 400, publicMessage: "Khay không còn trống" });
    const active = await client.query("SELECT 1 FROM rentals WHERE tray_id=$1 AND status='ACTIVE'", [trayId]);
    if (active.rowCount) throw Object.assign(new Error("Active rental exists"), { status: 409, publicMessage: "Khay đã có hợp đồng đang hoạt động" });
    const pkg = await client.query("SELECT * FROM rental_packages WHERE id=$1 AND is_active=true", [packageId]);
    if (!pkg.rowCount) throw Object.assign(new Error("Invalid package"), { status: 400, publicMessage: "Gói thuê không hợp lệ" });
    const end = new Date();
    end.setDate(end.getDate() + pkg.rows[0].duration_days);
    const rental = await client.query(`
      INSERT INTO rentals(customer_id,tray_id,package_id,end_date) VALUES($1,$2,$3,$4) RETURNING *`,
      [customerId, trayId, packageId, end.toISOString().slice(0, 10)]);
    await client.query("UPDATE cultivation_trays SET status='RENTED' WHERE id=$1", [trayId]);
    await client.query(
      "INSERT INTO transactions(rental_id,customer_id,amount,note) VALUES($1,$2,$3,$4)",
      [rental.rows[0].id, customerId, pkg.rows[0].price, "Rental payment recorded offline"]);
    await client.query("COMMIT");
    res.status(201).json(rental.rows[0]);
  } catch (e) {
    if (client) await client.query("ROLLBACK").catch(() => {});
    if (e.status) return res.status(e.status).json({ message: e.publicMessage });
    if (e.code === "23505") return res.status(409).json({ message: "Khay đã có hợp đồng đang hoạt động" });
    console.error("Controller request failed", { code: e.code || "UNKNOWN" }); return res.status(500).json({ message: "Internal server error" });
  } finally { client?.release(); }
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
  } catch (e) { console.error("Controller request failed", { code: e.code || "UNKNOWN" }); return res.status(500).json({ message: "Internal server error" }); }
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
  } catch (e) { console.error("Controller request failed", { code: e.code || "UNKNOWN" }); return res.status(500).json({ message: "Internal server error" }); }
};
