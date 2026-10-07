const pool=require("../config/db");
exports.list=async(req,res)=>{try{
 const r=await pool.query("SELECT * FROM cultivation_rooms ORDER BY created_at DESC"); res.json(r.rows);
}catch(e){res.status(500).json({message:e.message});}};
exports.create=async(req,res)=>{try{
 const {name,code,location}=req.body;
 const r=await pool.query("INSERT INTO cultivation_rooms(name,code,location) VALUES($1,$2,$3) RETURNING *",[name,code,location||null]);
 res.status(201).json(r.rows[0]);
}catch(e){res.status(400).json({message:e.message});}};

exports.update=async(req,res)=>{try{const {name,code,location,status}=req.body;const r=await pool.query(`UPDATE cultivation_rooms SET name=COALESCE($1,name),code=COALESCE($2,code),location=COALESCE($3,location),status=COALESCE($4,status) WHERE id=$5 RETURNING *`,[name,code,location,status,req.params.id]);if(!r.rowCount)return res.status(404).json({message:"Room not found"});res.json(r.rows[0]);}catch(e){res.status(400).json({message:e.message});}};
exports.remove=async(req,res)=>{try{const r=await pool.query("DELETE FROM cultivation_rooms WHERE id=$1 RETURNING id",[req.params.id]);if(!r.rowCount)return res.status(404).json({message:"Room not found"});res.json({message:"Đã xóa phòng"});}catch(e){res.status(400).json({message:e.message});}};
