import { Router } from "express";
import * as trayService from "../services/trayService.js";
import { authRequired, requireRoles } from "../middleware/auth.js";
import { validateRequired, validateInt } from "../middleware/validation.js";

const router = Router();

/** GET /api/trays */
router.get("/", authRequired, async (req, res, next) => {
  try {
    const { room_id, status, growth_stage } = req.query;
    const trays = await trayService.listTrays({
      roomId: room_id ? +room_id : undefined,
      status,
      growthStage: growth_stage,
      customerId: req.user.role === "CUSTOMER" ? req.user.id : undefined,
      userRole: req.user.role,
    });
    res.json(trays);
  } catch (err) { next(err); }
});

/** POST /api/trays  — Admin, Operator */
router.post("/", authRequired, requireRoles("ADMIN", "OPERATOR"), async (req, res, next) => {
  try {
    validateRequired(req.body, ["code"]);
    const tray = await trayService.createTray(req.body);
    res.status(201).json(tray);
  } catch (err) { next(err); }
});

/** GET /api/trays/:id */
router.get("/:id", authRequired, async (req, res, next) => {
  try {
    const id = validateInt(req.params.id, "ID khay");
    const tray = await trayService.getTrayById(
      id,
      req.user.role === "CUSTOMER" ? req.user.id : null,
      req.user.role
    );
    res.json(tray);
  } catch (err) { next(err); }
});

/** PUT /api/trays/:id  — Admin, Operator */
router.put("/:id", authRequired, requireRoles("ADMIN", "OPERATOR"), async (req, res, next) => {
  try {
    const id = validateInt(req.params.id, "ID khay");
    const tray = await trayService.updateTray(id, req.body);
    res.json(tray);
  } catch (err) { next(err); }
});

/** DELETE /api/trays/:id  — Admin, Operator */
router.delete("/:id", authRequired, requireRoles("ADMIN", "OPERATOR"), async (req, res, next) => {
  try {
    const id = validateInt(req.params.id, "ID khay");
    const result = await trayService.deleteTray(id);
    res.json(result);
  } catch (err) { next(err); }
});

/** PUT /api/trays/:id/stage  — Admin, Operator (update cultivation stage) */
router.put("/:id/stage", authRequired, requireRoles("ADMIN", "OPERATOR"), async (req, res, next) => {
  try {
    const id = validateInt(req.params.id, "ID khay");
    validateRequired(req.body, ["stage"]);
    const tray = await trayService.updateStage(id, req.body, req.user.id);
    res.json(tray);
  } catch (err) { next(err); }
});

/** GET /api/trays/:id/growth-logs */
router.get("/:id/growth-logs", authRequired, async (req, res, next) => {
  try {
    const id = validateInt(req.params.id, "ID khay");
    // Customer isolation enforced inside getTrayById
    await trayService.getTrayById(
      id,
      req.user.role === "CUSTOMER" ? req.user.id : null,
      req.user.role
    );
    const logs = await trayService.getGrowthLogs(id);
    res.json(logs);
  } catch (err) { next(err); }
});

export default router;
