const pool=require("../config/db");

exports.latest=async(req,res)=>{try{
 const r=await pool.query(`
 SELECT DISTINCT ON (s.sensor_type) s.sensor_type,s.unit,sr.value,sr.recorded_at,t.code tray_code
 FROM sensor_readings sr JOIN sensors s ON s.id=sr.sensor_id
 LEFT JOIN cultivation_trays t ON t.id=sr.tray_id
 ORDER BY s.sensor_type,sr.recorded_at DESC`);
 res.json(r.rows);
}catch(e){res.status(500).json({message:e.message});}};

exports.history=async(req,res)=>{try{
 const r=await pool.query(`
 SELECT s.sensor_type,s.unit,sr.value,sr.recorded_at,t.code tray_code
 FROM sensor_readings sr JOIN sensors s ON s.id=sr.sensor_id
 LEFT JOIN cultivation_trays t ON t.id=sr.tray_id
 WHERE sr.recorded_at >= NOW()-INTERVAL '24 hours'
 ORDER BY sr.recorded_at ASC`);
 res.json(r.rows);
}catch(e){res.status(500).json({message:e.message});}};

exports.ingest=async(req,res)=>{try{
 const {deviceCode,temperature,humidity,co2,trayCode}=req.body;
 const d=await pool.query("SELECT id FROM iot_devices WHERE device_code=$1",[deviceCode]);
 if(!d.rowCount)return res.status(404).json({message:"Unknown device"});
 const tray=trayCode ? await pool.query("SELECT id FROM cultivation_trays WHERE code=$1",[trayCode]) : {rowCount:0};
 const sensors=await pool.query("SELECT id,sensor_type FROM sensors WHERE device_id=$1",[d.rows[0].id]);
 const map={TEMPERATURE:temperature,HUMIDITY:humidity,CO2:co2};
 for(const s of sensors.rows){
   if(map[s.sensor_type]!==undefined && map[s.sensor_type]!==null)
     await pool.query("INSERT INTO sensor_readings(sensor_id,tray_id,value) VALUES($1,$2,$3)",
       [s.id,tray.rowCount?tray.rows[0].id:null,map[s.sensor_type]]);
 }
 await pool.query("UPDATE iot_devices SET status='ONLINE',last_seen=NOW() WHERE id=$1",[d.rows[0].id]);
 res.status(201).json({message:"Sensor data accepted"});
}catch(e){res.status(400).json({message:e.message});}};
