const express=require("express");
const cors=require("cors");
require("dotenv").config();
const routes=require("./routes");
const pool=require("./config/db");

const app=express();
const allowedOrigins=(process.env.CORS_ORIGIN||"*").split(",").map(origin=>origin.trim()).filter(Boolean);
app.use(cors({origin:(origin,callback)=>{
  if(!origin || allowedOrigins.includes("*") || allowedOrigins.includes(origin)) return callback(null,true);
  return callback(new Error("Origin not allowed by CORS"));
}}));
app.use(express.json({limit:"1mb"}));

app.get("/",(req,res)=>res.json({name:"Mushroom IoT API",version:"1.0.0",status:"running"}));
app.get("/api/health",async(req,res)=>{
 try{await pool.query("SELECT 1");res.json({status:"OK",database:"connected"});}
 catch(e){res.status(503).json({status:"ERROR",database:"disconnected"});}
});
app.use("/api",routes);
app.use((err,req,res,next)=>{console.error(err);res.status(500).json({message:"Internal server error"});});

const port=process.env.PORT||5000;
app.listen(port,()=>console.log(`API running on http://localhost:${port}`));
