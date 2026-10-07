# ESP32 IoT

This folder is a starter firmware package.

Target flow:

ESP32 -> Wi-Fi -> POST http://<PC-IP>:5000/api/sensors

JSON example:

```json
{
  "tray_id": 1,
  "sensor_type": "TEMPERATURE",
  "value": 25.8
}
```

The backend endpoint requires a JWT token in the current secure version.
For real ESP32 deployment, use a device-token or MQTT credential instead of putting an administrator password in firmware.
