const pool=require("../config/db");
exports.list=async(req,res)=>{try{
 const r=await pool.query(`SELECT t.*,r.name room_name FROM cultivation_trays t LEFT JOIN cultivation_rooms r ON r.id=t.room_id ORDER BY t.created_at DESC`);
 res.json(r.rows);
}catch(e){res.status(500).json({message:e.message});}};

exports.create=async(req,res)=>{try{
 const {roomId,code,mushroomType,rack,status,growthDay,expectedHarvestDate}=req.body;
 const r=await pool.query(`INSERT INTO cultivation_trays(room_id,code,mushroom_type,rack,status,growth_day,expected_harvest_date)
 VALUES($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
 [roomId||null,code,mushroomType,rack||null,status||"AVAILABLE",growthDay||0,expectedHarvestDate||null]);
 res.status(201).json(r.rows[0]);
}catch(e){res.status(400).json({message:e.message});}};

exports.update=async(req,res)=>{try{
 const {id}=req.params; const {status,growthDay,expectedHarvestDate,roomId}=req.body;
 const r=await pool.query(`UPDATE cultivation_trays SET status=COALESCE($1,status),growth_day=COALESCE($2,growth_day),
 expected_harvest_date=COALESCE($3,expected_harvest_date),room_id=COALESCE($4,room_id) WHERE id=$5 RETURNING *`,
 [status,growthDay,expectedHarvestDate,roomId,id]);
 if(!r.rowCount)return res.status(404).json({message:"Tray not found"});
 res.json(r.rows[0]);
}catch(e){res.status(400).json({message:e.message});}};
