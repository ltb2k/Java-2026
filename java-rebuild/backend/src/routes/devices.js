import { Router } from "express";
import { query } from "../db.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();

router.get("/", authRequired, async (_req, res) => {
  const result = await query("SELECT * FROM devices ORDER BY id");
  res.json(result.rows);
});

router.post("/:id/toggle", authRequired, async (req, res) => {
  const result = await query(
    "UPDATE devices SET is_on=NOT is_on, updated_at=NOW() WHERE id=$1 RETURNING *",
    [req.params.id]
  );
  if (!result.rows[0]) return res.status(404).json({ message: "Device not found" });
  res.json(result.rows[0]);
});

export default router;
