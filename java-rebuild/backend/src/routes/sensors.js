import { Router } from "express";
import { query } from "../db.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();

router.get("/history", authRequired, async (_req, res) => {
  try {
    const result = await query(`
      SELECT sensor_type, value, recorded_at
      FROM sensor_readings
      ORDER BY recorded_at DESC
      LIMIT 200
    `);
    res.json(result.rows);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Cannot load sensor history" });
  }
});

router.post("/", authRequired, async (req, res) => {
  try {
    const { tray_id, sensor_type, value } = req.body;
    if (!sensor_type || value === undefined) {
      return res.status(400).json({ message: "sensor_type and value are required" });
    }

    const result = await query(
      `INSERT INTO sensor_readings (tray_id, sensor_type, value)
       VALUES ($1,$2,$3) RETURNING *`,
      [tray_id || null, sensor_type, Number(value)]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Cannot save sensor reading" });
  }
});

export default router;
