const pool = require("../config/db");

function csv(rows) {
  if (!rows.length) return "";
  const keys = Object.keys(rows[0]);
  const lines = [keys.join(",")];
  for (const row of rows) {
    lines.push(keys.map((k) => {
      const v = row[k] == null ? "" : String(row[k]).replace(/"/g, '""');
      return /[",\n]/.test(v) ? `"${v}"` : v;
    }).join(","));
  }
  return lines.join("\n");
}

exports.summary = async (req, res) => {
  try {
    const [rentals, harvests, env] = await Promise.all([
      pool.query(`SELECT COUNT(*)::int total,
        COUNT(*) FILTER (WHERE status='ACTIVE')::int active,
        COALESCE(SUM(pkg.price),0)::numeric revenue
        FROM rentals rent JOIN rental_packages pkg ON pkg.id=rent.package_id`),
      pool.query(`SELECT COUNT(*)::int total, COALESCE(SUM(quantity_kg),0)::numeric kg
        FROM harvests WHERE status IN ('COMPLETED','PLANNED','REQUESTED')`),
      pool.query(`SELECT s.sensor_type,
        ROUND(AVG(sr.value)::numeric,2) avg, ROUND(MIN(sr.value)::numeric,2) min, ROUND(MAX(sr.value)::numeric,2) max
        FROM sensor_readings sr JOIN sensors s ON s.id=sr.sensor_id
        WHERE sr.recorded_at > NOW()-INTERVAL '7 days'
        GROUP BY s.sensor_type`)
    ]);
    res.json({ rentals: rentals.rows[0], harvests: harvests.rows[0], environment: env.rows });
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.exportCsv = async (req, res) => {
  try {
    const type = req.query.type || "rentals";
    let rows;
    if (type === "harvests") {
      rows = (await pool.query(`SELECT h.harvest_date,t.code tray_code,t.mushroom_type,h.quantity_kg,h.status,h.delivery_requested
        FROM harvests h JOIN cultivation_trays t ON t.id=h.tray_id ORDER BY h.harvest_date DESC`)).rows;
    } else if (type === "environment") {
      rows = (await pool.query(`SELECT sr.recorded_at,s.sensor_type,sr.value,s.unit,t.code tray_code
        FROM sensor_readings sr JOIN sensors s ON s.id=sr.sensor_id
        LEFT JOIN cultivation_trays t ON t.id=sr.tray_id
        WHERE sr.recorded_at > NOW()-INTERVAL '7 days' ORDER BY sr.recorded_at DESC LIMIT 5000`)).rows;
    } else {
      rows = (await pool.query(`SELECT rent.start_date,rent.end_date,rent.status,t.code tray_code,u.full_name customer_name,pkg.name package_name,pkg.price
        FROM rentals rent
        JOIN cultivation_trays t ON t.id=rent.tray_id
        JOIN users u ON u.id=rent.customer_id
        JOIN rental_packages pkg ON pkg.id=rent.package_id
        ORDER BY rent.created_at DESC`)).rows;
    }
    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader("Content-Disposition", `attachment; filename=${type}.csv`);
    res.send(csv(rows));
  } catch (e) { res.status(500).json({ message: e.message }); }
};
