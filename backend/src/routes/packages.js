import { Router } from "express";
import * as packageService from "../services/packageService.js";
import { authRequired, requireRoles, optionalAuth } from "../middleware/auth.js";
import { validateRequired, validateInt } from "../middleware/validation.js";
import { AppError } from "../middleware/errorHandler.js";

const router = Router();

/** GET /api/packages  — Public (active only) or Admin (all) */
router.get("/", optionalAuth, async (req, res, next) => {
  try {
    const isAdmin = req.user?.role === "ADMIN";
    const activeOnly = !isAdmin;
    const packages = await packageService.listPackages({ activeOnly });
    res.json(packages);
  } catch (err) { next(err); }
});

/** POST /api/packages  — Admin only */
router.post("/", authRequired, requireRoles("ADMIN"), async (req, res, next) => {
  try {
    validateRequired(req.body, ["name", "duration_days", "price"]);
    if (isNaN(parseInt(req.body.duration_days, 10)) || parseInt(req.body.duration_days, 10) < 1) {
      throw new AppError("duration_days phải là số nguyên dương", 400);
    }
    const pkg = await packageService.createPackage(req.body);
    res.status(201).json(pkg);
  } catch (err) { next(err); }
});

/** GET /api/packages/:id  — Public */
router.get("/:id", optionalAuth, async (req, res, next) => {
  try {
    const id = validateInt(req.params.id, "ID gói thuê");
    const pkg = await packageService.getPackageById(id);
    res.json(pkg);
  } catch (err) { next(err); }
});

/** PUT /api/packages/:id  — Admin only */
router.put("/:id", authRequired, requireRoles("ADMIN"), async (req, res, next) => {
  try {
    const id = validateInt(req.params.id, "ID gói thuê");
    const pkg = await packageService.updatePackage(id, req.body);
    res.json(pkg);
  } catch (err) { next(err); }
});

/** DELETE /api/packages/:id  — Admin only */
router.delete("/:id", authRequired, requireRoles("ADMIN"), async (req, res, next) => {
  try {
    const id = validateInt(req.params.id, "ID gói thuê");
    const result = await packageService.deletePackage(id);
    res.json(result);
  } catch (err) { next(err); }
});

export default router;
