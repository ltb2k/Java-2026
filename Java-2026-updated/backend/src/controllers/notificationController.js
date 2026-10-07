const pool=require("../config/db");
exports.list=async(req,res)=>{try{
 const r=await pool.query("SELECT * FROM notifications WHERE user_id=$1 ORDER BY created_at DESC LIMIT 50",[req.user.id]);
 res.json(r.rows);
}catch(e){res.status(500).json({message:e.message});}};
exports.read=async(req,res)=>{try{
 const r=await pool.query("UPDATE notifications SET is_read=true WHERE id=$1 AND user_id=$2 RETURNING *",[req.params.id,req.user.id]);
 res.json(r.rows[0]||null);
}catch(e){res.status(500).json({message:e.message});}};
