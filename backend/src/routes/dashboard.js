import { Router } from "express";
import { query } from "../db.js";
import { authRequired } from "../middleware/auth.js";
import { getLatestReadings } from "../services/sensorService.js";

const router = Router();

/** GET /api/dashboard/summary  — Overview stats for dashboard */
router.get("/summary", authRequired, async (req, res, next) => {
  try {
    const [
      roomsRes,
      traysRes,
      devicesRes,
      activeRentalsRes,
      pendingRentalsRes,
      unreadAlertsRes,
      latestReadings,
    ] = await Promise.all([
      query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='ACTIVE') AS active FROM rooms WHERE is_archived=FALSE"),
      query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE status='RENTED') AS rented, COUNT(*) FILTER (WHERE status='AVAILABLE') AS available FROM trays WHERE is_archived=FALSE"),
      query("SELECT COUNT(*) AS total, COUNT(*) FILTER (WHERE is_on=TRUE) AS on_count FROM devices"),
      query("SELECT COUNT(*) AS count FROM rentals WHERE status='ACTIVE'"),
      query("SELECT COUNT(*) AS count FROM rentals WHERE status='PENDING'"),
      query("SELECT COUNT(*) AS count FROM alerts WHERE status='ACTIVE' AND is_read=FALSE"),
      getLatestReadings(),
    ]);

    // Recent activity
    const recentActivity = await query(`
      SELECT 'rental' AS type, r.id, u.full_name AS actor, r.status, r.updated_at AS ts
      FROM rentals r JOIN users u ON u.id=r.customer_id
      WHERE r.updated_at > NOW() - INTERVAL '24 hours'
      ORDER BY r.updated_at DESC LIMIT 5
    `);

    res.json({
      rooms: {
        total: parseInt(roomsRes.rows[0].total, 10),
        active: parseInt(roomsRes.rows[0].active, 10),
      },
      trays: {
        total: parseInt(traysRes.rows[0].total, 10),
        rented: parseInt(traysRes.rows[0].rented, 10),
        available: parseInt(traysRes.rows[0].available, 10),
      },
      devices: {
        total: parseInt(devicesRes.rows[0].total, 10),
        on: parseInt(devicesRes.rows[0].on_count, 10),
      },
      rentals: {
        active: parseInt(activeRentalsRes.rows[0].count, 10),
        pending: parseInt(pendingRentalsRes.rows[0].count, 10),
      },
      unread_alerts: parseInt(unreadAlertsRes.rows[0].count, 10),
      environment: latestReadings,
      recent_activity: recentActivity.rows,
      backend: "connected",
    });
  } catch (err) { next(err); }
});

export default router;
