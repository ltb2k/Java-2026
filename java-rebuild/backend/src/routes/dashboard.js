import { Router } from "express";
import { query } from "../db.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();

router.get("/summary", authRequired, async (_req, res) => {
  try {
    const latest = await query(`
      SELECT DISTINCT ON (sensor_type)
        sensor_type, value, recorded_at
      FROM sensor_readings
      ORDER BY sensor_type, recorded_at DESC
    `);

    const trays = await query(`
      SELECT t.code, t.status, r.name AS room_name, rp.name AS package_name,
             u.full_name AS customer_name, t.growth_day, t.growth_total_days
      FROM trays t
      LEFT JOIN rooms r ON r.id=t.room_id
      LEFT JOIN rental_packages rp ON rp.id=t.package_id
      LEFT JOIN rentals rent ON rent.tray_id=t.id AND rent.status='ACTIVE'
      LEFT JOIN users u ON u.id=rent.customer_id
      ORDER BY t.id
      LIMIT 1
    `);

    const current = { temperature: 0, humidity: 0, co2: 0 };
    for (const row of latest.rows) {
      if (row.sensor_type === "TEMPERATURE") current.temperature = Number(row.value);
      if (row.sensor_type === "HUMIDITY") current.humidity = Number(row.value);
      if (row.sensor_type === "CO2") current.co2 = Number(row.value);
    }

    res.json({ current, tray: trays.rows[0] || null, backend: "connected" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Cannot load dashboard" });
  }
});

export default router;
