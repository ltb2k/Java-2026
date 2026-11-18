import { query, withTransaction } from "../db.js";
import { AppError } from "../middleware/errorHandler.js";

export async function listHarvests({ trayId, status } = {}, customerId = null, userRole = "ADMIN") {
  let where = [];
  let params = [];

  // Customer authorization: only see harvests for trays belonging to customer
  if (userRole === "CUSTOMER") {
    if (!customerId) return [];
    params.push(customerId);
    where.push(`h.tray_id IN (
      SELECT rt.tray_id FROM rental_trays rt JOIN rentals r ON r.id = rt.rental_id WHERE r.customer_id = $${params.length}
      UNION
      SELECT r.tray_id FROM rentals r WHERE r.customer_id = $${params.length} AND r.tray_id IS NOT NULL
    )`);
  }

  if (trayId) {
    params.push(trayId);
    where.push(`h.tray_id = $${params.length}`);
  }

  if (status) {
    params.push(status);
    where.push(`h.status = $${params.length}`);
  }

  const whereClause = where.length > 0 ? `WHERE ${where.join(" AND ")}` : "";

  const result = await query(
    `SELECT h.*,
            t.code AS tray_code,
            t.mushroom_variety,
            r.name AS room_name,
            u.full_name AS recorded_by_name
     FROM harvests h
     LEFT JOIN trays t ON t.id = h.tray_id
     LEFT JOIN rooms r ON r.id = t.room_id
     LEFT JOIN users u ON u.id = h.recorded_by
     ${whereClause}
     ORDER BY COALESCE(h.harvest_date, h.planned_date, h.created_at::date) DESC`,
    params
  );
  return result.rows;
}

export async function getHarvestById(id, customerId = null, userRole = "ADMIN") {
  const result = await query(
    `SELECT h.*,
            t.code AS tray_code,
            t.mushroom_variety,
            r.name AS room_name,
            u.full_name AS recorded_by_name,
            rent.customer_id
     FROM harvests h
     LEFT JOIN trays t ON t.id = h.tray_id
     LEFT JOIN rooms r ON r.id = t.room_id
     LEFT JOIN users u ON u.id = h.recorded_by
     LEFT JOIN rentals rent ON (rent.tray_id = t.id OR rent.id IN (SELECT rental_id FROM rental_trays WHERE tray_id = t.id))
     WHERE h.id = $1`,
    [id]
  );

  const harvest = result.rows[0];
  if (!harvest) {
    throw new AppError("Bản ghi thu hoạch không tồn tại", 404);
  }

  if (userRole === "CUSTOMER" && harvest.customer_id !== customerId) {
    throw new AppError("Bạn không có quyền truy cập bản ghi thu hoạch này", 403);
  }

  return harvest;
}

export async function createHarvestPlan({ tray_id, planned_date, notes }, userId) {
  const trayRes = await query("SELECT id, code, status FROM trays WHERE id = $1", [tray_id]);
  if (!trayRes.rows[0]) {
    throw new AppError("Khay trồng không tồn tại", 404);
  }

  const result = await query(
    `INSERT INTO harvests (tray_id, planned_date, status, notes, recorded_by)
     VALUES ($1, $2, 'PLANNED', $3, $4)
     RETURNING *`,
    [tray_id, planned_date || null, notes?.trim() || null, userId || null]
  );
  return result.rows[0];
}

export async function recordHarvest(id, { quantity_kg, quality_grade = "STANDARD", harvest_date, notes }, userId) {
  const harvest = await getHarvestById(id);

  const qty = parseFloat(quantity_kg);
  if (isNaN(qty) || qty <= 0) {
    throw new AppError("Sản lượng thu hoạch (kg) phải lớn hơn 0", 400);
  }

  return withTransaction(async (client) => {
    // 1. Update harvest record
    const updatedHarvest = await client.query(
      `UPDATE harvests
       SET quantity_kg = $1, quality_grade = $2,
           harvest_date = COALESCE($3, CURRENT_DATE),
           status = 'COMPLETED', notes = COALESCE($4, notes),
           recorded_by = $5
       WHERE id = $6
       RETURNING *`,
      [qty, quality_grade, harvest_date || null, notes?.trim() || null, userId || null, id]
    );

    // 2. Transition tray to HARVESTED stage and log
    if (harvest.tray_id) {
      await client.query(
        `UPDATE trays SET growth_stage = 'HARVESTED', updated_at = NOW() WHERE id = $1`,
        [harvest.tray_id]
      );

      await client.query(
        `INSERT INTO growth_logs (tray_id, stage, notes, created_by)
         VALUES ($1, 'HARVESTED', $2, $3)`,
        [harvest.tray_id, `Thu hoạch hoàn tất: ${qty} kg (chất lượng: ${quality_grade})`, userId || null]
      );
    }

    return updatedHarvest.rows[0];
  });
}
