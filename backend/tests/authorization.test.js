const { test, before, after } = require("node:test");
const assert = require("node:assert/strict");
const Module = require("node:module");

const queries = [];
const poolStub = {
  async query(sql, params = []) {
    queries.push({ sql, params });
    return { rowCount: 0, rows: [] };
  }
};

const originalLoad = Module._load;
before(() => {
  Module._load = function patched(request, parent, isMain) {
    if (request === "../config/db") return poolStub;
    return originalLoad.call(this, request, parent, isMain);
  };
});
after(() => { Module._load = originalLoad; });

function response() {
  return {
    statusCode: 200,
    body: undefined,
    status(code) { this.statusCode = code; return this; },
    json(body) { this.body = body; return this; }
  };
}

test("customer progress query is restricted to active rentals", async () => {
  const progress = require("../src/controllers/progressController");
  queries.length = 0;
  const res = response();
  await progress.list({ query: {}, user: { id: "customer-id", role: "CUSTOMER" } }, res);
  assert.equal(res.statusCode, 200);
  assert.match(queries[0].sql, /rent\.customer_id=\$1 AND rent\.status='ACTIVE'/);
  assert.deepEqual(queries[0].params, ["customer-id"]);
});

test("customer harvest query is restricted to own or actively rented trays", async () => {
  const harvest = require("../src/controllers/harvestController");
  queries.length = 0;
  const res = response();
  await harvest.list({ user: { id: "customer-id", role: "CUSTOMER" } }, res);
  assert.equal(res.statusCode, 200);
  assert.match(queries[0].sql, /rent\.customer_id=\$1 AND rent\.status='ACTIVE'/);
  assert.deepEqual(queries[0].params, ["customer-id"]);
});

test("customer sensor history requires an active rental and validates hours", async () => {
  const sensors = require("../src/controllers/sensorController");
  queries.length = 0;
  const res = response();
  await sensors.history({ query: { hours: "24" }, user: { id: "customer-id", role: "CUSTOMER" } }, res);
  assert.equal(res.statusCode, 200);
  assert.match(queries[0].sql, /rent\.customer_id=\$2 AND rent\.status='ACTIVE'/);
  assert.deepEqual(queries[0].params, [24, "customer-id"]);

  const invalid = response();
  await sensors.history({ query: { hours: "0" }, user: { id: "customer-id", role: "CUSTOMER" } }, invalid);
  assert.equal(invalid.statusCode, 400);
});
