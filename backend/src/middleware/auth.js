import jwt from "jsonwebtoken";

export function authRequired(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return res.status(401).json({ message: "Authentication required" });
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "mushroom_jwt_secret_dev");
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Invalid or expired token" });
  }
}

export function optionalAuth(req, _res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;
  if (token) {
    try {
      req.user = jwt.verify(token, process.env.JWT_SECRET || "mushroom_jwt_secret_dev");
    } catch {
      // Ignore invalid token for optional auth
    }
  }
  next();
}

/**
 * Check if the user has one of the allowed roles.
 * Note: ADMIN inherits all OPERATOR permissions.
 */
export function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ message: "Authentication required" });
    }

    const userRole = req.user.role;
    // Admin inherits Operator
    const effectiveRoles = userRole === "ADMIN" ? ["ADMIN", "OPERATOR"] : [userRole];

    const hasPermission = roles.some((r) => effectiveRoles.includes(r));
    if (!hasPermission) {
      return res.status(403).json({
        message: "Forbidden: You do not have permission to perform this action"
      });
    }

    next();
  };
}
