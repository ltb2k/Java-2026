# Architecture

```text
             +--------------------+
             | React Web Admin    |
             | localhost:5173     |
             +---------+----------+
                       |
                       | REST + JWT
                       v
             +--------------------+
             | Express API       |
             | localhost:5000    |
             +---------+----------+
                       |
                       | SQL
                       v
             +--------------------+
             | PostgreSQL        |
             | localhost:5432    |
             +--------------------+

ESP32 sensors -> REST sensor endpoint -> PostgreSQL
Flutter customer app -> REST API -> PostgreSQL
Camera -> RTSP/HLS gateway -> Web/Mobile
```
