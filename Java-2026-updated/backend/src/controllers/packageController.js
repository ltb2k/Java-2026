const pool=require('../config/db');
exports.list=async(req,res)=>{try{const r=await pool.query('SELECT * FROM rental_packages ORDER BY duration_days');res.json(r.rows);}catch(e){res.status(500).json({message:e.message});}};
