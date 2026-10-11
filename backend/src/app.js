require("dotenv").config();

function validateEnvironment() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
    throw new Error("JWT_SECRET must be configured with at least 32 characters.");
  }
  require("./config/db");
}

validateEnvironment();

const express = require("express");
const cors = require("cors");
const pool = require("./config/db");
const routes = require("./routes");
const { verifySchema } = require("./dbMigrate");

const app = express();
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173,http://127.0.0.1:5173")
  .split(",").map((origin) => origin.trim()).filter(Boolean);

app.use(cors({
  origin(origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true);
    return callback(new Error("CORS_ORIGIN_DENIED"));
  }
}));
app.use(express.json({ limit: "1mb" }));

app.get("/", (req, res) => res.json({ name: "Mushroom IoT API", version: "1.1.0", status: "running" }));
app.get("/api/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    return res.json({ status: "OK", database: "connected" });
  } catch {
    return res.status(503).json({ status: "ERROR", database: "disconnected" });
  }
});
app.use("/api", routes);
app.use((req, res) => res.status(404).json({ message: "Route not found" }));
app.use((error, req, res, next) => {
  if (res.headersSent) return next(error);
  const status = error.type === "entity.parse.failed" ? 400
    : error.type === "entity.too.large" ? 413
      : error.message === "CORS_ORIGIN_DENIED" ? 403 : 500;
  if (status === 500) console.error("Unhandled request error", { code: error.code || "UNKNOWN" });
  const message = status === 400 ? "Invalid JSON body"
    : status === 413 ? "Request body is too large"
      : status === 403 ? "Origin not allowed" : "Internal server error";
  return res.status(status).json({ message });
});

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function waitForDatabase(attempts = 15) {
  for (let attempt = 0; attempt < attempts; attempt += 1) {
    try {
      await pool.query("SELECT 1");
      return;
    } catch {
      if (attempt === attempts - 1) throw new Error("PostgreSQL did not become ready in time.");
      await delay(2000);
    }
  }
}

async function start() {
  try {
    await waitForDatabase();
    await verifySchema();
    const port = Number(process.env.PORT || 5000);
    const server = app.listen(port, () => console.log(`API listening on port ${port}`));
    server.on("error", (error) => {
      console.error("API could not listen on the configured port", { code: error.code || "UNKNOWN" });
      process.exitCode = 1;
      pool.end().finally(() => process.exit());
    });
  } catch (error) {
    console.error("Backend startup failed. Check PostgreSQL availability and apply database/schema.sql before startup.");
    if (error.message.includes("missing required tables") || error.message.includes("Duplicate emails")) {
      console.error(error.message);
    }
    await pool.end().catch(() => {});
    process.exitCode = 1;
  }
}

if (require.main === module) start();

module.exports = { app, start, validateEnvironment };
