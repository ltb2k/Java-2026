const jwt = require("jsonwebtoken");

function auth(req,res,next){
  const header=req.headers.authorization||"";
  const token=header.startsWith("Bearer ") ? header.slice(7) : null;
  if(!token) return res.status(401).json({message:"Authentication required"});
  try { req.user=jwt.verify(token,process.env.JWT_SECRET); next(); }
  catch(e){ return res.status(401).json({message:"Invalid or expired token"}); }
}
function roles(...allowed){
  return (req,res,next)=>{
    if(!req.user || !allowed.includes(req.user.role)) return res.status(403).json({message:"Forbidden"});
    next();
  };
}
module.exports={auth,roles};
