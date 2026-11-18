import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { query, pool } from "../src/db.js";

dotenv.config();

const email = process.env.ADMIN_EMAIL || "admin@mushroom.local";
const fullName = process.env.ADMIN_FULL_NAME || "System Admin";
const password = process.env.ADMIN_PASSWORD;

if (!password) {
  console.error("Error: ADMIN_PASSWORD environment variable is required.");
  console.error("Set it in backend/.env or export ADMIN_PASSWORD='...' before running.");
  process.exit(1);
}

if (password.length < 8) {
  console.error("Error: ADMIN_PASSWORD must be at least 8 characters.");
  process.exit(1);
}

const hash = await bcrypt.hash(password, 12);

await query(`
  INSERT INTO users (full_name, email, password_hash, role, status, is_active, email_verified)
  VALUES ($1, $2, $3, 'ADMIN', 'ACTIVE', TRUE, TRUE)
  ON CONFLICT (email)
  DO UPDATE SET
    password_hash = EXCLUDED.password_hash,
    full_name = EXCLUDED.full_name,
    is_active = TRUE,
    status = 'ACTIVE',
    role = 'ADMIN',
    updated_at = NOW()
`, [fullName, email.toLowerCase().trim(), hash]);

console.log("✅ Admin account ready");
console.log("   Email:", email);
console.log("   Name:", fullName);
console.log("   Password: (set via ADMIN_PASSWORD env)");

await pool.end();
