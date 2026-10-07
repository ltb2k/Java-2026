const pool=require("../config/db");
exports.list=async(req,res)=>{try{
 const r=await pool.query(`SELECT h.*,t.code tray_code,t.mushroom_type
 FROM harvests h JOIN cultivation_trays t ON t.id=h.tray_id ORDER BY h.harvest_date DESC`);
 res.json(r.rows);
}catch(e){res.status(500).json({message:e.message});}};
exports.create=async(req,res)=>{try{
 const {trayId,quantityKg,harvestDate,deliveryRequested,note}=req.body;
 const r=await pool.query(`INSERT INTO harvests(tray_id,quantity_kg,harvest_date,delivery_requested,note)
 VALUES($1,$2,COALESCE($3,CURRENT_DATE),$4,$5) RETURNING *`,
 [trayId,quantityKg||null,harvestDate||null,!!deliveryRequested,note||null]);
 res.status(201).json(r.rows[0]);
}catch(e){res.status(400).json({message:e.message});}};
