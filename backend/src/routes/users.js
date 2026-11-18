import { Router } from "express";
import * as userService from "../services/userService.js";
import { authRequired, requireRoles } from "../middleware/auth.js";
import { validateRequired, validateEmail, validatePassword, validateInt } from "../middleware/validation.js";

const router = Router();

/** GET /api/users  — Admin only */
router.get("/", authRequired, requireRoles("ADMIN"), async (req, res, next) => {
  try {
    const { role, status, search, limit = 50, offset = 0 } = req.query;
    const result = await userService.listUsers({ role, status, search, limit: +limit, offset: +offset });
    res.json(result);
  } catch (err) { next(err); }
});

/** POST /api/users  — Admin only */
router.post("/", authRequired, requireRoles("ADMIN"), async (req, res, next) => {
  try {
    validateRequired(req.body, ["full_name", "email", "password"]);
    validateEmail(req.body.email);
    validatePassword(req.body.password, 6);
    const user = await userService.createUser(req.body);
    res.status(201).json(user);
  } catch (err) { next(err); }
});

/** GET /api/users/:id  — Admin only */
router.get("/:id", authRequired, requireRoles("ADMIN"), async (req, res, next) => {
  try {
    const id = validateInt(req.params.id, "ID người dùng");
    const user = await userService.getUserById(id);
    res.json(user);
  } catch (err) { next(err); }
});

/** PUT /api/users/:id  — Admin only */
router.put("/:id", authRequired, requireRoles("ADMIN"), async (req, res, next) => {
  try {
    const id = validateInt(req.params.id, "ID người dùng");
    const user = await userService.updateUser(id, req.body);
    res.json(user);
  } catch (err) { next(err); }
});

/** PUT /api/users/:id/reset-password  — Admin only */
router.put("/:id/reset-password", authRequired, requireRoles("ADMIN"), async (req, res, next) => {
  try {
    const id = validateInt(req.params.id, "ID người dùng");
    validateRequired(req.body, ["newPassword"]);
    validatePassword(req.body.newPassword, 6);
    const result = await userService.resetUserPassword(id, req.body.newPassword);
    res.json(result);
  } catch (err) { next(err); }
});

export default router;
