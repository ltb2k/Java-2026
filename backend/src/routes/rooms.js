import { Router } from "express";
import * as roomService from "../services/roomService.js";
import { authRequired, requireRoles } from "../middleware/auth.js";
import { validateRequired, validateInt } from "../middleware/validation.js";

const router = Router();

/** GET /api/rooms  — Admin, Operator */
router.get("/", authRequired, requireRoles("ADMIN", "OPERATOR"), async (req, res, next) => {
  try {
    const { status, includeArchived } = req.query;
    const rooms = await roomService.listRooms({ status, includeArchived: includeArchived === "true" });
    res.json(rooms);
  } catch (err) { next(err); }
});

/** POST /api/rooms  — Admin, Operator */
router.post("/", authRequired, requireRoles("ADMIN", "OPERATOR"), async (req, res, next) => {
  try {
    validateRequired(req.body, ["name"]);
    const room = await roomService.createRoom(req.body);
    res.status(201).json(room);
  } catch (err) { next(err); }
});

/** GET /api/rooms/:id  — Admin, Operator */
router.get("/:id", authRequired, requireRoles("ADMIN", "OPERATOR"), async (req, res, next) => {
  try {
    const id = validateInt(req.params.id, "ID phòng");
    const room = await roomService.getRoomById(id);
    res.json(room);
  } catch (err) { next(err); }
});

/** PUT /api/rooms/:id  — Admin, Operator */
router.put("/:id", authRequired, requireRoles("ADMIN", "OPERATOR"), async (req, res, next) => {
  try {
    const id = validateInt(req.params.id, "ID phòng");
    const room = await roomService.updateRoom(id, req.body);
    res.json(room);
  } catch (err) { next(err); }
});

/** DELETE /api/rooms/:id  — Admin, Operator */
router.delete("/:id", authRequired, requireRoles("ADMIN", "OPERATOR"), async (req, res, next) => {
  try {
    const id = validateInt(req.params.id, "ID phòng");
    const result = await roomService.deleteRoom(id);
    res.json(result);
  } catch (err) { next(err); }
});

export default router;
