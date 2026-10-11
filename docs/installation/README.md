# Installation

Use the root `README.md` and `HUONG_DAN_CHAY.md` as the current Windows setup instructions.

1. Start PostgreSQL with `docker compose up -d postgres` from the repository root.
2. On a new Docker volume, Compose applies `database/schema.sql` and `database/seed.sql` once. Do not rerun them against an existing database.
3. Copy each `.env.example` only when its local `.env` does not exist, then configure private values locally.
4. Run `npm ci` and `npm run dev` in `backend`, then `npm ci` and `npm run dev` in `web-admin`.
5. Create an administrator only when required and only after confirming the local target database.
6. Flutter requires its SDK, `flutter pub get`, `flutter analyze`, and `flutter run`.
