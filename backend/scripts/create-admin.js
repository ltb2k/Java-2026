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
    const existing = await pool.query("SELECT id FROM users WHERE lower(email)=lower($1)", [email]);
    if (existing.rowCount) {
      await pool.query(
        "UPDATE users SET full_name=$1, email=$2, password_hash=$3, role_id=$4, is_active=TRUE WHERE id=$5",
        [fullName, email, hash, role.rows[0].id, existing.rows[0].id]
      );
    } else {
      await pool.query(
        "INSERT INTO users(full_name, email, password_hash, role_id, is_active) VALUES($1, $2, $3, $4, TRUE)",
        [fullName, email, hash, role.rows[0].id]
      );
    }
    console.log(`Shared admin account is ready for ${email}. Never share ADMIN_PASSWORD in chat or commit it to Git.`);
  } catch (err) {
    const safeMessages = [
      "Set ADMIN_PASSWORD (at least 12 characters) in backend/.env or hosting environment before running seed:admin.",
      "ADMIN role missing. Run database/schema.sql and database/seed.sql first."
    ];
    console.error(safeMessages.includes(err.message)
      ? err.message
      : "Admin setup failed. Check database availability and local configuration.");
    process.exitCode = 1;
  } finally {
    await pool.end();
  }
})();
