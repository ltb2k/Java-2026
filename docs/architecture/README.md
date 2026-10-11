# Architecture
Mobile/Web clients -> REST API (Express) -> PostgreSQL.
ESP32 sensors -> REST API -> sensor_readings -> Web dashboard.
Camera stream is represented by camera records; a real RTSP/WebRTC/HLS gateway must be deployed for live video.

Open-Meteo/NASA POWER -> Express external-data adapter -> cached, labelled outdoor weather/history -> Web/Mobile.
Reference video/images -> Express metadata endpoint -> labelled reference media page. They are separate from physical cameras and sensor readings.
