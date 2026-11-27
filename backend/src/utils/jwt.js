const jwt=require("jsonwebtoken");
exports.signUser=(user)=>jwt.sign(
  {id:user.id,email:user.email,role:user.role},
  process.env.JWT_SECRET,{expiresIn:"7d"}
);
