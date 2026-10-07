const pool=require("../config/db");
exports.summary=async(req,res)=>{
  try{
    const [rooms,trays,customers,devices,readings,latest] = await Promise.all([
      pool.query("SELECT COUNT(*)::int count FROM cultivation_rooms"),
      pool.query("SELECT COUNT(*)::int count FROM cultivation_trays"),
      pool.query("SELECT COUNT(*)::int count FROM users u JOIN roles r ON r.id=u.role_id WHERE r.name='CUSTOMER'"),
      pool.query("SELECT COUNT(*)::int count FROM iot_devices WHERE status='ONLINE'"),
      pool.query(`SELECT
        COALESCE(AVG(CASE WHEN s.sensor_type='TEMPERATURE' THEN sr.value END),25.8) temperature,
        COALESCE(AVG(CASE WHEN s.sensor_type='HUMIDITY' THEN sr.value END),89.2) humidity,
        COALESCE(AVG(CASE WHEN s.sensor_type='CO2' THEN sr.value END),640) co2
        FROM sensor_readings sr JOIN sensors s ON s.id=sr.sensor_id
        WHERE sr.recorded_at > NOW()-INTERVAL '24 hours'`),
      pool.query(`SELECT s.sensor_type,sr.value,sr.recorded_at
        FROM sensor_readings sr JOIN sensors s ON s.id=sr.sensor_id
        ORDER BY sr.recorded_at DESC LIMIT 30`)
    ]);
    res.json({
      counts:{rooms:rooms.rows[0].count,trays:trays.rows[0].count,customers:customers.rows[0].count,onlineDevices:devices.rows[0].count},
      current:readings.rows[0],latest:latest.rows
    });
  }catch(e){res.status(500).json({message:e.message});}
};
