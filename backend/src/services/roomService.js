import { query } from "../db.js";
import { AppError } from "../middleware/errorHandler.js";

export async function listRooms({ status, includeArchived = false } = {}) {
  let where = includeArchived ? "WHERE 1=1" : "WHERE r.is_archived = FALSE";
  const params = [];

  if (status) {
    params.push(status);
    where += ` AND r.status = $${params.length}`;
  }

  const result = await query(
    `SELECT r.*,
            COUNT(DISTINCT t.id) FILTER (WHERE t.is_archived = FALSE) AS total_trays,
            COUNT(DISTINCT t.id) FILTER (WHERE t.is_archived = FALSE AND t.status = 'RENTED') AS rented_trays,
            COUNT(DISTINCT d.id) AS total_devices
     FROM rooms r
     LEFT JOIN trays t ON t.room_id = r.id
     LEFT JOIN devices d ON d.room_id = r.id
     ${where}
     GROUP BY r.id
     ORDER BY r.id`,
    params
  );
  return result.rows;
}

export async function getRoomById(id) {
  const result = await query(
    `SELECT r.*,
            COUNT(DISTINCT t.id) FILTER (WHERE t.is_archived = FALSE) AS total_trays,
            COUNT(DISTINCT d.id) AS total_devices
     FROM rooms r
     LEFT JOIN trays t ON t.room_id = r.id
     LEFT JOIN devices d ON d.room_id = r.id
     WHERE r.id = $1
     GROUP BY r.id`,
    [id]
  );
  if (!result.rows[0]) {
    throw new AppError("Phòng trồng không tồn tại", 404);
  }
  return result.rows[0];
}

export async function createRoom({ name, location, status = "ACTIVE" }) {
  const result = await query(
    `INSERT INTO rooms (name, location, status)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [name.trim(), location ? location.trim() : null, status]
  );
  return result.rows[0];
}

export async function updateRoom(id, { name, location, status }) {
  const current = await getRoomById(id);
  const result = await query(
    `UPDATE rooms
     SET name = $1, location = $2, status = $3, updated_at = NOW()
     WHERE id = $4
     RETURNING *`,
    [
      name !== undefined ? name.trim() : current.name,
      location !== undefined ? location?.trim() : current.location,
      status !== undefined ? status : current.status,
      id,
    ]
  );
  return result.rows[0];
}

export async function deleteRoom(id) {
  await getRoomById(id);

  // Check if active trays or devices are using this room
  const checkTrays = await query(
    "SELECT COUNT(*) AS count FROM trays WHERE room_id = $1 AND is_archived = FALSE",
    [id]
  );
  const checkDevices = await query(
    "SELECT COUNT(*) AS count FROM devices WHERE room_id = $1",
    [id]
  );

  const hasTrays = parseInt(checkTrays.rows[0].count, 10) > 0;
  const hasDevices = parseInt(checkDevices.rows[0].count, 10) > 0;

  if (hasTrays || hasDevices) {
    // Soft archive as mandated by SRS specification
    await query(
      "UPDATE rooms SET is_archived = TRUE, status = 'INACTIVE', updated_at = NOW() WHERE id = $1",
      [id]
    );
    return {
      message: "Phòng đang có khay hoặc thiết bị liên kết, đã chuyển sang trạng thái lưu trữ (Archived) thay vì xóa vĩnh viễn.",
      archived: true,
    };
  }

  await query("DELETE FROM rooms WHERE id = $1", [id]);
  return { message: "Xóa phòng trồng thành công", archived: false };
}
