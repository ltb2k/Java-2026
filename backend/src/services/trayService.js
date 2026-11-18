import { query, withTransaction } from "../db.js";
import { AppError } from "../middleware/errorHandler.js";

const VALID_STAGES = [
  "PREPARATION",
  "INCUBATION",
  "FRUITING",
  "READY_TO_HARVEST",
  "HARVESTED",
  "COMPLETED",
];

export async function listTrays({ roomId, status, growthStage, customerId, userRole } = {}) {
  let whereConditions = ["t.is_archived = FALSE"];
  let params = [];

  // Customer isolation (IDOR protection)
  if (userRole === "CUSTOMER") {
    if (!customerId) return [];
    params.push(customerId);
    whereConditions.push(`t.id IN (
      SELECT rt.tray_id
      FROM rental_trays rt
      JOIN rentals r ON r.id = rt.rental_id
      WHERE r.customer_id = $${params.length} AND r.status = 'ACTIVE'
      UNION
      SELECT r.tray_id
      FROM rentals r
      WHERE r.customer_id = $${params.length} AND r.status = 'ACTIVE' AND r.tray_id IS NOT NULL
    )`);
  }

  if (roomId) {
    params.push(roomId);
    whereConditions.push(`t.room_id = $${params.length}`);
  }

  if (status) {
    params.push(status);
    whereConditions.push(`t.status = $${params.length}`);
  }

  if (growthStage) {
    params.push(growthStage);
    whereConditions.push(`t.growth_stage = $${params.length}`);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

  const result = await query(
    `SELECT t.*,
            r.name AS room_name,
            rp.name AS package_name,
            u.full_name AS customer_name,
            rent.id AS rental_id,
            rent.status AS rental_status
     FROM trays t
     LEFT JOIN rooms r ON r.id = t.room_id
     LEFT JOIN rental_packages rp ON rp.id = t.package_id
     LEFT JOIN rentals rent ON (rent.tray_id = t.id OR rent.id IN (SELECT rental_id FROM rental_trays WHERE tray_id = t.id)) AND rent.status = 'ACTIVE'
     LEFT JOIN users u ON u.id = rent.customer_id
     ${whereClause}
     ORDER BY t.id ASC`,
    params
  );
  return result.rows;
}

export async function getTrayById(id, customerId = null, userRole = "ADMIN") {
  const result = await query(
    `SELECT t.*,
            r.name AS room_name,
            rp.name AS package_name,
            u.id AS customer_id,
            u.full_name AS customer_name,
            rent.id AS rental_id,
            rent.status AS rental_status
     FROM trays t
     LEFT JOIN rooms r ON r.id = t.room_id
     LEFT JOIN rental_packages rp ON rp.id = t.package_id
     LEFT JOIN rentals rent ON (rent.tray_id = t.id OR rent.id IN (SELECT rental_id FROM rental_trays WHERE tray_id = t.id)) AND rent.status = 'ACTIVE'
     LEFT JOIN users u ON u.id = rent.customer_id
     WHERE t.id = $1 AND t.is_archived = FALSE`,
    [id]
  );

  const tray = result.rows[0];
  if (!tray) {
    throw new AppError("Khay trồng không tồn tại", 404);
  }

  // Customer authorization check
  if (userRole === "CUSTOMER" && tray.customer_id !== customerId) {
    throw new AppError("Bạn không có quyền truy cập thông tin khay trồng này", 403);
  }

  return tray;
}

export async function createTray({
  code,
  room_id,
  package_id,
  status = "AVAILABLE",
  growth_day = 1,
  growth_total_days = 30,
  mushroom_variety = "Nấm Bào Ngư Xám",
}) {
  const existing = await query("SELECT id FROM trays WHERE code = $1", [code.trim()]);
  if (existing.rows.length > 0) {
    throw new AppError("Mã khay đã tồn tại trong hệ thống", 409);
  }

  const result = await query(
    `INSERT INTO trays (code, room_id, package_id, status, growth_day, growth_total_days, mushroom_variety, growth_stage)
     VALUES ($1, $2, $3, $4, $5, $6, $7, 'PREPARATION')
     RETURNING *`,
    [code.trim(), room_id || null, package_id || null, status, growth_day, growth_total_days, mushroom_variety.trim()]
  );
  return result.rows[0];
}

export async function updateTray(id, data) {
  const current = await getTrayById(id);

  const code = data.code !== undefined ? data.code.trim() : current.code;
  const roomId = data.room_id !== undefined ? data.room_id : current.room_id;
  const packageId = data.package_id !== undefined ? data.package_id : current.package_id;
  const status = data.status !== undefined ? data.status : current.status;
  const growthDay = data.growth_day !== undefined ? parseInt(data.growth_day, 10) : current.growth_day;
  const growthTotalDays = data.growth_total_days !== undefined ? parseInt(data.growth_total_days, 10) : current.growth_total_days;
  const variety = data.mushroom_variety !== undefined ? data.mushroom_variety.trim() : current.mushroom_variety;

  const result = await query(
    `UPDATE trays
     SET code = $1, room_id = $2, package_id = $3, status = $4,
         growth_day = $5, growth_total_days = $6, mushroom_variety = $7, updated_at = NOW()
     WHERE id = $8
     RETURNING *`,
    [code, roomId, packageId, status, growthDay, growthTotalDays, variety, id]
  );
  return result.rows[0];
}

export async function deleteTray(id) {
  await getTrayById(id);

  // Check if tray is currently rented or has harvest records
  const checkRentals = await query(
    "SELECT COUNT(*) AS count FROM rentals WHERE (tray_id = $1 OR id IN (SELECT rental_id FROM rental_trays WHERE tray_id = $1)) AND status = 'ACTIVE'",
    [id]
  );
  const checkHarvests = await query(
    "SELECT COUNT(*) AS count FROM harvests WHERE tray_id = $1",
    [id]
  );

  const hasRentals = parseInt(checkRentals.rows[0].count, 10) > 0;
  const hasHarvests = parseInt(checkHarvests.rows[0].count, 10) > 0;

  if (hasRentals || hasHarvests) {
    // Soft archive
    await query("UPDATE trays SET is_archived = TRUE, status = 'MAINTENANCE', updated_at = NOW() WHERE id = $1", [id]);
    return {
      message: "Khay đang có hợp đồng hoặc lịch sử thu hoạch, đã lưu trữ thay vì xóa cứng.",
      archived: true,
    };
  }

  await query("DELETE FROM trays WHERE id = $1", [id]);
  return { message: "Xóa khay thành công", archived: false };
}

export async function updateStage(id, { stage, notes }, userId) {
  const tray = await getTrayById(id);

  if (!VALID_STAGES.includes(stage)) {
    throw new AppError(`Giai đoạn không hợp lệ. Các giai đoạn hợp lệ: ${VALID_STAGES.join(", ")}`, 400);
  }

  const currentIndex = VALID_STAGES.indexOf(tray.growth_stage || "PREPARATION");
  const newIndex = VALID_STAGES.indexOf(stage);

  // Disallow skipping multiple stages forward or moving backward irregularly
  if (newIndex < currentIndex) {
    throw new AppError(`Không thể quay lại giai đoạn trước từ ${tray.growth_stage} về ${stage}`, 400);
  }

  return withTransaction(async (client) => {
    const updatedTray = await client.query(
      `UPDATE trays
       SET growth_stage = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [stage, id]
    );

    await client.query(
      `INSERT INTO growth_logs (tray_id, stage, notes, created_by)
       VALUES ($1, $2, $3, $4)`,
      [id, stage, notes || null, userId || null]
    );

    return updatedTray.rows[0];
  });
}

export async function getGrowthLogs(trayId) {
  const result = await query(
    `SELECT gl.*, u.full_name AS recorder_name
     FROM growth_logs gl
     LEFT JOIN users u ON u.id = gl.created_by
     WHERE gl.tray_id = $1
     ORDER BY gl.created_at ASC`,
    [trayId]
  );
  return result.rows;
}
