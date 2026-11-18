import { query } from "../db.js";
import { AppError } from "../middleware/errorHandler.js";
import { evaluateReading } from "./alertService.js";

export async function ingestReading({
  room_id,
  tray_id,
  device_id,
  message_id,
  sensor_type,
  value,
  unit,
}) {
  if (!sensor_type || value === undefined || value === null) {
    throw new AppError("sensor_type và value là bắt buộc", 400);
  }

  const metric = sensor_type.toUpperCase();
  const validMetrics = ["TEMPERATURE", "HUMIDITY", "CO2"];
  if (!validMetrics.includes(metric)) {
    throw new AppError(`sensor_type không hợp lệ. Phải là một trong: ${validMetrics.join(", ")}`, 400);
  }

  // Deduplication check via message_id
  if (message_id) {
    const existing = await query(
      "SELECT id FROM sensor_readings WHERE message_id = $1 LIMIT 1",
      [message_id]
    );
    if (existing.rows.length > 0) {
      return { duplicate: true, message: "Mẫu số liệu đã được ghi nhận trước đó (bỏ qua bản ghi trùng)" };
    }
  }

  // Derive room_id if missing
  let resolvedRoomId = room_id;
  if (!resolvedRoomId && tray_id) {
    const trayRes = await query("SELECT room_id FROM trays WHERE id = $1", [tray_id]);
    if (trayRes.rows[0]) resolvedRoomId = trayRes.rows[0].room_id;
  }
  if (!resolvedRoomId && device_id) {
    const devRes = await query("SELECT room_id FROM devices WHERE id = $1", [device_id]);
    if (devRes.rows[0]) resolvedRoomId = devRes.rows[0].room_id;
  }

  const numVal = parseFloat(value);
  const defaultUnit = metric === "TEMPERATURE" ? "°C" : metric === "HUMIDITY" ? "%" : "ppm";

  const result = await query(
    `INSERT INTO sensor_readings (room_id, tray_id, device_id, sensor_type, value, unit, message_id)
     VALUES ($1, $2, $3, $4, $5, $6, $7)
     RETURNING *`,
    [resolvedRoomId || null, tray_id || null, device_id || null, metric, numVal, unit || defaultUnit, message_id || null]
  );

  const reading = result.rows[0];

  // Evaluate against 2-consecutive-sample alert rules
  let alertEvaluation = null;
  if (resolvedRoomId) {
    alertEvaluation = await evaluateReading({
      room_id: resolvedRoomId,
      metric,
      value: numVal,
    });
  }

  return { reading, alertEvaluation };
}

export async function getSensorHistory({ room_id, tray_id, sensor_type, from, to, limit = 200 } = {}, customerId = null, userRole = "ADMIN") {
  let whereConditions = [];
  let params = [];

  // Customer authorization: must have active lease in requested room/tray
  if (userRole === "CUSTOMER") {
    if (!customerId) return [];
    params.push(customerId);
    whereConditions.push(`sr.room_id IN (
      SELECT t.room_id
      FROM trays t
      WHERE t.id IN (
        SELECT rt.tray_id FROM rental_trays rt JOIN rentals r ON r.id = rt.rental_id WHERE r.customer_id = $${params.length} AND r.status = 'ACTIVE'
        UNION
        SELECT r.tray_id FROM rentals r WHERE r.customer_id = $${params.length} AND r.status = 'ACTIVE' AND r.tray_id IS NOT NULL
      )
    )`);
  }

  if (room_id) {
    params.push(room_id);
    whereConditions.push(`sr.room_id = $${params.length}`);
  }

  if (tray_id) {
    params.push(tray_id);
    whereConditions.push(`sr.tray_id = $${params.length}`);
  }

  if (sensor_type) {
    params.push(sensor_type.toUpperCase());
    whereConditions.push(`sr.sensor_type = $${params.length}`);
  }

  if (from) {
    params.push(new Date(from));
    whereConditions.push(`sr.recorded_at >= $${params.length}`);
  }

  if (to) {
    params.push(new Date(to));
    whereConditions.push(`sr.recorded_at <= $${params.length}`);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";
  const safeLimit = Math.min(Math.max(parseInt(limit, 10) || 50, 1), 1000);

  params.push(safeLimit);
  const limitIdx = params.length;

  const result = await query(
    `SELECT sr.*, r.name AS room_name, t.code AS tray_code
     FROM sensor_readings sr
     LEFT JOIN rooms r ON r.id = sr.room_id
     LEFT JOIN trays t ON t.id = sr.tray_id
     ${whereClause}
     ORDER BY sr.recorded_at DESC
     LIMIT $${limitIdx}`,
    params
  );
  return result.rows;
}

export async function getLatestReadings(roomId = null) {
  let where = "";
  const params = [];
  if (roomId) {
    params.push(roomId);
    where = "WHERE room_id = $1";
  }

  const result = await query(
    `SELECT DISTINCT ON (sensor_type)
       sensor_type, value, unit, recorded_at, room_id
     FROM sensor_readings
     ${where}
     ORDER BY sensor_type, recorded_at DESC`,
    params
  );

  const readings = {
    temperature: null,
    humidity: null,
    co2: null,
    last_updated: null,
  };

  for (const row of result.rows) {
    if (row.sensor_type === "TEMPERATURE") {
      readings.temperature = { value: Number(row.value), unit: row.unit || "°C", recorded_at: row.recorded_at };
    }
    if (row.sensor_type === "HUMIDITY") {
      readings.humidity = { value: Number(row.value), unit: row.unit || "%", recorded_at: row.recorded_at };
    }
    if (row.sensor_type === "CO2") {
      readings.co2 = { value: Number(row.value), unit: row.unit || "ppm", recorded_at: row.recorded_at };
    }
    if (!readings.last_updated || new Date(row.recorded_at) > new Date(readings.last_updated)) {
      readings.last_updated = row.recorded_at;
    }
  }

  return readings;
}
