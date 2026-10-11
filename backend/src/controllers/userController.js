const bcrypt = require("bcryptjs");
const pool = require("../config/db");

exports.list = async (req, res) => {
  try {
    const onlyCustomers = req.user.role !== "ADMIN";
    const r = await pool.query(`
      SELECT u.id,u.full_name,u.email,u.phone,u.is_active,u.created_at,r.name role
      FROM users u JOIN roles r ON r.id=u.role_id
      ${onlyCustomers ? "WHERE r.name='CUSTOMER'" : ""}
      ORDER BY u.created_at DESC`);
    res.json(r.rows);
  } catch (e) {
    console.error("User list failed", { code: e.code || "UNKNOWN" });
    res.status(500).json({ message: "Không thể tải danh sách tài khoản lúc này" });
  }
};

exports.create = async (req, res) => {
  try {
    const body = req.body || {};
    const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
    const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
    const { password, role } = body;
    const phone = typeof body.phone === "string" ? body.phone.trim() : "";
    if (!fullName || fullName.length > 120 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ||
        email.length > 160 || typeof password !== "string" || password.length < 8 ||
        Buffer.byteLength(password, "utf8") > 72 || (phone && phone.length > 30) ||
        !["ADMIN", "FARM_OPERATOR", "CUSTOMER"].includes(role)) {
      return res.status(400).json({ message: "Thông tin tài khoản không hợp lệ" });
    }
    const roleRow = await pool.query("SELECT id FROM roles WHERE name=$1", [role]);
    if (!roleRow.rowCount) return res.status(400).json({ message: "Role không hợp lệ" });
    const hash = await bcrypt.hash(password, 12);
    const r = await pool.query(`
      INSERT INTO users(full_name,email,password_hash,role_id,phone)
      VALUES($1,$2,$3,$4,$5)
      RETURNING id,full_name,email,phone,is_active`,
      [fullName, email, hash, roleRow.rows[0].id, phone || null]);
    res.status(201).json({ ...r.rows[0], role });
  } catch (e) {
    if (e.code === "23505") return res.status(409).json({ message: "Email đã tồn tại" });
    console.error("User creation failed", { code: e.code || "UNKNOWN" });
    return res.status(500).json({ message: "Không thể tạo tài khoản lúc này" });
  }
};

exports.update = async (req, res) => {
  try {
    const body = req.body || {};
    const { fullName, phone, role, isActive, password } = body;
    if (password !== undefined && (typeof password !== "string" || password.length < 8 || Buffer.byteLength(password, "utf8") > 72)) {
      return res.status(400).json({ message: "Mật khẩu không hợp lệ" });
    }
    let roleId = null;
    if (role) {
      const roleRow = await pool.query("SELECT id FROM roles WHERE name=$1", [role]);
      if (!roleRow.rowCount) return res.status(400).json({ message: "Role không hợp lệ" });
      roleId = roleRow.rows[0].id;
    }
    const hash = password ? await bcrypt.hash(password, 12) : null;
    const r = await pool.query(`
      UPDATE users SET
        full_name=COALESCE($1,full_name),
        phone=COALESCE($2,phone),
        role_id=COALESCE($3,role_id),
        is_active=COALESCE($4,is_active),
        password_hash=COALESCE($5,password_hash)
      WHERE id=$6
      RETURNING id,full_name,email,phone,is_active`,
      [fullName || null, phone ?? null, roleId, typeof isActive === "boolean" ? isActive : null, hash, req.params.id]);
    if (!r.rowCount) return res.status(404).json({ message: "User not found" });
    const withRole = await pool.query(`SELECT r.name role FROM users u JOIN roles r ON r.id=u.role_id WHERE u.id=$1`, [req.params.id]);
    res.json({ ...r.rows[0], role: withRole.rows[0].role });
  } catch (e) {
    console.error("User update failed", { code: e.code || "UNKNOWN" });
    res.status(500).json({ message: "Không thể cập nhật tài khoản lúc này" });
  }
};

exports.remove = async (req, res) => {
  try {
    if (req.params.id === req.user.id) return res.status(400).json({ message: "Không thể xóa chính mình" });
    const r = await pool.query("DELETE FROM users WHERE id=$1 RETURNING id", [req.params.id]);
    if (!r.rowCount) return res.status(404).json({ message: "User not found" });
    res.json({ deleted: true });
  } catch (e) {
    console.error("User deletion failed", { code: e.code || "UNKNOWN" });
    res.status(500).json({ message: "Không thể xóa tài khoản lúc này" });
  }
};
