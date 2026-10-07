const router=require("express").Router();
const {auth,roles}=require("./middleware/auth");
const authC=require("./controllers/authController");
const dash=require("./controllers/dashboardController");
const trays=require("./controllers/trayController");
const rooms=require("./controllers/roomController");
const sensors=require("./controllers/sensorController");
const noti=require("./controllers/notificationController");
const harvest=require("./controllers/harvestController");
const devices=require("./controllers/deviceController");
const cameras=require("./controllers/cameraController");
const progress=require("./controllers/progressController");
const packages=require("./controllers/packageController");
const users=require("./controllers/userController");

router.post("/auth/login",authC.login);
router.post("/auth/register",authC.register);
router.get("/auth/me",auth,authC.me);

router.get("/dashboard/summary",auth,dash.summary);
router.get("/rooms",auth,rooms.list);
router.post("/rooms",auth,roles("ADMIN","FARM_OPERATOR"),rooms.create);
router.patch("/rooms/:id",auth,roles("ADMIN","FARM_OPERATOR"),rooms.update);
router.delete("/rooms/:id",auth,roles("ADMIN"),rooms.remove);

router.get("/trays",auth,trays.list);
router.post("/trays",auth,roles("ADMIN","FARM_OPERATOR"),trays.create);
router.patch("/trays/:id",auth,roles("ADMIN","FARM_OPERATOR"),trays.update);
router.delete("/trays/:id",auth,roles("ADMIN"),trays.remove);

router.get("/sensors/latest",auth,sensors.latest);
router.get("/sensors/history",auth,sensors.history);
router.post("/sensors/ingest",sensors.ingest);
router.get("/devices",auth,devices.list);
router.patch("/devices/:id/toggle",auth,roles("ADMIN","FARM_OPERATOR"),devices.toggle);
router.get("/cameras",auth,cameras.list);
router.post("/cameras",auth,roles("ADMIN","FARM_OPERATOR"),cameras.create);
router.get("/progress",auth,progress.list);
router.post("/progress",auth,roles("ADMIN","FARM_OPERATOR"),progress.create);
router.get("/packages",auth,packages.list);
router.get("/users",auth,roles("ADMIN"),users.list);
router.patch("/users/:id",auth,roles("ADMIN"),users.update);

router.get("/notifications",auth,noti.list);
router.patch("/notifications/:id/read",auth,noti.read);

router.get("/harvests",auth,harvest.list);
router.post("/harvests",auth,roles("ADMIN","FARM_OPERATOR","CUSTOMER"),harvest.create);

module.exports=router;
