import { Router } from "express";
import * as deviceService from "../services/deviceService.js";
import { authRequired, requireRoles } from "../middleware/auth.js";
import { validateRequired, validateInt } from "../middleware/validation.js";

const router = Router();

/** GET /api/devices  — Admin, Operator */
router.get("/", authRequired, requireRoles("ADMIN", "OPERATOR"), async (req, res, next) => {
  try {
    const { room_id, device_type, status } = req.query;
    const devices = await deviceService.listDevices({
      roomId: room_id ? +room_id : undefined,
      deviceType: device_type,
      status,
    });
    res.json(devices);
  } catch (err) { next(err); }
});

/** POST /api/devices  — Admin, Operator */
router.post("/", authRequired, requireRoles("ADMIN", "OPERATOR"), async (req, res, next) => {
  try {
    validateRequired(req.body, ["name", "device_type"]);
    const device = await deviceService.createDevice(req.body);
    res.status(201).json(device);
  } catch (err) { next(err); }
});

/** GET /api/devices/:id  — Admin, Operator */
router.get("/:id", authRequired, requireRoles("ADMIN", "OPERATOR"), async (req, res, next) => {
  try {
    const id = validateInt(req.params.id, "ID thiết bị");
    const device = await deviceService.getDeviceById(id);
    res.json(device);
  } catch (err) { next(err); }
});

/** PUT /api/devices/:id  — Admin, Operator */
router.put("/:id", authRequired, requireRoles("ADMIN", "OPERATOR"), async (req, res, next) => {
  try {
    const id = validateInt(req.params.id, "ID thiết bị");
    const device = await deviceService.updateDevice(id, req.body);
    res.json(device);
  } catch (err) { next(err); }
});

/** DELETE /api/devices/:id  — Admin, Operator */
router.delete("/:id", authRequired, requireRoles("ADMIN", "OPERATOR"), async (req, res, next) => {
  try {
    const id = validateInt(req.params.id, "ID thiết bị");
    const result = await deviceService.deleteDevice(id);
    res.json(result);
  } catch (err) { next(err); }
});

/** POST /api/devices/:id/command  — Admin, Operator (send command + await ACK) */
router.post("/:id/command", authRequired, requireRoles("ADMIN", "OPERATOR"), async (req, res, next) => {
  try {
    const id = validateInt(req.params.id, "ID thiết bị");
    validateRequired(req.body, ["action"]);
    const result = await deviceService.sendDeviceCommand(id, req.body, req.user.id);
    res.json(result);
  } catch (err) { next(err); }
});

/** GET /api/devices/:id/commands  — Admin, Operator (command history) */
router.get("/:id/commands", authRequired, requireRoles("ADMIN", "OPERATOR"), async (req, res, next) => {
  try {
    const id = validateInt(req.params.id, "ID thiết bị");
    const history = await deviceService.getDeviceCommandHistory(id);
    res.json(history);
  } catch (err) { next(err); }
});

export default router;
