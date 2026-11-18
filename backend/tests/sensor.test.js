/**
 * Tests for Sensor ingestion and deduplication.
 */
jest.unstable_mockModule("../src/db.js", () => {
  const stored = new Map();
  const msgIds = new Set();

  const clientQuery = jest.fn(async (text, params = []) => {
    const t = text.trim().toLowerCase();

    // env_thresholds lookup
    if (t.includes("from env_thresholds where metric")) {
      return { rows: [] }; // No thresholds configured for these tests
    }

    // Dedup check
    if (t.includes("from sensor_readings where message_id")) {
      const msgId = params[0];
      return { rows: msgIds.has(msgId) ? [{ id: 1 }] : [] };
    }

    // Room lookup from device
    if (t.includes("from devices where id")) return { rows: [] };
    // Room lookup from tray
    if (t.includes("from trays where id")) return { rows: [] };

    // INSERT
    if (t.includes("insert into sensor_readings")) {
      if (params[6]) msgIds.add(params[6]); // message_id
      const id = stored.size + 1;
      const rec = { id, room_id: params[0], tray_id: params[1], device_id: params[2], sensor_type: params[3], value: params[4], unit: params[5], message_id: params[6], recorded_at: new Date() };
      stored.set(id, rec);
      return { rows: [rec] };
    }

    return { rows: [] };
  });

  return {
    pool: { end: jest.fn() },
    query: clientQuery,
    withTransaction: jest.fn(async (cb) => cb({ query: clientQuery })),
  };
});

const sensorService = await import("../src/services/sensorService.js");

describe("Sensor Ingestion", () => {
  it("successfully ingests a TEMPERATURE reading", async () => {
    const result = await sensorService.ingestReading({
      room_id: 1,
      sensor_type: "TEMPERATURE",
      value: 25.5,
    });
    expect(result.reading).toHaveProperty("sensor_type", "TEMPERATURE");
    expect(result.reading).toHaveProperty("value");
  });

  it("successfully ingests a HUMIDITY reading", async () => {
    const result = await sensorService.ingestReading({
      room_id: 1,
      sensor_type: "HUMIDITY",
      value: 85,
    });
    expect(result.reading.sensor_type).toBe("HUMIDITY");
  });

  it("successfully ingests a CO2 reading", async () => {
    const result = await sensorService.ingestReading({
      room_id: 1,
      sensor_type: "CO2",
      value: 650,
      unit: "ppm",
    });
    expect(result.reading.sensor_type).toBe("CO2");
  });

  it("deduplicates readings with the same message_id", async () => {
    // First ingest
    await sensorService.ingestReading({
      room_id: 1,
      sensor_type: "TEMPERATURE",
      value: 26,
      message_id: "msg-unique-001",
    });

    // Second ingest with same message_id — should be duplicate
    const result = await sensorService.ingestReading({
      room_id: 1,
      sensor_type: "TEMPERATURE",
      value: 26,
      message_id: "msg-unique-001",
    });

    expect(result.duplicate).toBe(true);
  });

  it("rejects invalid sensor_type", async () => {
    await expect(
      sensorService.ingestReading({ room_id: 1, sensor_type: "PRESSURE", value: 1013 })
    ).rejects.toThrow("sensor_type không hợp lệ");
  });

  it("throws when value is missing", async () => {
    await expect(
      sensorService.ingestReading({ room_id: 1, sensor_type: "TEMPERATURE" })
    ).rejects.toThrow();
  });
});
