import { query } from "../db.js";
import { AppError } from "../middleware/errorHandler.js";

export async function listPackages({ activeOnly = false } = {}) {
  const where = activeOnly ? "WHERE status = 'ACTIVE'" : "";
  const result = await query(
    `SELECT * FROM rental_packages ${where} ORDER BY price ASC`
  );
  return result.rows;
}

export async function getPackageById(id) {
  const result = await query(
    "SELECT * FROM rental_packages WHERE id = $1",
    [id]
  );
  if (!result.rows[0]) {
    throw new AppError("Gói thuê không tồn tại", 404);
  }
  return result.rows[0];
}

export async function createPackage({ name, duration_days, price, description, status = "ACTIVE" }) {
  const result = await query(
    `INSERT INTO rental_packages (name, duration_days, price, description, status)
     VALUES ($1, $2, $3, $4, $5)
     RETURNING *`,
    [name.trim(), parseInt(duration_days, 10), parseFloat(price || 0), description?.trim() || null, status]
  );
  return result.rows[0];
}

export async function updatePackage(id, { name, duration_days, price, description, status }) {
  const current = await getPackageById(id);
  const result = await query(
    `UPDATE rental_packages
     SET name = $1, duration_days = $2, price = $3, description = $4, status = $5
     WHERE id = $6
     RETURNING *`,
    [
      name !== undefined ? name.trim() : current.name,
      duration_days !== undefined ? parseInt(duration_days, 10) : current.duration_days,
      price !== undefined ? parseFloat(price) : current.price,
      description !== undefined ? description?.trim() : current.description,
      status !== undefined ? status : current.status,
      id,
    ]
  );
  return result.rows[0];
}

export async function deletePackage(id) {
  await getPackageById(id);

  // Check if used in active rentals or trays
  const checkRentals = await query(
    "SELECT COUNT(*) AS count FROM rentals WHERE package_id = $1 AND status IN ('PENDING', 'APPROVED', 'ASSIGNED', 'ACTIVE')",
    [id]
  );

  if (parseInt(checkRentals.rows[0].count, 10) > 0) {
    // Soft disable instead of delete
    await query("UPDATE rental_packages SET status = 'INACTIVE' WHERE id = $1", [id]);
    return {
      message: "Gói thuê đang được sử dụng bởi các hợp đồng thuê, đã chuyển sang trạng thái Ngưng hoạt động (INACTIVE).",
      deactivated: true,
    };
  }

  await query("DELETE FROM rental_packages WHERE id = $1", [id]);
  return { message: "Xóa gói thuê thành công", deactivated: false };
}
