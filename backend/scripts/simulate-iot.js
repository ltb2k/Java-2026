require("dotenv").config();

const url = process.env.API_URL || "http://localhost:5000/api/sensors/ingest";
const deviceCode = process.env.DEVICE_CODE || "ESP32-ROOM-01";
const trayCode = process.env.TRAY_CODE || "TRAY-A101";
const apiKey = process.env.IOT_INGEST_KEY || "demo-iot-key";

function jitter(base, span) {
  return +(base + (Math.random() * span * 2 - span)).toFixed(1);
}

async function tick() {
  const body = {
    deviceCode,
    trayCode,
    temperature: jitter(26, 3),
    humidity: jitter(90, 8),
    co2: Math.round(jitter(650, 180))
  };
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Device-Key": apiKey },
    body: JSON.stringify(body)
  });
  const data = await res.json().catch(() => ({}));
  console.log(new Date().toISOString(), res.status, body, data.message || data);
}

tick().catch((e) => {
  console.error(e.message);
  process.exit(1);
});

if (process.argv.includes("--loop")) {
  setInterval(() => tick().catch(console.error), 5000);
}
