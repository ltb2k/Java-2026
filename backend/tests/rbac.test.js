/**
 * Tests for RBAC middleware.
 */
import request from "supertest";
import jwt from "jsonwebtoken";
import app from "../src/app.js";

jest.unstable_mockModule("../src/db.js", () => ({
  pool: { end: jest.fn() },
  query: jest.fn().mockResolvedValue({ rows: [] }),
  withTransaction: jest.fn(async (cb) => cb({ query: jest.fn().mockResolvedValue({ rows: [] }) })),
}));

const JWT_SECRET = "mushroom_jwt_secret_dev";

function makeToken(role, id = 1) {
  return jwt.sign({ id, email: `${role.toLowerCase()}@test.com`, role, name: "Test" }, JWT_SECRET, { expiresIn: "1h" });
}

describe("RBAC Middleware", () => {
  it("unauthenticated request to /api/users returns 401", async () => {
    const res = await request(app).get("/api/users");
    expect(res.status).toBe(401);
  });

  it("CUSTOMER token on /api/users returns 403", async () => {
    const token = makeToken("CUSTOMER");
    const res = await request(app).get("/api/users").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("OPERATOR token on /api/users returns 403 (admin only)", async () => {
    const token = makeToken("OPERATOR");
    const res = await request(app).get("/api/users").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("ADMIN token on /api/users returns 200", async () => {
    const token = makeToken("ADMIN");
    const res = await request(app).get("/api/users").set("Authorization", `Bearer ${token}`);
    // DB mock returns empty, so expects 200 with data
    expect(res.status).toBe(200);
  });

  it("ADMIN token on /api/rooms returns 200 (inherits OPERATOR)", async () => {
    const token = makeToken("ADMIN");
    const res = await request(app).get("/api/rooms").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(200);
  });

  it("CUSTOMER token on /api/devices returns 403", async () => {
    const token = makeToken("CUSTOMER");
    const res = await request(app).get("/api/devices").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(403);
  });

  it("CUSTOMER cannot POST /api/devices/:id/command", async () => {
    const token = makeToken("CUSTOMER");
    const res = await request(app)
      .post("/api/devices/1/command")
      .set("Authorization", `Bearer ${token}`)
      .send({ action: "TURN_ON" });
    expect(res.status).toBe(403);
  });

  it("expired token returns 401", async () => {
    const token = jwt.sign({ id: 1, email: "x@x.com", role: "ADMIN" }, JWT_SECRET, { expiresIn: "-1s" });
    const res = await request(app).get("/api/users").set("Authorization", `Bearer ${token}`);
    expect(res.status).toBe(401);
  });
});
