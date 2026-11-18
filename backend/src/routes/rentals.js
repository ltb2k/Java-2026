import { Router } from "express";
import * as rentalService from "../services/rentalService.js";
import { authRequired, requireRoles } from "../middleware/auth.js";
import { validateRequired, validateInt } from "../middleware/validation.js";

const router = Router();

/** GET /api/rentals  — Admin/Operator see all; Customer sees own */
router.get("/", authRequired, async (req, res, next) => {
  try {
    const { status } = req.query;
    const rentals = await rentalService.listRentals({
      customerId: req.user.role === "CUSTOMER" ? req.user.id : undefined,
      status,
      userRole: req.user.role,
    });
    res.json(rentals);
  } catch (err) { next(err); }
});

/** POST /api/rentals  — Customer submits rental request */
router.post("/", authRequired, requireRoles("CUSTOMER"), async (req, res, next) => {
  try {
    validateRequired(req.body, ["package_id"]);
    const rental = await rentalService.requestRental(req.user.id, req.body);
    res.status(201).json(rental);
  } catch (err) { next(err); }
});

/** GET /api/rentals/:id */
router.get("/:id", authRequired, async (req, res, next) => {
  try {
    const id = validateInt(req.params.id, "ID yêu cầu thuê");
    const rental = await rentalService.getRentalById(
      id,
      req.user.role === "CUSTOMER" ? req.user.id : null,
      req.user.role
    );
    res.json(rental);
  } catch (err) { next(err); }
});

/** POST /api/rentals/:id/approve  — Admin, Operator */
router.post("/:id/approve", authRequired, requireRoles("ADMIN", "OPERATOR"), async (req, res, next) => {
  try {
    const id = validateInt(req.params.id, "ID yêu cầu thuê");
    const rental = await rentalService.approveRental(id, req.user.id);
    res.json(rental);
  } catch (err) { next(err); }
});

/** POST /api/rentals/:id/reject  — Admin, Operator */
router.post("/:id/reject", authRequired, requireRoles("ADMIN", "OPERATOR"), async (req, res, next) => {
  try {
    const id = validateInt(req.params.id, "ID yêu cầu thuê");
    const rental = await rentalService.rejectRental(id, req.user.id, req.body);
    res.json(rental);
  } catch (err) { next(err); }
});

/** POST /api/rentals/:id/assign-trays  — Admin, Operator */
router.post("/:id/assign-trays", authRequired, requireRoles("ADMIN", "OPERATOR"), async (req, res, next) => {
  try {
    const id = validateInt(req.params.id, "ID yêu cầu thuê");
    validateRequired(req.body, ["tray_ids"]);
    const result = await rentalService.assignTrays(id, req.user.id, req.body);
    res.json(result);
  } catch (err) { next(err); }
});

/** POST /api/rentals/link  — Customer links tray using code */
router.post("/link", authRequired, requireRoles("CUSTOMER"), async (req, res, next) => {
  try {
    validateRequired(req.body, ["code"]);
    const rental = await rentalService.linkWithCode(req.user.id, req.body);
    res.json({ message: "Liên kết khay thành công! Hợp đồng thuê đã được kích hoạt.", rental });
  } catch (err) { next(err); }
});

/** POST /api/rentals/:id/cancel */
router.post("/:id/cancel", authRequired, async (req, res, next) => {
  try {
    const id = validateInt(req.params.id, "ID yêu cầu thuê");
    const rental = await rentalService.cancelRental(id, req.user.id, req.user.role, req.body);
    res.json({ message: "Đã hủy yêu cầu thuê.", rental });
  } catch (err) { next(err); }
});

export default router;
