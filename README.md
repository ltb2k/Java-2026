# Java-2026 — Smart Mushroom Cultivation Management System

Full starter implementation for the Smart Mushroom Cultivation Management System.

## Stack
- Backend: Node.js + Express + PostgreSQL + JWT
- Web Admin: React + Vite + Recharts
- Mobile: Flutter starter
- IoT: ESP32 Arduino starter
- API: RESTful

## Features implemented
- JWT authentication and role-based access
- Users, cultivation rooms, trays
- Rental packages and rentals
- IoT devices, sensors and sensor readings
- Dashboard statistics
- Camera records
- Cultivation progress
- Harvest records
- Notifications
- Environment thresholds
- REST API
- PostgreSQL schema and seed data
- React admin dashboard connected to API
- ESP32 sensor publishing example
- Flutter API client starter

## Run
### 1. Database
Install PostgreSQL and create a database named `mushroom_iot`.

Run:
`database/schema.sql`
then:
`database/seed.sql`

Or use Docker:
`docker compose up -d postgres`

### 2. Backend
```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

Default API: http://localhost:5000

### 3. Web admin
```bash
cd web-admin
npm install
npm run dev
```

Default web: http://localhost:5173

### Demo login
Email: admin@mushroom.local
Password: Admin@123

## Notes
This is a complete development baseline, not a production deployment. Change JWT secrets and database credentials before deployment.
