import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { createRequire } from "module";

dotenv.config();

// Routes
import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/users.js";
import roomRoutes from "./routes/rooms.js";
import packageRoutes from "./routes/packages.js";
import trayRoutes from "./routes/trays.js";
import rentalRoutes from "./routes/rentals.js";
import sensorRoutes from "./routes/sensors.js";
import deviceRoutes from "./routes/devices.js";
import alertRoutes from "./routes/alerts.js";
import harvestRoutes from "./routes/harvests.js";
import dashboardRoutes from "./routes/dashboard.js";

// Middleware
import { errorHandler } from "./middleware/errorHandler.js";

// Services
import { mqttService } from "./services/mqttService.js";
import swaggerUi from "swagger-ui-express";
import { swaggerSpec } from "./swagger.js";

// ── App Setup ────────────────────────────────────────────────────────────────
const app = express();
const port = Number(process.env.PORT || 5000);

// CORS
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(",").map((o) => o.trim())
  : ["http://localhost:5173", "http://localhost:3000"];

app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Request logger (dev) ─────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "test") {
  app.use((req, _res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });
}

// ── Health check ──────────────────────────────────────────────────────────────
app.get("/", (_req, res) => {
  res.json({
    name: "Mushroom IoT API",
    version: "2.0.0",
    status: "running",
    timestamp: new Date().toISOString(),
  });
});

app.get("/health", (_req, res) => {
  res.json({
    status: "ok",
    mqtt_connected: mqttService.connected,
    timestamp: new Date().toISOString(),
  });
});

// ── Swagger UI ────────────────────────────────────────────────────────────────
app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec, { customSiteTitle: "Mushroom IoT API" }));
app.get("/api/docs.json", (_req, res) => res.json(swaggerSpec));

// ── API Routes ────────────────────────────────────────────────────────────────
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/rooms", roomRoutes);
app.use("/api/packages", packageRoutes);
app.use("/api/trays", trayRoutes);
app.use("/api/rentals", rentalRoutes);
app.use("/api/sensors", sensorRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/alerts", alertRoutes);
app.use("/api/harvests", harvestRoutes);
app.use("/api/dashboard", dashboardRoutes);

// ── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).json({ message: `Endpoint ${req.method} ${req.url} không tồn tại` });
});

// ── Global error handler ──────────────────────────────────────────────────────
app.use(errorHandler);

// ── Start server ──────────────────────────────────────────────────────────────
if (process.env.NODE_ENV !== "test") {
  // Init MQTT client (non-blocking; Express runs even if broker offline)
  if (process.env.MQTT_BROKER_URL) {
    mqttService.init();
  } else {
    console.log("[MQTT] No MQTT_BROKER_URL configured — MQTT disabled");
  }

  app.listen(port, () => {
    console.log(`\n🍄  Mushroom IoT API v2.0.0`);
    console.log(`   Running on http://localhost:${port}`);
    console.log(`   MQTT: ${process.env.MQTT_BROKER_URL || "disabled"}`);
    console.log(`   ENV: ${process.env.NODE_ENV || "development"}\n`);
  });
}

export default app;
