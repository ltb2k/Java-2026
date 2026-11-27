# Mushroom IoT - Java-2026

Clean rebuild for the Smart Mushroom Cultivation Management System.

## Stack
- Backend: Node.js + ExpressJS + PostgreSQL + JWT
- Web Admin: ReactJS + Vite
- IoT: ESP32 sample firmware
- Database: PostgreSQL
- API: RESTful

## 1. Start PostgreSQL

From the project root:

```powershell
docker compose up -d
docker compose ps
```

PostgreSQL runs on `localhost:5432`.

If you changed the database files and want a completely fresh database:

```powershell
docker compose down -v
docker compose up -d
```

## 2. Start Backend

```powershell
cd backend
copy .env.example .env
npm install
npm run dev
```

Backend: http://localhost:5000

Health check: http://localhost:5000/

## 3. Create admin

In another terminal:

```powershell
cd backend
npm run create-admin
```

Default account:
- Email: admin@mushroom.local
- Password: Admin@123

## 4. Start Web Admin

```powershell
cd web-admin
npm install
npm run dev
```

Open the URL printed by Vite, normally:
http://localhost:5173

Login with the admin account above.

## 5. API
- POST `/api/auth/login`
- GET `/api/dashboard/summary`
- GET `/api/sensors/history`
- GET `/api/devices`
- POST `/api/devices/:id/toggle`
- GET `/api/trays`
- GET `/api/alerts`

## 6. Project structure

```text
java/
├─ backend/
├─ database/
├─ web-admin/
├─ mobile/
├─ iot/
├─ docs/
├─ docker-compose.yml
└─ README.md
```

This rebuild intentionally keeps backend, database, web, mobile and IoT as separate packages so the project can grow without mixing responsibilities.
