import crypto from "crypto";
import { query } from "../db.js";
import { AppError } from "../middleware/errorHandler.js";
import { mqttService } from "./mqttService.js";

export async function listDevices({ roomId, deviceType, status } = {}) {
  let where = [];
  let params = [];

  if (roomId) {
    params.push(roomId);
    where.push(`d.room_id = $${params.length}`);
  }

  if (deviceType) {
    params.push(deviceType);
    where.push(`d.device_type = $${params.length}`);
  }

  if (status) {
    params.push(status);
    where.push(`d.status = $${params.length}`);
  }

  const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

  const result = await query(
    `SELECT d.*, r.name AS room_name, t.code AS tray_code
     FROM devices d
     LEFT JOIN rooms r ON r.id = d.room_id
     LEFT JOIN trays t ON t.id = d.tray_id
     ${whereClause}
     ORDER BY d.id`,
    params
  );
  return result.rows;
}

export async function getDeviceById(id) {
  const result = await query(
    `SELECT d.*, r.name AS room_name, t.code AS tray_code
     FROM devices d
     LEFT JOIN rooms r ON r.id = d.room_id
     LEFT JOIN trays t ON t.id = d.tray_id
     WHERE d.id = $1`,
    [id]
  );
  if (!result.rows[0]) {
    throw new AppError("Thiết bị không tồn tại", 404);
  }
  return result.rows[0];
}

export async function createDevice({ name, device_type, room_id, tray_id }) {
  const result = await query(
    `INSERT INTO devices (name, device_type, room_id, tray_id, is_on, status)
     VALUES ($1, $2, $3, $4, FALSE, 'ONLINE')
     RETURNING *`,
    [name.trim(), device_type.trim(), room_id || null, tray_id || null]
  );
  return result.rows[0];
}

export async function updateDevice(id, data) {
  const current = await getDeviceById(id);
  const result = await query(
    `UPDATE devices
     SET name = $1, device_type = $2, room_id = $3, tray_id = $4,
         is_on = $5, status = $6, updated_at = NOW()
     WHERE id = $7
     RETURNING *`,
    [
      data.name !== undefined ? data.name.trim() : current.name,
      data.device_type !== undefined ? data.device_type.trim() : current.device_type,
      data.room_id !== undefined ? data.room_id : current.room_id,
      data.tray_id !== undefined ? data.tray_id : current.tray_id,
      data.is_on !== undefined ? Boolean(data.is_on) : current.is_on,
      data.status !== undefined ? data.status : current.status,
      id,
    ]
  );
  return result.rows[0];
}

export async function deleteDevice(id) {
  await getDeviceById(id);
  await query("DELETE FROM devices WHERE id = $1", [id]);
  return { message: "Xóa thiết bị thành công" };
}

/**
 * Send manual control command to device and await 10s ACK.
 * Only Farm Operators & Administrators can issue commands.
 */
export async function sendDeviceCommand(deviceId, { action, payload = {} }, userId) {
  const device = await getDeviceById(deviceId);

  const commandId = crypto.randomUUID();
  const validActions = ["TURN_ON", "TURN_OFF", "TOGGLE", "SET_SPEED", "CONFIG"];

  if (!validActions.includes(action)) {
    throw new AppError(`Lệnh điều khiển không hợp lệ: ${action}`, 400);
  }

  // 1. Record command in PENDING state
  await query(
    `INSERT INTO device_commands (command_id, device_id, action, payload, status, issued_by)
     VALUES ($1, $2, $3, $4, 'PENDING', $5)`,
    [commandId, deviceId, action, JSON.stringify(payload), userId || null]
  );

  // 2. Transmit via MQTT and await 10-second ACK
  const ackResponse = await mqttService.sendCommandAndWaitAck(
    deviceId,
    {
      command_id: commandId,
      action,
      payload,
    },
    10000 // 10 seconds
  );

  if (ackResponse.status === "ACKED") {
    // Determine new is_on state
    let newIsOn = device.is_on;
    if (action === "TURN_ON") newIsOn = true;
    else if (action === "TURN_OFF") newIsOn = false;
    else if (action === "TOGGLE") newIsOn = !device.is_on;

    await query(
      `UPDATE devices SET is_on = $1, updated_at = NOW() WHERE id = $2`,
      [newIsOn, deviceId]
    );

    await query(
      `UPDATE device_commands
       SET status = 'ACKED', acked_at = NOW(), result = $1
       WHERE command_id = $2`,
      [JSON.stringify(ackResponse.payload || {}), commandId]
    );

    return {
      status: "ACKED",
      command_id: commandId,
      device: { ...device, is_on: newIsOn },
      message: "Thiết bị đã thực thi lệnh thành công (ACK)",
    };
  } else {
    // Timeout or Failed
    const finalStatus = ackResponse.status === "TIMEOUT" ? "TIMEOUT" : "FAILED";
    await query(
      `UPDATE device_commands
       SET status = $1, result = $2
       WHERE command_id = $3`,
      [finalStatus, ackResponse.message || "Timeout", commandId]
    );

    throw new AppError(
      ackResponse.message || "Không nhận được phản hồi ACK từ thiết bị trong 10 giây",
      finalStatus === "TIMEOUT" ? 504 : 502,
      { command_id: commandId, status: finalStatus }
    );
  }
}

export async function getDeviceCommandHistory(deviceId) {
  const result = await query(
    `SELECT dc.*, u.full_name AS issued_by_name
     FROM device_commands dc
     LEFT JOIN users u ON u.id = dc.issued_by
     WHERE dc.device_id = $1
     ORDER BY dc.created_at DESC
     LIMIT 50`,
    [deviceId]
  );
  return result.rows;
}
