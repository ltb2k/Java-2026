import { Router } from "express";
import * as authService from "../services/authService.js";
import { authRequired, optionalAuth } from "../middleware/auth.js";
import { validateRequired, validateEmail, validatePassword } from "../middleware/validation.js";
import { AppError } from "../middleware/errorHandler.js";

const router = Router();

/** POST /api/auth/register */
router.post("/register", async (req, res, next) => {
  try {
    const { full_name, email, password } = req.body || {};
    validateRequired(req.body, ["full_name", "email", "password"]);
    validateEmail(email);
    validatePassword(password, 6);
    const user = await authService.register({ full_name, email, password });
    res.status(201).json({ message: "Đăng ký tài khoản thành công", user });
  } catch (err) { next(err); }
});

/** POST /api/auth/login */
router.post("/login", async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    validateRequired(req.body, ["email", "password"]);
    const result = await authService.login({ email, password });
    res.json(result);
  } catch (err) { next(err); }
});

/** POST /api/auth/verify-email */
router.post("/verify-email", async (req, res, next) => {
  try {
    const { token } = req.body || {};
    if (!token) throw new AppError("Mã xác minh là bắt buộc", 400);
    const user = await authService.verifyEmail(token);
    res.json({ message: "Xác minh email thành công", user });
  } catch (err) { next(err); }
});

/** GET /api/auth/me */
router.get("/me", authRequired, async (req, res, next) => {
  try {
    const user = await authService.getProfile(req.user.id);
    res.json(user);
  } catch (err) { next(err); }
});

/** PUT /api/auth/me */
router.put("/me", authRequired, async (req, res, next) => {
  try {
    validateRequired(req.body, ["full_name"]);
    const user = await authService.updateProfile(req.user.id, req.body);
    res.json(user);
  } catch (err) { next(err); }
});

/** PUT /api/auth/change-password */
router.put("/change-password", authRequired, async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body || {};
    validateRequired(req.body, ["currentPassword", "newPassword"]);
    validatePassword(newPassword, 6);
    const result = await authService.changePassword(req.user.id, { currentPassword, newPassword });
    res.json(result);
  } catch (err) { next(err); }
});

export default router;
