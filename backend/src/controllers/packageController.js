const pool = require("../config/db");

exports.list = async (req, res) => {
  try {
    const onlyActive = req.user.role === "CUSTOMER";
    const r = await pool.query(
      `SELECT * FROM rental_packages ${onlyActive ? "WHERE is_active=true" : ""} ORDER BY duration_days`);
    res.json(r.rows);
  } catch (e) { res.status(500).json({ message: e.message }); }
};

exports.create = async (req, res) => {
  try {
    const { name, durationDays, price, description, isActive } = req.body;
    const r = await pool.query(`
      INSERT INTO rental_packages(name,duration_days,price,description,is_active)
      VALUES($1,$2,$3,$4,$5) RETURNING *`,
      [name, durationDays, price, description || null, isActive !== false]);
    res.status(201).json(r.rows[0]);
  } catch (e) { res.status(400).json({ message: e.message }); }
};

exports.update = async (req, res) => {
  try {
    const { name, durationDays, price, description, isActive } = req.body;
    const r = await pool.query(`
      UPDATE rental_packages SET
        name=COALESCE($1,name), duration_days=COALESCE($2,duration_days),
        price=COALESCE($3,price), description=COALESCE($4,description),
        is_active=COALESCE($5,is_active)
      WHERE id=$6 RETURNING *`,
      [name || null, durationDays ?? null, price ?? null, description ?? null,
        typeof isActive === "boolean" ? isActive : null, req.params.id]);
    if (!r.rowCount) return res.status(404).json({ message: "Package not found" });
    res.json(r.rows[0]);
  } catch (e) { res.status(400).json({ message: e.message }); }
};

exports.remove = async (req, res) => {
  try {
    const r = await pool.query("DELETE FROM rental_packages WHERE id=$1 RETURNING id", [req.params.id]);
    if (!r.rowCount) return res.status(404).json({ message: "Package not found" });
    res.json({ deleted: true });
  } catch (e) { res.status(400).json({ message: e.message }); }
};
