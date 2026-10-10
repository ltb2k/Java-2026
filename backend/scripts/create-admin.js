require("dotenv").config();
const bcrypt = require("bcryptjs");
const pool = require("../src/config/db");

(async () => {
  try {
    const email = (process.env.ADMIN_EMAIL || "admin@mushroom.local").trim().toLowerCase();
    const password = process.env.ADMIN_PASSWORD;
    const fullName = process.env.ADMIN_FULL_NAME || "Shared Team Administrator";

    if (!password || password.length < 12) {
      throw new Error("Set ADMIN_PASSWORD (at least 12 characters) in backend/.env or hosting environment before running seed:admin.");
    }

    const role = await pool.query("SELECT id FROM roles WHERE name = 'ADMIN'");
    if (!role.rowCount) throw new Error("ADMIN role missing. Run database/schema.sql and database/seed.sql first.");

    const hash = await bcrypt.hash(password, 12);
    await pool.query(
      `INSERT INTO users(full_name, email, password_hash, role_id, is_active)
       VALUES($1, $2, $3, $4, TRUE)
       ON CONFLICT(email) DO UPDATE SET
         full_name = EXCLUDED.full_name,
         password_hash = EXCLUDED.password_hash,
         role_id = EXCLUDED.role_id,
         is_active = TRUE`,
      [fullName, email, hash, role.rows[0].id]
    );
    console.log(`Shared admin account is ready for ${email}. Never share ADMIN_PASSWORD in chat or commit it to Git.`);
  } catch (err) {
    console.error(err.message);
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
