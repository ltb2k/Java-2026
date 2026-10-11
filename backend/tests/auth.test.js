const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const crypto = require("node:crypto");
const Module = require("node:module");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = crypto.randomBytes(48).toString("hex");
process.env.DATABASE_URL = "postgresql://unit-test:unit-test@127.0.0.1/unit_test";

const customerId = "589b0f28-d084-4da7-9c16-d716b90a25a0";
const customerRole = { id: 3 };
const deviceKey = crypto.randomBytes(32).toString("hex");
let savedUser = null;
let lookupMode = "normal";
let lastDeviceListQuery = "";
const poolStub = {
  async query(sql, params = []) {
    if (sql.includes("FROM iot_devices d LEFT JOIN")) {
      lastDeviceListQuery = sql;
      return { rowCount: 1, rows: [{ id: "device-1", device_code: "ESP-1", device_type: "ESP32" }] };
    }
    if (sql.includes("SELECT * FROM iot_devices WHERE device_code=$1")) {
      return { rowCount: 1, rows: [{ id: "device-1", device_code: params[0], room_id: null, api_key: null }] };
    }
    if (sql.includes("SELECT room_id,api_key FROM iot_devices")) {
      return { rowCount: 1, rows: [{ room_id: "room-1", api_key: deviceKey }] };
    }
    if (sql.includes("SELECT device_code,device_type,is_on,status FROM iot_devices")) {
      return { rowCount: 1, rows: [{ device_code: "ACT-1", device_type: "FAN", is_on: false, status: "OFFLINE" }] };
    }
    if (sql.includes("SELECT id FROM roles WHERE name='CUSTOMER'")) {
      return { rowCount: 1, rows: [customerRole] };
    }
    if (sql.includes("INSERT INTO users")) {
      if (savedUser?.email === params[1]) {
        const error = new Error("duplicate");
        error.code = "23505";
        throw error;
      }
      savedUser = {
        id: customerId,
        full_name: params[0],
        email: params[1],
        password_hash: params[2],
        role_id: params[3],
        phone: params[4],
        is_active: true,
        role: "CUSTOMER"
      };
      return { rowCount: 1, rows: [{ ...savedUser }] };
    }
    if (sql.includes("FROM users u JOIN roles r ON r.id=u.role_id") && sql.includes("WHERE u.email=$1")) {
      const user = savedUser?.email === params[0] ? savedUser : null;
      if (!user || lookupMode === "missing") return { rowCount: 0, rows: [] };
      return { rowCount: 1, rows: [{ ...user, is_active: lookupMode !== "inactive" }] };
    }
    if (sql.includes("FROM users u JOIN roles r ON r.id=u.role_id WHERE u.id=$1")) {
      if (lookupMode === "database-error") {
        const error = new Error("database failure");
        error.code = "ECONNREFUSED";
        throw error;
      }
      return savedUser
        ? { rowCount: 1, rows: [{ ...savedUser, is_active: lookupMode !== "inactive" }] }
        : { rowCount: 0, rows: [] };
    }
    throw new Error("Unexpected query in auth test");
  }
};

const originalLoad = Module._load;
Module._load = function loadWithTestPool(request, parent, isMain) {
  if (request === "../config/db" && parent?.filename.includes("authController.js")) return poolStub;
  if (request === "../config/db" && parent?.filename.endsWith("middleware\\auth.js")) return poolStub;
  if (request === "../config/db" && parent?.filename.endsWith("controllers\\deviceController.js")) return poolStub;
  if (request === "../config/db" && parent?.filename.endsWith("controllers\\sensorController.js")) return poolStub;
  return originalLoad.call(this, request, parent, isMain);
};

const authController = require("../src/controllers/authController");
const { auth } = require("../src/middleware/auth");
const deviceController = require("../src/controllers/deviceController");
const sensorController = require("../src/controllers/sensorController");
Module._load = originalLoad;

function response() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
}

function request(body) { return { body }; }

before(() => {
  savedUser = null;
  lookupMode = "normal";
});

after(() => {
  delete process.env.JWT_SECRET;
  delete process.env.DATABASE_URL;
});

test("register normalizes email, hashes password, and assigns CUSTOMER", async () => {
  const res = response();
  await authController.register(request({ fullName: "Test Customer", email: " Person@Example.test ", password: "correct horse battery", phone: "" }), res);
  assert.equal(res.statusCode, 201);
  assert.equal(res.body.email, "person@example.test");
  assert.equal(res.body.role, "CUSTOMER");
  assert.equal(await bcrypt.compare("correct horse battery", savedUser.password_hash), true);
  assert.equal(Object.hasOwn(res.body, "password_hash"), false);
});

test("duplicate email is reported as conflict", async () => {
  const res = response();
  await authController.register(request({ fullName: "Another", email: "PERSON@example.test", password: "correct horse battery" }), res);
  assert.equal(res.statusCode, 409);
});

test("missing, malformed, and weak registration input is rejected", async () => {
  for (const body of [undefined, {}, { fullName: "A", email: "not-an-email", password: "abcdefgh" }, { fullName: "A", email: "a@example.test", password: "short" }]) {
    const res = response();
    await authController.register(request(body), res);
    assert.equal(res.statusCode, 400);
  }
});

test("login accepts normalized email and returns a verifiable JWT", async () => {
  const res = response();
  await authController.login(request({ email: "PERSON@example.test", password: "correct horse battery" }), res);
  assert.equal(res.statusCode, 200);
  assert.equal(res.body.user.role, "CUSTOMER");
  assert.equal(jwt.verify(res.body.token, process.env.JWT_SECRET).id, customerId);
});

test("wrong password and unknown account do not authenticate", async () => {
  let res = response();
  await authController.login(request({ email: "person@example.test", password: "incorrect password" }), res);
  assert.equal(res.statusCode, 401);
  res = response();
  await authController.login(request({ email: "missing@example.test", password: "incorrect password" }), res);
  assert.equal(res.statusCode, 401);
});

test("inactive accounts cannot log in", async () => {
  lookupMode = "inactive";
  const res = response();
  await authController.login(request({ email: "person@example.test", password: "correct horse battery" }), res);
  assert.equal(res.statusCode, 403);
  lookupMode = "normal";
});

test("auth middleware rejects missing, invalid, and expired tokens", async () => {
  for (const authorization of [undefined, "Bearer invalid", `Bearer ${jwt.sign({ id: customerId }, process.env.JWT_SECRET, { expiresIn: -1 })}`]) {
    const res = response();
    await auth({ headers: { authorization } }, res, () => assert.fail("next must not run"));
    assert.equal(res.statusCode, 401);
  }
});

test("auth middleware checks the current account status", async () => {
  lookupMode = "inactive";
  const token = jwt.sign({ id: customerId }, process.env.JWT_SECRET, { expiresIn: "1m" });
  const res = response();
  await auth({ headers: { authorization: `Bearer ${token}` } }, res, () => assert.fail("next must not run"));
  assert.equal(res.statusCode, 401);
  lookupMode = "database-error";
  const unavailable = response();
  await auth({ headers: { authorization: `Bearer ${token}` } }, unavailable, () => assert.fail("next must not run"));
  assert.equal(unavailable.statusCode, 503);
  lookupMode = "normal";
});

test("device command polling requires a device key and never returns keys", async () => {
  let res = response();
  await deviceController.commands({ query: {}, headers: {} }, res);
  assert.equal(res.statusCode, 400);

  res = response();
  await deviceController.commands({ query: { deviceCode: "ESP-1" }, headers: {} }, res);
  assert.equal(res.statusCode, 401);

  res = response();
  await deviceController.commands({ query: { deviceCode: "ESP-1" }, headers: { "x-device-key": deviceKey } }, res);
  assert.equal(res.statusCode, 200);
  assert.equal(JSON.stringify(res.body).includes(deviceKey), false);
});

test("device management responses omit stored device keys", async () => {
  const res = response();
  await deviceController.list({}, res);
  assert.equal(res.statusCode, 200);
  assert.equal(lastDeviceListQuery.includes("api_key"), false);
  assert.equal(JSON.stringify(res.body).includes(deviceKey), false);
});

test("sensor ingest fails closed when no device key is configured", async () => {
  delete process.env.IOT_INGEST_KEY;
  const res = response();
  await sensorController.ingest({
    body: { deviceCode: "ESP-1", temperature: 25 },
    headers: {}
  }, res);
  assert.equal(res.statusCode, 503);
});
