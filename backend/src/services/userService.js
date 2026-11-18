import bcrypt from "bcryptjs";
import { query } from "../db.js";
import { AppError } from "../middleware/errorHandler.js";

export async function listUsers({ role, status, search, limit = 50, offset = 0 }) {
  let whereConditions = [];
  let params = [];

  if (role) {
    params.push(role);
    whereConditions.push(`role = $${params.length}`);
  }

  if (status) {
    params.push(status);
    whereConditions.push(`status = $${params.length}`);
  }

  if (search) {
    params.push(`%${search}%`);
    whereConditions.push(`(full_name ILIKE $${params.length} OR email ILIKE $${params.length})`);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

  params.push(limit);
  const limitIdx = params.length;
  params.push(offset);
  const offsetIdx = params.length;

  const usersResult = await query(
    `SELECT id, full_name, email, role, status, is_active, email_verified, created_at, updated_at
     FROM users
     ${whereClause}
     ORDER BY id DESC
     LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    params
  );

  const countResult = await query(
    `SELECT COUNT(*) AS total FROM users ${whereClause}`,
    params.slice(0, whereConditions.length)
  );

  return {
    users: usersResult.rows,
    total: parseInt(countResult.rows[0].total, 10),
  };
}

export async function getUserById(id) {
  const result = await query(
    `SELECT id, full_name, email, role, status, is_active, email_verified, created_at, updated_at
     FROM users WHERE id = $1`,
    [id]
  );
  if (!result.rows[0]) {
    throw new AppError("Người dùng không tồn tại", 404);
  }
  return result.rows[0];
}

export async function createUser({ full_name, email, password, role = "OPERATOR" }) {
  const normalizedEmail = email.toLowerCase().trim();
  const existing = await query("SELECT id FROM users WHERE email = $1", [normalizedEmail]);
  if (existing.rows.length > 0) {
    throw new AppError("Email này đã được sử dụng", 409);
  }

  const passwordHash = await bcrypt.hash(password, 10);
  const result = await query(
    `INSERT INTO users (full_name, email, password_hash, role, status, is_active, email_verified)
     VALUES ($1, $2, $3, $4, 'ACTIVE', TRUE, TRUE)
     RETURNING id, full_name, email, role, status, is_active, created_at`,
    [full_name.trim(), normalizedEmail, passwordHash, role]
  );
  return result.rows[0];
}

export async function updateUser(id, { full_name, role, status, is_active }) {
  const user = await getUserById(id);

  const updatedFullName = full_name !== undefined ? full_name.trim() : user.full_name;
  const updatedRole = role !== undefined ? role : user.role;
  const updatedStatus = status !== undefined ? status : user.status;
  const updatedIsActive = is_active !== undefined ? Boolean(is_active) : user.is_active;

  const result = await query(
    `UPDATE users
     SET full_name = $1, role = $2, status = $3, is_active = $4, updated_at = NOW()
     WHERE id = $5
     RETURNING id, full_name, email, role, status, is_active, updated_at`,
    [updatedFullName, updatedRole, updatedStatus, updatedIsActive, id]
  );
  return result.rows[0];
}

export async function resetUserPassword(id, newPassword) {
  await getUserById(id);
  const hash = await bcrypt.hash(newPassword, 10);
  await query(
    `UPDATE users
     SET password_hash = $1, failed_login_attempts = 0, locked_until = NULL, updated_at = NOW()
     WHERE id = $2`,
    [hash, id]
  );
  return { message: "Đặt lại mật khẩu thành công" };
}
