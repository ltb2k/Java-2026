import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import authRoutes from "./routes/auth.js";
import dashboardRoutes from "./routes/dashboard.js";
import sensorRoutes from "./routes/sensors.js";
import deviceRoutes from "./routes/devices.js";
import trayRoutes from "./routes/trays.js";
import alertRoutes from "./routes/alerts.js";

dotenv.config();

const app = express();
const port = Number(process.env.PORT || 5000);

app.use(cors({
  origin: process.env.CORS_ORIGIN?.split(",") || "*",
  credentials: false
}));
app.use(express.json());

app.get("/", (_req, res) => {
  res.json({
    name: "Mushroom IoT API",
    version: "2.0.0",
    status: "running"
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/dashboard", dashboardRoutes);
app.use("/api/sensors", sensorRoutes);
app.use("/api/devices", deviceRoutes);
app.use("/api/trays", trayRoutes);
app.use("/api/alerts", alertRoutes);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ message: "Internal server error" });
});

app.listen(port, () => {
  console.log(`API running on http://localhost:${port}`);
});
