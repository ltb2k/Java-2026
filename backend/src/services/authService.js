import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import { query } from "../db.js";
import { AppError } from "../middleware/errorHandler.js";

const JWT_SECRET = process.env.JWT_SECRET || "mushroom_jwt_secret_dev";
const ACCESS_EXPIRES_IN = "8h";
const REFRESH_EXPIRES_IN = "7d";

export async function register({ full_name, email, password, role = "CUSTOMER" }) {
  const normalizedEmail = email.toLowerCase().trim();

  // Check existing user
  const existing = await query("SELECT id FROM users WHERE email = $1", [normalizedEmail]);
  if (existing.rows.length > 0) {
    throw new AppError("Email này đã được đăng ký tài khoản", 409);
  }

  const allowedRoles = ["CUSTOMER", "OPERATOR"];
  const assignedRole = allowedRoles.includes(role) ? role : "CUSTOMER";

  const passwordHash = await bcrypt.hash(password, 10);
  const verificationToken = crypto.randomBytes(24).toString("hex");

  // In this system, customers are active immediately, with verification token available
  const result = await query(
    `INSERT INTO users (full_name, email, password_hash, role, status, is_active, email_verified, verification_token)
     VALUES ($1, $2, $3, $4, 'ACTIVE', TRUE, TRUE, $5)
     RETURNING id, full_name, email, role, status, is_active, email_verified, created_at`,
    [full_name.trim(), normalizedEmail, passwordHash, assignedRole, verificationToken]
  );

  return result.rows[0];
}

export async function login({ email, password }) {
  const normalizedEmail = email.toLowerCase().trim();

  const result = await query(
    `SELECT id, full_name, email, password_hash, role, status, is_active,
            failed_login_attempts, locked_until
     FROM users WHERE email = $1`,
    [normalizedEmail]
  );
  const user = result.rows[0];

  if (!user) {
    throw new AppError("Email hoặc mật khẩu không chính xác", 401);
  }

  // Check account locked
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    const remainingMinutes = Math.ceil((new Date(user.locked_until) - new Date()) / 60000);
    throw new AppError(
      `Tài khoản tạm thời bị khóa do nhập sai nhiều lần. Vui lòng thử lại sau ${remainingMinutes} phút.`,
      423
    );
  }

  if (!user.is_active || user.status === "DISABLED") {
    throw new AppError("Tài khoản đã bị vô hiệu hóa hoặc bị khóa. Vui lòng liên hệ quản trị viên.", 403);
  }

  const match = await bcrypt.compare(password, user.password_hash);
  if (!match) {
    const attempts = (user.failed_login_attempts || 0) + 1;
    let lockUntil = null;
    if (attempts >= 5) {
      lockUntil = new Date(Date.now() + 15 * 60 * 1000); // 15 mins
    }
    await query(
      "UPDATE users SET failed_login_attempts = $1, locked_until = $2 WHERE id = $3",
      [attempts, lockUntil, user.id]
    );

    if (attempts >= 5) {
      throw new AppError("Nhập sai 5 lần liên tiếp. Tài khoản đã bị khóa trong 15 phút.", 423);
    }
    throw new AppError("Email hoặc mật khẩu không chính xác", 401);
  }

  // Reset failed login attempts on successful login
  if (user.failed_login_attempts > 0 || user.locked_until) {
    await query(
      "UPDATE users SET failed_login_attempts = 0, locked_until = NULL, updated_at = NOW() WHERE id = $1",
      [user.id]
    );
  }

  const tokenPayload = {
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.full_name,
  };

  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: ACCESS_EXPIRES_IN });
  const refreshToken = jwt.sign({ id: user.id }, JWT_SECRET, { expiresIn: REFRESH_EXPIRES_IN });

  return {
    token,
    refreshToken,
    user: {
      id: user.id,
      name: user.full_name,
      email: user.email,
      role: user.role,
      status: user.status,
    },
  };
}

export async function verifyEmail(token) {
  const result = await query(
    `UPDATE users
     SET email_verified = TRUE, status = 'ACTIVE', verification_token = NULL, updated_at = NOW()
     WHERE verification_token = $1
     RETURNING id, email, full_name, role, status`,
    [token]
  );
  if (!result.rows[0]) {
    throw new AppError("Mã xác minh không hợp lệ hoặc đã được sử dụng", 400);
  }
  return result.rows[0];
}

export async function getProfile(userId) {
  const result = await query(
    `SELECT id, full_name, email, role, status, is_active, email_verified, created_at, updated_at
     FROM users WHERE id = $1`,
    [userId]
  );
  if (!result.rows[0]) {
    throw new AppError("Người dùng không tồn tại", 404);
  }
  return result.rows[0];
}

export async function updateProfile(userId, { full_name }) {
  const result = await query(
    `UPDATE users SET full_name = $1, updated_at = NOW()
     WHERE id = $2
     RETURNING id, full_name, email, role, status, is_active, email_verified`,
    [full_name.trim(), userId]
  );
  if (!result.rows[0]) {
    throw new AppError("Người dùng không tồn tại", 404);
  }
  return result.rows[0];
}

export async function changePassword(userId, { currentPassword, newPassword }) {
  const userRes = await query("SELECT password_hash FROM users WHERE id = $1", [userId]);
  if (!userRes.rows[0]) {
    throw new AppError("Người dùng không tồn tại", 404);
  }

  const ok = await bcrypt.compare(currentPassword, userRes.rows[0].password_hash);
  if (!ok) {
    throw new AppError("Mật khẩu hiện tại không chính xác", 400);
  }

  const newHash = await bcrypt.hash(newPassword, 10);
  await query("UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2", [newHash, userId]);
  return { message: "Đổi mật khẩu thành công" };
}
