import { query, withTransaction } from "../db.js";
import { AppError } from "../middleware/errorHandler.js";

/**
 * Evaluates a sensor reading against environmental thresholds
 * using the mandatory 2-CONSECUTIVE-SAMPLE rule.
 *
 * Rules (SRS requirement):
 * 1. If threshold is not configured -> record status UNCONFIGURED.
 * 2. 1st violation sample -> record in consecutive_violations with count=1; NO alert generated.
 * 3. 2nd (or more) consecutive violation -> generate/update alert in alerts table.
 * 4. Normal sample -> resets consecutive_violations count to 0 and auto-resolves any active alert.
 */
export async function evaluateReading({ room_id, metric, value }) {
  if (!room_id || !metric || value === undefined || value === null) {
    return { status: "SKIPPED" };
  }

  const metricKey = metric.toUpperCase();
  const numValue = parseFloat(value);

  // 1. Fetch threshold
  const thresholdRes = await query(
    "SELECT * FROM env_thresholds WHERE metric = $1",
    [metricKey]
  );
  const threshold = thresholdRes.rows[0];

  if (!threshold) {
    return { status: "UNCONFIGURED", metric: metricKey };
  }

  const lower = parseFloat(threshold.lower_bound);
  const upper = parseFloat(threshold.upper_bound);
  const isViolation = numValue < lower || numValue > upper;

  return withTransaction(async (client) => {
    // 2. Fetch existing violation tracker
    const violRes = await client.query(
      `SELECT count, last_value FROM consecutive_violations
       WHERE room_id = $1 AND metric = $2
       FOR UPDATE`,
      [room_id, metricKey]
    );
    const existing = violRes.rows[0];
    const prevCount = existing ? parseInt(existing.count, 10) : 0;

    if (isViolation) {
      const newCount = prevCount + 1;

      // Upsert consecutive_violations
      await client.query(
        `INSERT INTO consecutive_violations (room_id, metric, count, last_value, last_recorded_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT (room_id, metric)
         DO UPDATE SET count = $3, last_value = $4, last_recorded_at = NOW()`,
        [room_id, metricKey, newCount, numValue]
      );

      // Check if this is the 2nd consecutive sample (or ongoing)
      if (newCount >= 2) {
        // Calculate severity: DANGER if > 25% beyond bounds, else WARNING
        const span = upper - lower;
        const isExtreme = (numValue < lower - 0.25 * span) || (numValue > upper + 0.25 * span);
        const severity = isExtreme ? "DANGER" : "WARNING";

        const title = `Cảnh báo ${metricKey}: vượt ngưỡng (${numValue} ${threshold.unit})`;
        const message = `Chỉ số ${metricKey} tại phòng đạt ${numValue} ${threshold.unit}, liên tiếp ${newCount} lần nằm ngoài dải an toàn [${lower} - ${upper} ${threshold.unit}].`;

        // Check for existing active alert to update instead of spamming duplicates
        const existingAlert = await client.query(
          `SELECT id FROM alerts
           WHERE room_id = $1 AND metric = $2 AND status = 'ACTIVE'
           LIMIT 1`,
          [room_id, metricKey]
        );

        let alertId;
        if (existingAlert.rows.length > 0) {
          alertId = existingAlert.rows[0].id;
          await client.query(
            `UPDATE alerts
             SET message = $1, severity = $2, created_at = NOW(), is_read = FALSE
             WHERE id = $3`,
            [message, severity, alertId]
          );
        } else {
          const newAlert = await client.query(
            `INSERT INTO alerts (room_id, metric, severity, title, message, status)
             VALUES ($1, $2, $3, $4, $5, 'ACTIVE')
             RETURNING id`,
            [room_id, metricKey, severity, title, message]
          );
          alertId = newAlert.rows[0].id;
        }

        return {
          status: "ALERT_GENERATED",
          alertId,
          violationCount: newCount,
          metric: metricKey,
          value: numValue,
        };
      }

      // 1st sample violation: NO alert generated yet
      return {
        status: "FIRST_VIOLATION_PENDING_CONFIRMATION",
        violationCount: 1,
        metric: metricKey,
        value: numValue,
      };
    } else {
      // Normal reading within thresholds
      if (prevCount > 0) {
        await client.query(
          `UPDATE consecutive_violations
           SET count = 0, last_value = $1, last_recorded_at = NOW()
           WHERE room_id = $2 AND metric = $3`,
          [numValue, room_id, metricKey]
        );
      }

      // Auto-resolve any active alert
      const resolved = await client.query(
        `UPDATE alerts
         SET status = 'RESOLVED', resolved_at = NOW()
         WHERE room_id = $1 AND metric = $2 AND status = 'ACTIVE'
         RETURNING id`,
        [room_id, metricKey]
      );

      return {
        status: "NORMAL",
        metric: metricKey,
        value: numValue,
        resolvedCount: resolved.rows.length,
      };
    }
  });
}

export async function listAlerts({ roomId, severity, isRead, status, limit = 50, offset = 0 } = {}, customerId = null, userRole = "ADMIN") {
  let whereConditions = [];
  let params = [];

  // Customer authorization: only see alerts for rooms with customer's active leased trays
  if (userRole === "CUSTOMER") {
    if (!customerId) return [];
    params.push(customerId);
    whereConditions.push(`a.room_id IN (
      SELECT t.room_id
      FROM trays t
      WHERE t.id IN (
        SELECT rt.tray_id FROM rental_trays rt JOIN rentals r ON r.id = rt.rental_id WHERE r.customer_id = $${params.length} AND r.status = 'ACTIVE'
        UNION
        SELECT r.tray_id FROM rentals r WHERE r.customer_id = $${params.length} AND r.status = 'ACTIVE' AND r.tray_id IS NOT NULL
      )
    )`);
  }

  if (roomId) {
    params.push(roomId);
    whereConditions.push(`a.room_id = $${params.length}`);
  }

  if (severity) {
    params.push(severity);
    whereConditions.push(`a.severity = $${params.length}`);
  }

  if (status) {
    params.push(status);
    whereConditions.push(`a.status = $${params.length}`);
  }

  if (isRead !== undefined && isRead !== null) {
    params.push(isRead === "true" || isRead === true);
    whereConditions.push(`a.is_read = $${params.length}`);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

  params.push(limit);
  const limitIdx = params.length;
  params.push(offset);
  const offsetIdx = params.length;

  const result = await query(
    `SELECT a.*, r.name AS room_name
     FROM alerts a
     LEFT JOIN rooms r ON r.id = a.room_id
     ${whereClause}
     ORDER BY a.created_at DESC
     LIMIT $${limitIdx} OFFSET $${offsetIdx}`,
    params
  );
  return result.rows;
}

export async function markAsRead(id) {
  const result = await query(
    `UPDATE alerts SET is_read = TRUE WHERE id = $1 RETURNING *`,
    [id]
  );
  if (!result.rows[0]) {
    throw new AppError("Cảnh báo không tồn tại", 404);
  }
  return result.rows[0];
}

export async function resolveAlert(id) {
  const result = await query(
    `UPDATE alerts SET status = 'RESOLVED', resolved_at = NOW() WHERE id = $1 RETURNING *`,
    [id]
  );
  if (!result.rows[0]) {
    throw new AppError("Cảnh báo không tồn tại", 404);
  }
  return result.rows[0];
}
