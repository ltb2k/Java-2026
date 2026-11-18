import crypto from "crypto";
import { query, withTransaction } from "../db.js";
import { AppError } from "../middleware/errorHandler.js";

/**
 * Generate a random, human-friendly 8-character alphanumeric link code
 */
function generateLinkCode() {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  const bytes = crypto.randomBytes(8);
  for (let i = 0; i < 8; i++) {
    code += chars[bytes[i] % chars.length];
  }
  return code;
}

export async function requestRental(customerId, { package_id, quantity = 1, notes = "" }) {
  const qty = parseInt(quantity, 10);
  if (isNaN(qty) || qty < 1 || qty > 5) {
    throw new AppError("Số lượng khay thuê phải từ 1 đến 5 khay", 400);
  }

  // Verify customer
  const userRes = await query("SELECT id, status, is_active FROM users WHERE id = $1", [customerId]);
  const user = userRes.rows[0];
  if (!user || !user.is_active || user.status === "DISABLED") {
    throw new AppError("Tài khoản không đủ điều kiện thuê khay", 403);
  }

  // Verify package
  const pkgRes = await query("SELECT id, name, status, duration_days FROM rental_packages WHERE id = $1", [package_id]);
  const pkg = pkgRes.rows[0];
  if (!pkg || pkg.status !== "ACTIVE") {
    throw new AppError("Gói thuê đã chọn không tồn tại hoặc đã ngưng hoạt động", 400);
  }

  const result = await query(
    `INSERT INTO rentals (customer_id, package_id, quantity, status, notes)
     VALUES ($1, $2, $3, 'PENDING', $4)
     RETURNING *`,
    [customerId, package_id, qty, notes?.trim() || null]
  );

  return result.rows[0];
}

export async function listRentals({ customerId, status, userRole } = {}) {
  let whereConditions = [];
  let params = [];

  if (userRole === "CUSTOMER") {
    params.push(customerId);
    whereConditions.push(`r.customer_id = $${params.length}`);
  }

  if (status) {
    params.push(status);
    whereConditions.push(`r.status = $${params.length}`);
  }

  const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(" AND ")}` : "";

  const result = await query(
    `SELECT r.*,
            u.full_name AS customer_name,
            u.email AS customer_email,
            rp.name AS package_name,
            rp.duration_days,
            rp.price AS package_price,
            staff.full_name AS approved_by_name,
            COALESCE(
              json_agg(
                DISTINCT jsonb_build_object('id', t.id, 'code', t.code, 'room_id', t.room_id, 'status', t.status)
              ) FILTER (WHERE t.id IS NOT NULL),
              '[]'
            ) AS trays,
            lc.code AS active_link_code,
            lc.expires_at AS link_code_expires_at
     FROM rentals r
     JOIN users u ON u.id = r.customer_id
     LEFT JOIN rental_packages rp ON rp.id = r.package_id
     LEFT JOIN users staff ON staff.id = r.approved_by
     LEFT JOIN rental_trays rt ON rt.rental_id = r.id
     LEFT JOIN trays t ON (t.id = rt.tray_id OR t.id = r.tray_id)
     LEFT JOIN link_codes lc ON lc.rental_id = r.id AND lc.used_at IS NULL AND lc.expires_at > NOW()
     ${whereClause}
     GROUP BY r.id, u.id, rp.id, staff.id, lc.id
     ORDER BY r.id DESC`,
    params
  );
  return result.rows;
}

export async function getRentalById(id, customerId = null, userRole = "ADMIN") {
  const result = await query(
    `SELECT r.*,
            u.full_name AS customer_name,
            u.email AS customer_email,
            rp.name AS package_name,
            rp.duration_days,
            rp.price AS package_price,
            staff.full_name AS approved_by_name,
            COALESCE(
              json_agg(
                DISTINCT jsonb_build_object('id', t.id, 'code', t.code, 'room_id', t.room_id, 'status', t.status, 'growth_stage', t.growth_stage)
              ) FILTER (WHERE t.id IS NOT NULL),
              '[]'
            ) AS trays,
            lc.code AS active_link_code,
            lc.expires_at AS link_code_expires_at,
            lc.used_at AS link_code_used_at
     FROM rentals r
     JOIN users u ON u.id = r.customer_id
     LEFT JOIN rental_packages rp ON rp.id = r.package_id
     LEFT JOIN users staff ON staff.id = r.approved_by
     LEFT JOIN rental_trays rt ON rt.rental_id = r.id
     LEFT JOIN trays t ON (t.id = rt.tray_id OR t.id = r.tray_id)
     LEFT JOIN link_codes lc ON lc.rental_id = r.id
     WHERE r.id = $1
     GROUP BY r.id, u.id, rp.id, staff.id, lc.id
     ORDER BY lc.created_at DESC
     LIMIT 1`,
    [id]
  );

  const rental = result.rows[0];
  if (!rental) {
    throw new AppError("Yêu cầu thuê không tồn tại", 404);
  }

  if (userRole === "CUSTOMER" && rental.customer_id !== customerId) {
    throw new AppError("Bạn không có quyền truy cập yêu cầu thuê này", 403);
  }

  return rental;
}

export async function approveRental(rentalId, staffId) {
  const rental = await getRentalById(rentalId);
  if (rental.status !== "PENDING") {
    throw new AppError(`Chỉ có thể duyệt yêu cầu ở trạng thái PENDING. Trạng thái hiện tại: ${rental.status}`, 400);
  }

  const result = await query(
    `UPDATE rentals
     SET status = 'APPROVED', approved_by = $1, approved_at = NOW(), updated_at = NOW()
     WHERE id = $2
     RETURNING *`,
    [staffId, rentalId]
  );
  return result.rows[0];
}

export async function rejectRental(rentalId, staffId, { reason }) {
  const rental = await getRentalById(rentalId);
  if (rental.status !== "PENDING") {
    throw new AppError(`Chỉ có thể từ chối yêu cầu ở trạng thái PENDING. Trạng thái hiện tại: ${rental.status}`, 400);
  }

  const result = await query(
    `UPDATE rentals
     SET status = 'REJECTED', approved_by = $1, approved_at = NOW(), rejection_reason = $2, updated_at = NOW()
     WHERE id = $3
     RETURNING *`,
    [staffId, reason?.trim() || "Yêu cầu bị từ chối bởi người vận hành", rentalId]
  );
  return result.rows[0];
}

export async function assignTrays(rentalId, staffId, { tray_ids }) {
  if (!Array.isArray(tray_ids) || tray_ids.length === 0) {
    throw new AppError("Vui lòng cung cấp danh sách ID khay trồng cần gán", 400);
  }

  const rental = await getRentalById(rentalId);
  if (rental.status !== "APPROVED" && rental.status !== "PENDING") {
    throw new AppError(`Không thể gán khay cho yêu cầu ở trạng thái ${rental.status}`, 400);
  }

  return withTransaction(async (client) => {
    // 1. Verify trays availability
    const traysRes = await client.query(
      `SELECT id, code, status, is_archived FROM trays WHERE id = ANY($1::int[]) FOR UPDATE`,
      [tray_ids]
    );

    if (traysRes.rows.length !== tray_ids.length) {
      throw new AppError("Một hoặc nhiều khay không tồn tại", 400);
    }

    for (const tray of traysRes.rows) {
      if (tray.is_archived || tray.status !== "AVAILABLE") {
        throw new AppError(`Khay ${tray.code} không ở trạng thái sẵn sàng (AVAILABLE) để gán`, 400);
      }
    }

    // 2. Update trays status to ASSIGNED
    await client.query(
      `UPDATE trays SET status = 'ASSIGNED', updated_at = NOW() WHERE id = ANY($1::int[])`,
      [tray_ids]
    );

    // 3. Link trays in rental_trays
    for (const trayId of tray_ids) {
      await client.query(
        `INSERT INTO rental_trays (rental_id, tray_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [rentalId, trayId]
      );
    }

    // 4. Update rental
    const primaryTrayId = tray_ids[0];
    const updatedRental = await client.query(
      `UPDATE rentals
       SET status = 'ASSIGNED', tray_id = $1, approved_by = COALESCE(approved_by, $2), approved_at = COALESCE(approved_at, NOW()), updated_at = NOW()
       WHERE id = $3
       RETURNING *`,
      [primaryTrayId, staffId, rentalId]
    );

    // 5. Generate single-use link code (valid 24h)
    const code = generateLinkCode();
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    const linkRes = await client.query(
      `INSERT INTO link_codes (rental_id, code, expires_at)
       VALUES ($1, $2, $3)
       RETURNING code, expires_at`,
      [rentalId, code, expiresAt]
    );

    return {
      rental: updatedRental.rows[0],
      link_code: linkRes.rows[0].code,
      expires_at: linkRes.rows[0].expires_at,
    };
  });
}

export async function linkWithCode(customerId, { code }) {
  if (!code || typeof code !== "string") {
    throw new AppError("Vui lòng nhập mã liên kết hợp lệ", 400);
  }

  const cleanCode = code.toUpperCase().trim();

  return withTransaction(async (client) => {
    // 1. Find link code with lock
    const codeRes = await client.query(
      `SELECT lc.*, r.customer_id, r.package_id, r.status AS rental_status, rp.duration_days
       FROM link_codes lc
       JOIN rentals r ON r.id = lc.rental_id
       LEFT JOIN rental_packages rp ON rp.id = r.package_id
       WHERE lc.code = $1
       FOR UPDATE`,
      [cleanCode]
    );

    const linkRecord = codeRes.rows[0];
    if (!linkRecord) {
      throw new AppError("Mã liên kết không tồn tại", 404);
    }

    if (linkRecord.used_at) {
      throw new AppError("Mã liên kết này đã được sử dụng trước đó", 400);
    }

    if (new Date(linkRecord.expires_at) < new Date()) {
      throw new AppError("Mã liên kết đã hết hạn (chỉ có hiệu lực trong vòng 24 giờ kể từ khi cấp)", 400);
    }

    // 2. Validate customer ownership
    if (linkRecord.customer_id !== customerId) {
      throw new AppError("Mã liên kết này không thuộc về tài khoản của bạn", 403);
    }

    if (linkRecord.rental_status !== "ASSIGNED") {
      throw new AppError(`Hợp đồng thuê không ở trạng thái chờ liên kết (ASSIGNED). Trạng thái hiện tại: ${linkRecord.rental_status}`, 400);
    }

    // 3. Mark link code as used
    await client.query(
      `UPDATE link_codes SET used_at = NOW() WHERE id = $1`,
      [linkRecord.id]
    );

    // 4. Calculate lease duration
    const durationDays = linkRecord.duration_days || 30;
    const endDate = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000);

    // 5. Activate rental
    const activatedRental = await client.query(
      `UPDATE rentals
       SET status = 'ACTIVE', start_date = CURRENT_DATE, end_date = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [endDate.toISOString().split("T")[0], linkRecord.rental_id]
    );

    // 6. Update trays to RENTED
    await client.query(
      `UPDATE trays
       SET status = 'RENTED', updated_at = NOW()
       WHERE id IN (
         SELECT tray_id FROM rental_trays WHERE rental_id = $1
         UNION
         SELECT tray_id FROM rentals WHERE id = $1 AND tray_id IS NOT NULL
       )`,
      [linkRecord.rental_id]
    );

    return activatedRental.rows[0];
  });
}

export async function cancelRental(rentalId, userId, userRole, { reason } = {}) {
  const rental = await getRentalById(rentalId);

  if (userRole === "CUSTOMER") {
    if (rental.customer_id !== userId) {
      throw new AppError("Bạn không có quyền hủy yêu cầu này", 403);
    }
    if (rental.status !== "PENDING") {
      throw new AppError("Khách hàng chỉ có thể hủy yêu cầu khi đang ở trạng thái PENDING", 400);
    }
  }

  return withTransaction(async (client) => {
    // Release assigned or rented trays if any
    await client.query(
      `UPDATE trays
       SET status = 'AVAILABLE', updated_at = NOW()
       WHERE id IN (
         SELECT tray_id FROM rental_trays WHERE rental_id = $1
         UNION
         SELECT tray_id FROM rentals WHERE id = $1 AND tray_id IS NOT NULL
       )`,
      [rentalId]
    );

    const result = await client.query(
      `UPDATE rentals
       SET status = 'CANCELLED', rejection_reason = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING *`,
      [reason?.trim() || "Đã hủy theo yêu cầu", rentalId]
    );

    return result.rows[0];
  });
}
