import { Router } from "express";
import * as sensorService from "../services/sensorService.js";
import { authRequired, requireRoles } from "../middleware/auth.js";
import { validateRequired } from "../middleware/validation.js";

const router = Router();

/** GET /api/sensors/latest  — latest readings per sensor type */
router.get("/latest", authRequired, async (req, res, next) => {
  try {
    const { room_id } = req.query;
    const readings = await sensorService.getLatestReadings(room_id ? +room_id : null);
    res.json(readings);
  } catch (err) { next(err); }
});

/** GET /api/sensors/history  — paginated history with filters */
router.get("/history", authRequired, async (req, res, next) => {
  try {
    const { room_id, tray_id, sensor_type, from, to, limit } = req.query;
    const history = await sensorService.getSensorHistory(
      { room_id: room_id ? +room_id : null, tray_id: tray_id ? +tray_id : null, sensor_type, from, to, limit },
      req.user.role === "CUSTOMER" ? req.user.id : null,
      req.user.role
    );
    res.json(history);
  } catch (err) { next(err); }
});

/** POST /api/sensors  — IoT ingest (Admin/Operator; ESP32 devices use this via API key or JWT) */
router.post("/", authRequired, requireRoles("ADMIN", "OPERATOR"), async (req, res, next) => {
  try {
    validateRequired(req.body, ["sensor_type", "value"]);
    const result = await sensorService.ingestReading(req.body);
    if (result.duplicate) {
      return res.status(200).json(result);
    }
    res.status(201).json(result);
  } catch (err) { next(err); }
});

export default router;
