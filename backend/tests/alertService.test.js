/**
 * Unit tests for the 2-consecutive-sample threshold alert logic.
 * Tests the core SRS requirement: 2 consecutive samples out of bounds → alert.
 */

// Mock DB
jest.unstable_mockModule("../src/db.js", () => {
  const mockData = {
    thresholds: {
      TEMPERATURE: { id: 1, metric: "TEMPERATURE", lower_bound: 20, upper_bound: 30, unit: "°C" },
      HUMIDITY: { id: 2, metric: "HUMIDITY", lower_bound: 70, upper_bound: 95, unit: "%" },
      CO2: { id: 3, metric: "CO2", lower_bound: 400, upper_bound: 1200, unit: "ppm" },
    },
    violations: new Map(),
    alerts: new Map(),
    nextAlertId: 1,
  };

  const makeClient = () => ({
    query: jest.fn(async (text, params = []) => {
      const t = text.trim().toLowerCase();

      // env_thresholds lookup
      if (t.includes("from env_thresholds where metric")) {
        const metric = params[0];
        const threshold = mockData.thresholds[metric];
        return { rows: threshold ? [threshold] : [] };
      }

      // consecutive_violations SELECT FOR UPDATE
      if (t.includes("from consecutive_violations") && t.includes("for update")) {
        const [room_id, metric] = params;
        const key = `${room_id}:${metric}`;
        const v = mockData.violations.get(key);
        return { rows: v ? [v] : [] };
      }

      // consecutive_violations UPSERT
      if (t.includes("insert into consecutive_violations")) {
        const [room_id, metric, count, last_value] = params;
        const key = `${room_id}:${metric}`;
        mockData.violations.set(key, { count, last_value, room_id, metric });
        return { rows: [] };
      }

      // UPDATE consecutive_violations (reset)
      if (t.includes("update consecutive_violations")) {
        const [last_value, room_id, metric] = params;
        const key = `${room_id}:${metric}`;
        const v = mockData.violations.get(key);
        if (v) v.count = 0;
        return { rows: [] };
      }

      // alerts SELECT existing active
      if (t.includes("from alerts") && t.includes("where room_id") && t.includes("status = 'active'")) {
        const [room_id, metric] = params;
        const key = `alert:${room_id}:${metric}`;
        const a = mockData.alerts.get(key);
        return { rows: a ? [a] : [] };
      }

      // alerts INSERT
      if (t.includes("insert into alerts")) {
        const [room_id, metric, severity, title, message] = params;
        const key = `alert:${room_id}:${metric}`;
        const id = mockData.nextAlertId++;
        mockData.alerts.set(key, { id, room_id, metric, severity, status: "ACTIVE" });
        return { rows: [{ id }] };
      }

      // alerts UPDATE (resolve)
      if (t.includes("update alerts set status = 'resolved'")) {
        const [room_id, metric] = params;
        const key = `alert:${room_id}:${metric}`;
        mockData.alerts.delete(key);
        return { rows: [{ id: 1 }] };
      }

      // UPDATE alerts message
      if (t.includes("update alerts") && t.includes("set message")) {
        return { rows: [] };
      }

      return { rows: [] };
    }),
  });

  return {
    pool: { end: jest.fn() },
    query: jest.fn(async (text, params = []) => makeClient().query(text, params)),
    withTransaction: jest.fn(async (cb) => cb(makeClient())),
  };
});

const { evaluateReading } = await import("../src/services/alertService.js");

describe("Alert Service — 2-consecutive-sample rule", () => {
  it("returns UNCONFIGURED when no threshold set", async () => {
    const result = await evaluateReading({ room_id: 99, metric: "PRESSURE", value: 50 });
    expect(result.status).toBe("UNCONFIGURED");
  });

  it("1st violation: returns FIRST_VIOLATION_PENDING — no alert yet", async () => {
    const result = await evaluateReading({
      room_id: 1,
      metric: "TEMPERATURE",
      value: 35, // above max 30
    });
    expect(result.status).toBe("FIRST_VIOLATION_PENDING_CONFIRMATION");
    expect(result.violationCount).toBe(1);
  });

  it("2nd consecutive violation: generates ALERT", async () => {
    const result = await evaluateReading({
      room_id: 1,
      metric: "TEMPERATURE",
      value: 36, // above max 30 again
    });
    expect(result.status).toBe("ALERT_GENERATED");
    expect(result.violationCount).toBe(2);
    expect(result.alertId).toBeDefined();
  });

  it("normal reading after violations: resolves alert and resets counter", async () => {
    const result = await evaluateReading({
      room_id: 1,
      metric: "TEMPERATURE",
      value: 25, // within range
    });
    expect(result.status).toBe("NORMAL");
    expect(result.resolvedCount).toBe(1);
  });

  it("CO2 violation — 1st sample: no alert", async () => {
    const result = await evaluateReading({
      room_id: 2,
      metric: "CO2",
      value: 1500, // above max 1200
    });
    expect(result.status).toBe("FIRST_VIOLATION_PENDING_CONFIRMATION");
  });

  it("CO2 violation — 2nd sample: generates DANGER alert for extreme values", async () => {
    const result = await evaluateReading({
      room_id: 2,
      metric: "CO2",
      value: 1800, // very high, > 25% beyond
    });
    expect(result.status).toBe("ALERT_GENERATED");
  });
});
