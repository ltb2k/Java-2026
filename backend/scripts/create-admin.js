const bcrypt=require("bcryptjs");
const pool=require("../src/config/db");
(async()=>{
 try{
  const role=await pool.query("SELECT id FROM roles WHERE name='ADMIN'");
  const hash=await bcrypt.hash("Admin@123",10);
  await pool.query(`INSERT INTO users(full_name,email,password_hash,role_id)
    VALUES($1,$2,$3,$4) ON CONFLICT(email) DO UPDATE SET password_hash=EXCLUDED.password_hash`,
    ["System Administrator","admin@mushroom.local",hash,role.rows[0].id]);
  console.log("Admin ready: admin@mushroom.local / Admin@123");
 }finally{await pool.end();}
})();
