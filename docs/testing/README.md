# Testing checklist

From `backend`, run `npm test`. The database integration test is intentionally skipped unless an explicitly approved local `auth_test` database is configured.

From `web-admin`, run `npm run build`.

For manual API checks, use a disposable local account and verify `/api/health`, registration, login, `/api/auth/me`, customer ownership of trays/progress/harvests/sensors, and an expired token. Do not use a production database for tests.
