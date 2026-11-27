const { test } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const jwt = require("jsonwebtoken");
const { Pool } = require("pg");

const apiUrl = process.env.AUTH_TEST_API_URL;
const databaseUrl = process.env.AUTH_TEST_DATABASE_URL;
const jwtSecret = process.env.AUTH_TEST_JWT_SECRET;
let safeDatabase = false;
try {
  const parsed = new URL(databaseUrl);
  safeDatabase = ["localhost", "127.0.0.1"].includes(parsed.hostname) &&
    parsed.pathname === "/auth_test" &&
    process.env.AUTH_TEST_ALLOW_DB_MUTATIONS === "isolated-temporary-database";
} catch {}

test("auth HTTP integration against an isolated temporary PostgreSQL database", {
  skip: !apiUrl || !databaseUrl || !jwtSecret || !safeDatabase
    ? "requires an explicitly approved localhost auth_test database"
    : false
}, async () => {
  const pool = new Pool({ connectionString: databaseUrl });
  const email = `auth-${crypto.randomUUID()}@example.test`;
  const password = `Test-${crypto.randomBytes(18).toString("hex")}`;
  let userId;

  async function request(path, { method = "GET", body, token } = {}) {
    const response = await fetch(`${apiUrl.replace(/\/+$/, "")}${path}`, {
      method,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      },
      ...(body ? { body: JSON.stringify(body) } : {})
    });
    return { status: response.status, body: await response.json() };
  }

  try {
    await pool.query("INSERT INTO roles(name) VALUES('CUSTOMER') ON CONFLICT (name) DO NOTHING");
    const health = await request("/health");
    assert.equal(health.status, 200);
    assert.equal(health.body.database, "connected");

    const invalid = await request("/auth/register", { method: "POST", body: { email: "invalid", password } });
    assert.equal(invalid.status, 400);
    const weak = await request("/auth/register", { method: "POST", body: { fullName: "Test", email, password: "short" } });
    assert.equal(weak.status, 400);

    const registered = await request("/auth/register", {
      method: "POST",
      body: { fullName: "Integration Customer", email: ` ${email.toUpperCase()} `, password }
    });
    assert.equal(registered.status, 201);
    assert.equal(registered.body.email, email);
    assert.equal(registered.body.role, "CUSTOMER");
    userId = registered.body.id;

    const duplicate = await request("/auth/register", {
      method: "POST",
      body: { fullName: "Duplicate Customer", email: email.toUpperCase(), password }
    });
    assert.equal(duplicate.status, 409);

    const wrongPassword = await request("/auth/login", {
      method: "POST", body: { email, password: `${password}-wrong` }
    });
    assert.equal(wrongPassword.status, 401);
    const missingUser = await request("/auth/login", {
      method: "POST", body: { email: `missing-${email}`, password }
    });
    assert.equal(missingUser.status, 401);

    const login = await request("/auth/login", { method: "POST", body: { email, password } });
    assert.equal(login.status, 200);
    assert.equal(login.body.user.role, "CUSTOMER");
    assert.equal(typeof login.body.token, "string");
    const currentUser = await request("/auth/me", { token: login.body.token });
    assert.equal(currentUser.status, 200);
    assert.equal(currentUser.body.email, email);

    const invalidToken = await request("/auth/me", { token: "invalid-token" });
    assert.equal(invalidToken.status, 401);
    const expiredToken = jwt.sign({ id: userId }, jwtSecret, { expiresIn: -1 });
    const expired = await request("/auth/me", { token: expiredToken });
    assert.equal(expired.status, 401);

    await pool.query("UPDATE users SET is_active=FALSE WHERE id=$1", [userId]);
    const disabledLogin = await request("/auth/login", { method: "POST", body: { email, password } });
    assert.equal(disabledLogin.status, 403);
    const disabledSession = await request("/auth/me", { token: login.body.token });
    assert.equal(disabledSession.status, 401);
  } finally {
    if (userId) await pool.query("DELETE FROM users WHERE id=$1", [userId]).catch(() => {});
    await pool.end();
  }
});
