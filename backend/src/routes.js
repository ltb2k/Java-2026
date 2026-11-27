const router = require("express").Router();
const { auth, roles } = require("./middleware/auth");
const staff = roles("ADMIN", "FARM_OPERATOR");
const admin = roles("ADMIN");

const authC = require("./controllers/authController");
const users = require("./controllers/userController");
const dash = require("./controllers/dashboardController");
const trays = require("./controllers/trayController");
const rooms = require("./controllers/roomController");
const sensors = require("./controllers/sensorController");
const noti = require("./controllers/notificationController");
const harvest = require("./controllers/harvestController");
const devices = require("./controllers/deviceController");
const cameras = require("./controllers/cameraController");
const progress = require("./controllers/progressController");
const packages = require("./controllers/packageController");
const rentals = require("./controllers/rentalController");
const thresholds = require("./controllers/thresholdController");
const reports = require("./controllers/reportController");
const external = require("./controllers/externalController");

router.post("/auth/login", authC.login);
router.post("/auth/register", authC.register);
router.get("/auth/me", auth, authC.me);
router.patch("/auth/me", auth, authC.updateMe);

router.get("/users", auth, staff, users.list);
router.post("/users", auth, admin, users.create);
router.patch("/users/:id", auth, admin, users.update);
router.delete("/users/:id", auth, admin, users.remove);

router.get("/dashboard/summary", auth, dash.summary);
router.get("/external/weather/current", auth, external.currentWeather);
router.get("/external/weather/history", auth, external.weatherHistory);
router.get("/reference/media", auth, external.referenceMedia);
router.get("/reference/cultivation-guides", auth, external.cultivationGuides);

router.get("/rooms", auth, rooms.list);
router.post("/rooms", auth, staff, rooms.create);
router.patch("/rooms/:id", auth, staff, rooms.update);
router.delete("/rooms/:id", auth, staff, rooms.remove);

router.get("/trays", auth, trays.list);
router.get("/trays/:id", auth, trays.get);
router.post("/trays", auth, staff, trays.create);
router.patch("/trays/:id", auth, staff, trays.update);
router.delete("/trays/:id", auth, staff, trays.remove);
router.post("/trays/register", auth, roles("CUSTOMER", "ADMIN", "FARM_OPERATOR"), trays.registerCode);

router.get("/packages", auth, packages.list);
router.post("/packages", auth, admin, packages.create);
router.patch("/packages/:id", auth, admin, packages.update);
router.delete("/packages/:id", auth, admin, packages.remove);

router.get("/rentals", auth, rentals.list);
router.post("/rentals", auth, rentals.create);
router.patch("/rentals/:id", auth, staff, rentals.update);
router.get("/transactions", auth, rentals.transactions);

router.get("/devices", auth, staff, devices.list);
router.post("/devices", auth, staff, devices.create);
router.patch("/devices/:id", auth, staff, devices.update);
router.patch("/devices/:id/toggle", auth, staff, devices.toggle);
router.delete("/devices/:id", auth, staff, devices.remove);
router.get("/devices/commands", devices.commands);

router.get("/cameras", auth, cameras.list);
router.post("/cameras", auth, staff, cameras.create);
router.patch("/cameras/:id", auth, staff, cameras.update);
router.delete("/cameras/:id", auth, staff, cameras.remove);

router.get("/progress", auth, progress.list);
router.post("/progress", auth, staff, progress.create);

router.get("/sensors/latest", auth, sensors.latest);
router.get("/sensors/history", auth, sensors.history);
router.post("/sensors/ingest", sensors.ingest);

router.get("/notifications", auth, noti.list);
router.patch("/notifications/read-all", auth, noti.readAll);
router.patch("/notifications/:id/read", auth, noti.read);

router.get("/harvests", auth, harvest.list);
router.post("/harvests", auth, harvest.create);
router.patch("/harvests/:id", auth, staff, harvest.update);
router.post("/harvests/request", auth, harvest.requestCollection);

router.get("/thresholds", auth, staff, thresholds.list);
router.put("/thresholds", auth, admin, thresholds.upsert);

router.get("/reports/summary", auth, staff, reports.summary);
router.get("/reports/export", auth, admin, reports.exportCsv);

module.exports = router;
