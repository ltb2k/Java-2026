const bcrypt = require("bcryptjs");
const pool = require("../config/db");
const { signUser } = require("../utils/jwt");

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 8;
const PASSWORD_MAX_BYTES = 72;

function publicUser(user) {
  return {
    id: user.id,
    fullName: user.full_name,
    email: user.email,
    phone: user.phone || null,
    role: user.role,
    ...(typeof user.is_active === "boolean" ? { isActive: user.is_active } : {})
  };
}

function validPassword(password) {
  return typeof password === "string" && password.length >= PASSWORD_MIN_LENGTH &&
    Buffer.byteLength(password, "utf8") <= PASSWORD_MAX_BYTES;
}

function safeError(res, status, message) {
  return res.status(status).json({ message });
}

exports.login = async (req, res) => {
  const body = req.body || {};
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const { password } = body;
  if (!EMAIL_RE.test(email) || email.length > 160 || typeof password !== "string" ||
      !password || Buffer.byteLength(password, "utf8") > PASSWORD_MAX_BYTES) {
    return safeError(res, 400, "Email và mật khẩu không hợp lệ");
  }

  try {
    const result = await pool.query(`
      SELECT u.id,u.full_name,u.email,u.phone,u.password_hash,u.is_active,r.name role
      FROM users u JOIN roles r ON r.id=u.role_id
      WHERE u.email=$1`, [email]);
    if (!result.rowCount) return safeError(res, 401, "Email hoặc mật khẩu không đúng");

    const user = result.rows[0];
    if (!user.is_active) return safeError(res, 403, "Tài khoản đã bị vô hiệu hóa");
    if (!(await bcrypt.compare(password, user.password_hash))) {
      return safeError(res, 401, "Email hoặc mật khẩu không đúng");
    }

    return res.json({ token: signUser(user), user: publicUser(user) });
  } catch (error) {
    console.error("Login request failed", { code: error.code || "UNKNOWN" });
    return safeError(res, 500, "Không thể đăng nhập lúc này");
  }
};

exports.register = async (req, res) => {
  const body = req.body || {};
  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  const phone = typeof body.phone === "string" ? body.phone.trim() : "";
  const { password } = body;

  if (!fullName || fullName.length > 120 || !EMAIL_RE.test(email) || email.length > 160 ||
      (phone && phone.length > 30) || !validPassword(password)) {
    return safeError(res, 400, "Thông tin đăng ký không hợp lệ");
  }

  try {
    const role = await pool.query("SELECT id FROM roles WHERE name='CUSTOMER'");
    if (!role.rowCount) {
      console.error("Registration unavailable: CUSTOMER role is missing");
      return safeError(res, 503, "Đăng ký hiện chưa khả dụng");
    }

    const hash = await bcrypt.hash(password, 12);
    const result = await pool.query(`
      INSERT INTO users(full_name,email,password_hash,role_id,phone)
      VALUES($1,$2,$3,$4,$5)
      RETURNING id,full_name,email,phone,is_active`,
      [fullName, email, hash, role.rows[0].id, phone || null]);
    return res.status(201).json(publicUser({ ...result.rows[0], role: "CUSTOMER" }));
  } catch (error) {
    if (error.code === "23505") return safeError(res, 409, "Email đã tồn tại");
    console.error("Registration request failed", { code: error.code || "UNKNOWN" });
    return safeError(res, 500, "Không thể tạo tài khoản lúc này");
  }
};

exports.me = async (req, res) => {
  try {
    const result = await pool.query(`
      SELECT u.id,u.full_name,u.email,u.phone,u.is_active,r.name role
      FROM users u JOIN roles r ON r.id=u.role_id WHERE u.id=$1`, [req.user.id]);
    if (!result.rowCount) return safeError(res, 401, "Phiên đăng nhập không còn hợp lệ");
    return res.json(publicUser(result.rows[0]));
  } catch (error) {
    console.error("Current-user request failed", { code: error.code || "UNKNOWN" });
    return safeError(res, 500, "Không thể tải thông tin tài khoản lúc này");
  }
};

exports.updateMe = async (req, res) => {
  const body = req.body || {};
  const fullName = typeof body.fullName === "string" ? body.fullName.trim() : undefined;
  const phone = typeof body.phone === "string" ? body.phone.trim() : body.phone;
  const { password } = body;
  if ((fullName !== undefined && (!fullName || fullName.length > 120)) ||
      (phone != null && (typeof phone !== "string" || phone.length > 30)) ||
      (password !== undefined && !validPassword(password))) {
    return safeError(res, 400, "Thông tin cập nhật không hợp lệ");
  }

  try {
    const hash = password ? await bcrypt.hash(password, 12) : null;
    const result = await pool.query(`
      UPDATE users SET
        full_name=COALESCE($1,full_name),
        phone=COALESCE($2,phone),
        password_hash=COALESCE($3,password_hash)
      WHERE id=$4
      RETURNING id,full_name,email,phone,is_active`,
      [fullName ?? null, phone ?? null, hash, req.user.id]);
    if (!result.rowCount) return safeError(res, 404, "Không tìm thấy tài khoản");
    const current = await pool.query("SELECT name FROM roles WHERE id=(SELECT role_id FROM users WHERE id=$1)", [req.user.id]);
    return res.json(publicUser({ ...result.rows[0], role: current.rows[0]?.name }));
  } catch (error) {
    console.error("Profile update failed", { code: error.code || "UNKNOWN" });
    return safeError(res, 500, "Không thể cập nhật tài khoản lúc này");
  }
};
