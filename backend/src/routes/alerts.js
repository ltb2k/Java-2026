import { Router } from "express";
import * as alertService from "../services/alertService.js";
import * as thresholdService from "../services/thresholdService.js";
import { authRequired, requireRoles } from "../middleware/auth.js";
import { validateRequired, validateInt } from "../middleware/validation.js";

const router = Router();

/** GET /api/alerts  — Admin/Operator see all; Customer sees alerts for rooms with their trays */
router.get("/", authRequired, async (req, res, next) => {
  try {
    const { room_id, severity, is_read, status, limit, offset } = req.query;
    const alerts = await alertService.listAlerts(
      { roomId: room_id ? +room_id : undefined, severity, isRead: is_read, status, limit: +limit || 50, offset: +offset || 0 },
      req.user.role === "CUSTOMER" ? req.user.id : null,
      req.user.role
    );
    res.json(alerts);
  } catch (err) { next(err); }
});

/** PUT /api/alerts/:id/read  — Mark alert as read */
router.put("/:id/read", authRequired, requireRoles("ADMIN", "OPERATOR"), async (req, res, next) => {
  try {
    const id = validateInt(req.params.id, "ID cảnh báo");
    const alert = await alertService.markAsRead(id);
    res.json(alert);
  } catch (err) { next(err); }
});

/** PUT /api/alerts/:id/resolve  — Resolve alert */
router.put("/:id/resolve", authRequired, requireRoles("ADMIN", "OPERATOR"), async (req, res, next) => {
  try {
    const id = validateInt(req.params.id, "ID cảnh báo");
    const alert = await alertService.resolveAlert(id);
    res.json(alert);
  } catch (err) { next(err); }
});

/** GET /api/alerts/thresholds  — Get all env thresholds */
router.get("/thresholds", authRequired, requireRoles("ADMIN", "OPERATOR"), async (req, res, next) => {
  try {
    const thresholds = await thresholdService.listThresholds();
    res.json(thresholds);
  } catch (err) { next(err); }
});

/** PUT /api/alerts/thresholds/:metric  — Update threshold (Admin, Operator) */
router.put("/thresholds/:metric", authRequired, requireRoles("ADMIN", "OPERATOR"), async (req, res, next) => {
  try {
    const { metric } = req.params;
    const valid = ["TEMPERATURE", "HUMIDITY", "CO2"];
    if (!valid.includes(metric.toUpperCase())) {
      return res.status(400).json({ message: `Loại cảm biến không hợp lệ. Phải là: ${valid.join(", ")}` });
    }
    validateRequired(req.body, ["lower_bound", "upper_bound"]);
    const threshold = await thresholdService.updateThreshold(metric, req.body, req.user.id);
    res.json(threshold);
  } catch (err) { next(err); }
});

export default router;
