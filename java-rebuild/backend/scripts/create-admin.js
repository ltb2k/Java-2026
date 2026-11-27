import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import { query, pool } from "../src/db.js";

dotenv.config();

const email = "admin@mushroom.local";
const password = "Admin@123";
const hash = await bcrypt.hash(password, 10);

await query(`
  INSERT INTO users (full_name, email, password_hash, role)
  VALUES ($1,$2,$3,'ADMIN')
  ON CONFLICT (email)
  DO UPDATE SET password_hash=EXCLUDED.password_hash,
                is_active=true,
                role='ADMIN'
`, ["System Admin", email, hash]);

console.log("Admin ready");
console.log("Email:", email);
console.log("Password:", password);
await pool.end();
