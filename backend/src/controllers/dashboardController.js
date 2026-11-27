const pool = require("../config/db");

exports.summary = async (req, res) => {
  try {
    const staff = req.user.role === "ADMIN" || req.user.role === "FARM_OPERATOR";
    const customerScope = `
      FROM cultivation_trays t
      JOIN rentals rent ON rent.tray_id=t.id AND rent.customer_id=$1 AND rent.status='ACTIVE'`;
    const [rooms, trays, customers, devices, readings, featured] = await Promise.all([
      staff
        ? pool.query("SELECT COUNT(*)::int count FROM cultivation_rooms")
        : pool.query(`SELECT COUNT(DISTINCT t.room_id)::int count ${customerScope}`, [req.user.id]),
      staff
        ? pool.query("SELECT COUNT(*)::int count FROM cultivation_trays")
        : pool.query(`SELECT COUNT(*)::int count ${customerScope}`, [req.user.id]),
      staff
        ? pool.query("SELECT COUNT(*)::int count FROM users u JOIN roles r ON r.id=u.role_id WHERE r.name='CUSTOMER'")
        : Promise.resolve({ rows: [{ count: 0 }] }),
      staff
        ? pool.query("SELECT COUNT(*)::int count FROM iot_devices WHERE status='ONLINE'")
        : pool.query(`SELECT COUNT(*)::int count FROM iot_devices d WHERE d.status='ONLINE' AND EXISTS (
            SELECT 1 ${customerScope} WHERE t.room_id=d.room_id
          )`, [req.user.id]),
      pool.query(`SELECT
        AVG(CASE WHEN s.sensor_type='TEMPERATURE' THEN sr.value END) temperature,
        AVG(CASE WHEN s.sensor_type='HUMIDITY' THEN sr.value END) humidity,
        AVG(CASE WHEN s.sensor_type='CO2' THEN sr.value END) co2
        FROM sensor_readings sr JOIN sensors s ON s.id=sr.sensor_id
        WHERE sr.recorded_at > NOW()-INTERVAL '24 hours'
        ${staff ? "" : "AND EXISTS (SELECT 1 FROM rentals rent WHERE rent.tray_id=sr.tray_id AND rent.customer_id=$1 AND rent.status='ACTIVE')"}`,
        staff ? [] : [req.user.id]),
      pool.query(`
        SELECT t.code, t.mushroom_type, t.growth_day, t.status, t.expected_harvest_date,
          u.full_name customer_name, pkg.name package_name, rm.name room_name, t.rack,
          (SELECT stage FROM cultivation_progress p WHERE p.tray_id=t.id ORDER BY recorded_at DESC LIMIT 1) stage
        FROM cultivation_trays t
        LEFT JOIN cultivation_rooms rm ON rm.id=t.room_id
        LEFT JOIN LATERAL (
          SELECT * FROM rentals WHERE tray_id=t.id AND status='ACTIVE' ORDER BY created_at DESC LIMIT 1
        ) rent ON TRUE
        LEFT JOIN users u ON u.id=rent.customer_id
        LEFT JOIN rental_packages pkg ON pkg.id=rent.package_id
        ${staff ? "" : "WHERE rent.customer_id=$1"}
        ORDER BY t.created_at DESC LIMIT 1`, staff ? [] : [req.user.id])
    ]);
    res.json({
      counts: {
        rooms: rooms.rows[0].count,
        trays: trays.rows[0].count,
        customers: customers.rows[0].count,
        onlineDevices: devices.rows[0].count
      },
      current: readings.rows[0],
      featured: featured.rows[0] || null
    });
  } catch (e) { console.error("Controller request failed", { code: e.code || "UNKNOWN" }); return res.status(500).json({ message: "Internal server error" }); }
};
