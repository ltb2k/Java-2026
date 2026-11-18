import { query } from "../db.js";
import { AppError } from "../middleware/errorHandler.js";

export async function listThresholds() {
  const result = await query(
    `SELECT et.*, u.full_name AS updated_by_name
     FROM env_thresholds et
     LEFT JOIN users u ON u.id = et.updated_by
     ORDER BY et.id`
  );
  return result.rows;
}

export async function getThresholdByMetric(metric) {
  const result = await query(
    "SELECT * FROM env_thresholds WHERE metric = $1",
    [metric.toUpperCase()]
  );
  return result.rows[0] || null;
}

export async function updateThreshold(metric, { lower_bound, upper_bound, unit }, userId) {
  const m = metric.toUpperCase();
  const lower = parseFloat(lower_bound);
  const upper = parseFloat(upper_bound);

  if (isNaN(lower) || isNaN(upper) || lower >= upper) {
    throw new AppError("Ngưỡng dưới (lower_bound) phải nhỏ hơn ngưỡng trên (upper_bound)", 400);
  }

  const result = await query(
    `INSERT INTO env_thresholds (metric, lower_bound, upper_bound, unit, updated_by, updated_at)
     VALUES ($1, $2, $3, $4, $5, NOW())
     ON CONFLICT (metric)
     DO UPDATE SET
       lower_bound = EXCLUDED.lower_bound,
       upper_bound = EXCLUDED.upper_bound,
       unit = COALESCE(EXCLUDED.unit, env_thresholds.unit),
       updated_by = EXCLUDED.updated_by,
       updated_at = NOW()
     RETURNING *`,
    [m, lower, upper, unit?.trim() || "unit", userId || null]
  );

  return result.rows[0];
}
