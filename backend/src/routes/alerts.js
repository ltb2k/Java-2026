import { Router } from "express";
import { query } from "../db.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();

router.get("/", authRequired, async (_req, res) => {
  const result = await query(
    "SELECT * FROM alerts ORDER BY created_at DESC LIMIT 50"
  );
  res.json(result.rows);
});

export default router;
