const bcrypt = require("bcryptjs");
const pool = require("../config/db");
const { signUser } = require("../utils/jwt");

function publicUser(user) {
  return { id: user.id, fullName: user.full_name, email: user.email, phone: user.phone || null, role: user.role };
}

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const r = await pool.query(`
      SELECT u.*, r.name role FROM users u JOIN roles r ON r.id=u.role_id
      WHERE lower(u.email)=lower($1)`, [email]);
    if (!r.rowCount) return res.status(401).json({ message: "Email hoặc mật khẩu không đúng" });
    const user = r.rows[0];
    if (!user.is_active) return res.status(403).json({ message: "Tài khoản đã bị vô hiệu hóa" });
    if (!(await bcrypt.compare(password, user.password_hash))) {
      return res.status(401).json({ message: "Email hoặc mật khẩu không đúng" });
    }
    res.json({ token: signUser(user), user: publicUser(user) });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.register = async (req, res) => {
  try {
    const { fullName, email, password, phone } = req.body;
    if (!fullName || !email || !password) return res.status(400).json({ message: "Thiếu thông tin" });
    if (String(password).length < 8) return res.status(400).json({ message: "Mật khẩu phải có ít nhất 8 ký tự" });
    const role = await pool.query("SELECT id FROM roles WHERE name='CUSTOMER'");
    const hash = await bcrypt.hash(password, 10);
    const r = await pool.query(`
      INSERT INTO users(full_name,email,password_hash,role_id,phone)
      VALUES($1,$2,$3,$4,$5) RETURNING id,full_name,email,phone`,
      [fullName, email, hash, role.rows[0].id, phone || null]);
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(400).json({ message: e.code === "23505" ? "Email đã tồn tại" : e.message }); }
};

exports.me = async (req, res) => {
  const r = await pool.query(`SELECT u.id,u.full_name,u.email,u.phone,r.name role,u.is_active
    FROM users u JOIN roles r ON r.id=u.role_id WHERE u.id=$1`, [req.user.id]);
  res.json(r.rows[0] || null);
};

exports.updateMe = async (req, res) => {
  try {
    const { fullName, phone, password } = req.body;
    const hash = password ? await bcrypt.hash(password, 10) : null;
    if (password && String(password).length < 8) {
      return res.status(400).json({ message: "Mật khẩu phải có ít nhất 8 ký tự" });
    }
    const r = await pool.query(`
      UPDATE users SET
        full_name=COALESCE($1,full_name),
        phone=COALESCE($2,phone),
        password_hash=COALESCE($3,password_hash)
      WHERE id=$4
      RETURNING id,full_name,email,phone`,
      [fullName || null, phone ?? null, hash, req.user.id]);
    res.json(r.rows[0]);
  } catch (e) { res.status(400).json({ message: e.message }); }
};
