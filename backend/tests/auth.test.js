/**
 * Integration tests for Authentication routes.
 * Uses an in-memory mock of the DB so no live Postgres is required.
 */
import request from "supertest";
import app from "../src/app.js";
import * as db from "../src/db.js";

// ── Mock the DB module ────────────────────────────────────────────────────────
const bcrypt = (await import("bcryptjs")).default;
const HASH = await bcrypt.hash("Test1234!", 10);

const USERS = new Map();
USERS.set(1, {
  id: 1,
  full_name: "Test Admin",
  email: "admin@test.local",
  password_hash: HASH,
  role: "ADMIN",
  status: "ACTIVE",
  is_active: true,
  email_verified: true,
  failed_login_attempts: 0,
  locked_until: null,
});
USERS.set(2, {
  id: 2,
  full_name: "Test Customer",
  email: "customer@test.local",
  password_hash: HASH,
  role: "CUSTOMER",
  status: "ACTIVE",
  is_active: true,
  email_verified: true,
  failed_login_attempts: 0,
  locked_until: null,
});

let nextId = 100;

jest.unstable_mockModule("../src/db.js", () => ({
  pool: { end: jest.fn() },
  query: jest.fn(async (text, params = []) => {
    const t = text.trim().toLowerCase();

    // SELECT user by email
    if (t.startsWith("select") && t.includes("from users where email")) {
      const email = params[0];
      const user = [...USERS.values()].find((u) => u.email === email);
      return { rows: user ? [user] : [] };
    }

    // SELECT user by id
    if (t.startsWith("select") && t.includes("from users where id")) {
      const user = USERS.get(params[0]);
      return { rows: user ? [{ ...user, updated_at: new Date() }] : [] };
    }

    // SELECT existing email (registration check)
    if (t.startsWith("select") && t.includes("from users where email = $1") && t.includes("select id")) {
      const email = params[0];
      const exists = [...USERS.values()].some((u) => u.email === email);
      return { rows: exists ? [{ id: 1 }] : [] };
    }

    // INSERT new user
    if (t.startsWith("insert into users")) {
      const id = nextId++;
      const user = {
        id,
        full_name: params[0],
        email: params[1],
        password_hash: params[2],
        role: params[3] || "CUSTOMER",
        status: "ACTIVE",
        is_active: true,
        email_verified: true,
        created_at: new Date(),
      };
      USERS.set(id, user);
      return { rows: [user] };
    }

    // UPDATE reset failed_login_attempts
    if (t.startsWith("update users set failed_login_attempts")) {
      return { rows: [] };
    }

    // UPDATE profile
    if (t.startsWith("update users set full_name")) {
      const user = USERS.get(params[1]);
      if (user) {
        user.full_name = params[0];
        return { rows: [{ ...user, updated_at: new Date() }] };
      }
      return { rows: [] };
    }

    // Catch-all
    return { rows: [] };
  }),
  withTransaction: jest.fn(async (cb) => cb({ query: db.query })),
}));

// ── Tests ─────────────────────────────────────────────────────────────────────
describe("POST /api/auth/register", () => {
  it("registers a new customer account", async () => {
    const res = await request(app).post("/api/auth/register").send({
      full_name: "New User",
      email: "new@test.local",
      password: "Secret123",
    });
    expect(res.status).toBe(201);
    expect(res.body.user).toHaveProperty("email", "new@test.local");
    expect(res.body.user).not.toHaveProperty("password_hash");
  });

  it("returns 400 when required fields missing", async () => {
    const res = await request(app).post("/api/auth/register").send({ email: "x@x.com" });
    expect(res.status).toBe(400);
  });

  it("returns 400 for invalid email", async () => {
    const res = await request(app).post("/api/auth/register").send({
      full_name: "Bad Email",
      email: "not-an-email",
      password: "Secret123",
    });
    expect(res.status).toBe(400);
  });
});

describe("POST /api/auth/login", () => {
  it("logs in with valid credentials and returns token", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "admin@test.local",
      password: "Test1234!",
    });
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("token");
    expect(res.body.user).toHaveProperty("role", "ADMIN");
  });

  it("returns 401 for wrong password", async () => {
    const res = await request(app).post("/api/auth/login").send({
      email: "admin@test.local",
      password: "wrongpassword",
    });
    expect(res.status).toBe(401);
  });

  it("returns 400 when fields missing", async () => {
    const res = await request(app).post("/api/auth/login").send({ email: "admin@test.local" });
    expect(res.status).toBe(400);
  });
});

describe("GET /api/auth/me", () => {
  it("returns 401 without token", async () => {
    const res = await request(app).get("/api/auth/me");
    expect(res.status).toBe(401);
  });

  it("returns user profile with valid token", async () => {
    // Login first
    const loginRes = await request(app).post("/api/auth/login").send({
      email: "admin@test.local",
      password: "Test1234!",
    });
    const { token } = loginRes.body;

    const res = await request(app)
      .get("/api/auth/me")
      .set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty("email", "admin@test.local");
  });
});
