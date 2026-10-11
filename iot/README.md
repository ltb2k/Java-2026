# IoT
ESP32 publishes temperature, humidity and CO2 to:
POST /api/sensors/ingest

Replace the WiFi credentials, API address and `DEVICE_API_KEY` on the device. The key must match the backend device key or `IOT_INGEST_KEY` and must be sent in `x-device-key`; never commit a real key.
The current sketch uses HTTP for a local LAN demo. Use HTTPS or a secured gateway before deployment outside a trusted network.
Use real CO2 sensor code before deployment.
