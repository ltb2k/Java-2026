const jwt = require("jsonwebtoken");
const pool = require("../config/db");

async function auth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (!token) return res.status(401).json({ message: "Authentication required" });

  let claims;
  try {
    claims = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
  if (typeof claims.id !== "string" || !/^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(claims.id)) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }

  try {
    const result = await pool.query(`
      SELECT u.id,u.email,u.is_active,r.name role
      FROM users u JOIN roles r ON r.id=u.role_id WHERE u.id=$1`, [claims.id]);
    if (!result.rowCount || !result.rows[0].is_active) {
      return res.status(401).json({ message: "Account is unavailable" });
    }
    req.user = result.rows[0];
    return next();
  } catch (error) {
    console.error("Authentication lookup failed", { code: error.code || "UNKNOWN" });
    return res.status(503).json({ message: "Authentication service is temporarily unavailable" });
  }
}

function roles(...allowed) {
  return (req, res, next) => {
    if (!req.user || !allowed.includes(req.user.role)) {
      return res.status(403).json({ message: "Forbidden" });
    }
    return next();
  };
}

module.exports = { auth, roles };
