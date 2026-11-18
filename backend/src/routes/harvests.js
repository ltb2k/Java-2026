import { Router } from "express";
import * as harvestService from "../services/harvestService.js";
import { authRequired, requireRoles } from "../middleware/auth.js";
import { validateRequired, validateInt } from "../middleware/validation.js";

const router = Router();

/** GET /api/harvests  — Admin/Operator see all; Customer sees own */
router.get("/", authRequired, async (req, res, next) => {
  try {
    const { tray_id, status } = req.query;
    const harvests = await harvestService.listHarvests(
      { trayId: tray_id ? +tray_id : undefined, status },
      req.user.role === "CUSTOMER" ? req.user.id : null,
      req.user.role
    );
    res.json(harvests);
  } catch (err) { next(err); }
});

/** POST /api/harvests  — Admin, Operator (plan a harvest) */
router.post("/", authRequired, requireRoles("ADMIN", "OPERATOR"), async (req, res, next) => {
  try {
    validateRequired(req.body, ["tray_id"]);
    const harvest = await harvestService.createHarvestPlan(req.body, req.user.id);
    res.status(201).json(harvest);
  } catch (err) { next(err); }
});

/** GET /api/harvests/:id */
router.get("/:id", authRequired, async (req, res, next) => {
  try {
    const id = validateInt(req.params.id, "ID thu hoạch");
    const harvest = await harvestService.getHarvestById(
      id,
      req.user.role === "CUSTOMER" ? req.user.id : null,
      req.user.role
    );
    res.json(harvest);
  } catch (err) { next(err); }
});

/** PUT /api/harvests/:id/record  — Admin, Operator (record actual harvest result) */
router.put("/:id/record", authRequired, requireRoles("ADMIN", "OPERATOR"), async (req, res, next) => {
  try {
    const id = validateInt(req.params.id, "ID thu hoạch");
    validateRequired(req.body, ["quantity_kg"]);
    const harvest = await harvestService.recordHarvest(id, req.body, req.user.id);
    res.json(harvest);
  } catch (err) { next(err); }
});

export default router;
