const pool=require("../config/db");
exports.list=async(req,res)=>{try{
 const r=await pool.query("SELECT * FROM cultivation_rooms ORDER BY created_at DESC"); res.json(r.rows);
}catch(e){res.status(500).json({message:e.message});}};
exports.create=async(req,res)=>{try{
 const {name,code,location}=req.body;
 const r=await pool.query("INSERT INTO cultivation_rooms(name,code,location) VALUES($1,$2,$3) RETURNING *",[name,code,location||null]);
 res.status(201).json(r.rows[0]);
}catch(e){res.status(400).json({message:e.message});}};
