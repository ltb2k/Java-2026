const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");

const originalFetch = global.fetch;
let calls = 0;

before(() => {
  global.fetch = async (url) => {
    calls += 1;
    if (String(url).includes("open-meteo")) {
      return { ok: true, json: async () => ({ latitude: 10.8, longitude: 106.6, timezone: "Asia/Ho_Chi_Minh", current: { time: "2026-10-11T10:00", temperature_2m: 27, relative_humidity_2m: 80 }, current_units: { temperature_2m: "°C", relative_humidity_2m: "%" } }) };
    }
    return { ok: true, json: async () => ({ properties: { parameter: { T2M: { "2026010100": 26 }, RH2M: { "2026010100": 82 } } } }) };
  };
});
after(() => { global.fetch = originalFetch; });

function response() {
  return { statusCode: 200, body: undefined, status(code) { this.statusCode = code; return this; }, json(value) { this.body = value; return this; } };
}

test("external weather identifies outdoor data and uses a cache", async () => {
  const controller = require("../src/controllers/externalController");
  calls = 0;
  const first = response();
  await controller.currentWeather({}, first);
  assert.equal(first.statusCode, 200);
  assert.equal(first.body.classification, "OUTDOOR_WEATHER");
  assert.equal(first.body.isOperationalSensor, false);
  assert.equal(first.body.temperature, 27);
  const second = response();
  await controller.currentWeather({}, second);
  assert.equal(second.body.cached, true);
  assert.equal(calls, 1);
});

test("external history validates date range and labels climate data", async () => {
  const controller = require("../src/controllers/externalController");
  const invalid = response();
  await controller.weatherHistory({ query: { start: "bad", end: "20260101" } }, invalid);
  assert.equal(invalid.statusCode, 400);
  const valid = response();
  await controller.weatherHistory({ query: { start: "20260101", end: "20260101" } }, valid);
  assert.equal(valid.statusCode, 200);
  assert.equal(valid.body.classification, "OUTDOOR_CLIMATE_HISTORY");
  assert.deepEqual(valid.body.points, [{ time: "2026010100", temperature: 26, humidity: 82 }]);
});

test("reference media exposes source and license metadata", () => {
  const controller = require("../src/controllers/externalController");
  const res = response();
  controller.referenceMedia({}, res);
  assert.equal(res.statusCode, 200);
  assert.ok(res.body.every((item) => item.sourceUrl && item.license && item.status === "REFERENCE"));
});
