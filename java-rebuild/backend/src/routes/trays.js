import { Router } from "express";
import { query } from "../db.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();

router.get("/", authRequired, async (_req, res) => {
  const result = await query(`
    SELECT t.*, r.name AS room_name, rp.name AS package_name
    FROM trays t
    LEFT JOIN rooms r ON r.id=t.room_id
    LEFT JOIN rental_packages rp ON rp.id=t.package_id
    ORDER BY t.id
  `);
  res.json(result.rows);
});

export default router;
