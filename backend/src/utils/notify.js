const pool = require("../config/db");

async function notifyUsers(userIds, title, message, type = "INFO") {
  const ids = [...new Set((userIds || []).filter(Boolean))];
  for (const userId of ids) {
    await pool.query(
      "INSERT INTO notifications(user_id,title,message,type) VALUES($1,$2,$3,$4)",
      [userId, title, message, type]
    );
  }
}

async function staffIds() {
  const r = await pool.query(`
    SELECT u.id FROM users u JOIN roles r ON r.id=u.role_id
    WHERE r.name IN ('ADMIN','FARM_OPERATOR') AND u.is_active=true`);
  return r.rows.map((x) => x.id);
}

async function customerIdsForRoom(roomId) {
  const r = await pool.query(`
    SELECT DISTINCT rent.customer_id
    FROM rentals rent
    JOIN cultivation_trays t ON t.id=rent.tray_id
    WHERE rent.status='ACTIVE' AND t.room_id=$1`, [roomId]);
  return r.rows.map((x) => x.customer_id);
}

async function notifyStaffAndRoomCustomers(roomId, title, message, type) {
  const ids = [...await staffIds(), ...await customerIdsForRoom(roomId)];
  await notifyUsers(ids, title, message, type);
}

module.exports = { notifyUsers, staffIds, customerIdsForRoom, notifyStaffAndRoomCustomers };
