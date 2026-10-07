# Architecture
Mobile/Web clients -> REST API (Express) -> PostgreSQL.
ESP32 sensors -> REST API -> sensor_readings -> Web dashboard.
Camera stream is represented by camera records; a real RTSP/WebRTC/HLS gateway must be deployed for live video.
