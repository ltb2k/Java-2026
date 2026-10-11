# Java-2026 — Smart Mushroom Cultivation Management System

The supported development application is the project at this repository root. `java-rebuild/` is a separate, older rebuild with its own API and database schema; do not combine its files with the root project.

## Stack
- Backend: Node.js, Express, PostgreSQL, JWT
- Web admin: React and Vite
- Mobile: Flutter starter
- IoT: ESP32 starter

## Windows setup

1. Install Node.js 20.19+ or 22.12+, Docker Desktop, and Git if needed.
2. Start a PowerShell terminal in this repository. If `.env` does not already exist, copy `.env.example` to `.env` with `if (-not (Test-Path .env)) { Copy-Item .env.example .env }`. Edit `.env` locally and set a private `POSTGRES_PASSWORD` before starting Compose. Keep any existing `.env` intact.
3. Run `docker compose up -d postgres` and wait for `docker compose ps` to show PostgreSQL as healthy. On a newly created database volume, Compose applies `database/schema.sql` and then `database/seed.sql` automatically. Existing volumes are preserved; Docker does not rerun initialization scripts against them. If a volume already exists, keep `POSTGRES_PASSWORD` aligned with that database's existing credentials; changing the Compose variable alone does not reset a database password.
4. In a second PowerShell terminal, run:

   ```powershell
   cd backend
   npm ci
   if (-not (Test-Path .env)) { Copy-Item .env.example .env }
   ```

   Edit `backend/.env` locally. Set `DATABASE_URL` to the local PostgreSQL connection matching the Compose database name, user, and password, and set a private random `JWT_SECRET` of at least 32 characters. If using IoT ingestion, also set `IOT_INGEST_KEY` privately and configure devices to send it in the `x-device-key` header. Do not share or commit this file.
5. Start the backend with `npm run dev`. The API listens on port 5000 and `/api/health` reports database connectivity.
6. In a third terminal, run:

   ```powershell
   cd web-admin
   npm ci
   npm run dev
   ```

7. Open the Vite URL, normally `http://localhost:5173`, and register a customer account. New installations have no built-in demo users. To create an administrator, privately set `ADMIN_EMAIL`, `ADMIN_FULL_NAME`, and `ADMIN_PASSWORD` in `backend/.env`, then run `npm run seed:admin` from `backend/` only after confirming the configured database is the intended local database.

## Existing databases

The backend checks schema readiness but does not migrate automatically. Before upgrading an existing database, inspect it and make a backup. Run `npm run db:migrate` from `backend/` only after confirming the target is a local development database and resolving any case-insensitive duplicate emails or duplicate active rentals. This migration is additive and does not delete rows.

`database/migrations/20261011_add_active_rental_constraint.sql` is provided for manual database administration only. It prevents more than one active rental for a tray and is never applied automatically.

Do not run `docker compose down -v` for a database that contains data: removing the volume deletes that database.

## Checks

From `backend/`, run `npm test`. From `web-admin/`, run `npm run build`. Full authentication and database integration checks require a local PostgreSQL instance and a privately configured backend environment.
