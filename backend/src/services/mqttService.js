import mqtt from "mqtt";
import { ingestReading } from "./sensorService.js";

class MqttService {
  constructor() {
    this.client = null;
    this.connected = false;
    this.pendingCommands = new Map(); // command_id -> { resolve, timer }
  }

  init() {
    const brokerUrl = process.env.MQTT_BROKER_URL || "mqtt://localhost:1883";
    const clientId = `mushroom_backend_${Math.random().toString(16).slice(2, 8)}`;

    try {
      this.client = mqtt.connect(brokerUrl, {
        clientId,
        reconnectPeriod: 10000, // retry every 10s if broker offline
        connectTimeout: 5000,
        clean: true,
      });

      this.client.on("connect", () => {
        this.connected = true;
        console.log(`[MQTT] Connected to broker at ${brokerUrl}`);

        // Subscribe to telemetry and device acks
        this.client.subscribe("mushroom/telemetry/#", { qos: 1 }, (err) => {
          if (err) console.error("[MQTT] Telemetry subscribe error:", err.message);
        });

        this.client.subscribe("mushroom/devices/+/ack", { qos: 1 }, (err) => {
          if (err) console.error("[MQTT] Device ACK subscribe error:", err.message);
        });
      });

      this.client.on("message", (topic, message) => {
        this.handleMessage(topic, message);
      });

      this.client.on("error", (err) => {
        // Log without crashing the Express process
        console.warn(`[MQTT] Broker connection error (${brokerUrl}):`, err.message);
      });

      this.client.on("offline", () => {
        this.connected = false;
      });

      this.client.on("close", () => {
        this.connected = false;
      });
    } catch (err) {
      console.warn("[MQTT] Could not initialize MQTT client:", err.message);
    }
  }

  async handleMessage(topic, rawMessage) {
    try {
      const payload = JSON.parse(rawMessage.toString());

      // 1. Handle telemetry
      if (topic.startsWith("mushroom/telemetry")) {
        await this.handleTelemetryPayload(payload);
        return;
      }

      // 2. Handle device command ACK: mushroom/devices/{deviceId}/ack
      if (topic.includes("/ack")) {
        const commandId = payload.command_id;
        if (commandId && this.pendingCommands.has(commandId)) {
          const { resolve, timer } = this.pendingCommands.get(commandId);
          clearTimeout(timer);
          this.pendingCommands.delete(commandId);
          resolve({
            status: "ACKED",
            payload,
            timestamp: new Date(),
          });
        }
      }
    } catch (err) {
      console.warn("[MQTT] Failed to process message:", err.message);
    }
  }

  async handleTelemetryPayload(payload) {
    if (Array.isArray(payload.readings)) {
      for (const item of payload.readings) {
        await ingestReading({
          room_id: payload.room_id,
          tray_id: payload.tray_id,
          device_id: payload.device_id,
          message_id: payload.message_id ? `${payload.message_id}_${item.metric}` : null,
          sensor_type: item.metric || item.sensor_type,
          value: item.value,
          unit: item.unit,
        });
      }
    } else if (payload.metric || payload.sensor_type) {
      await ingestReading({
        room_id: payload.room_id,
        tray_id: payload.tray_id,
        device_id: payload.device_id,
        message_id: payload.message_id,
        sensor_type: payload.metric || payload.sensor_type,
        value: payload.value,
        unit: payload.unit,
      });
    }
  }

  /**
   * Publish a downlink command to a device and await ACK for up to timeoutMs (default 10s).
   * As specified in SRS: Lệnh thiếu ACK sau 10 giây không báo thành công.
   */
  async sendCommandAndWaitAck(deviceId, commandData, timeoutMs = 10000) {
    const commandId = commandData.command_id;
    const topic = `mushroom/devices/${deviceId}/commands`;
    const message = JSON.stringify(commandData);

    return new Promise((resolve) => {
      // If broker is offline, fail immediately or timeout
      if (!this.connected || !this.client) {
        return resolve({
          status: "FAILED",
          error: "MQTT broker offline",
          message: "Không thể kết nối đến thiết bị IoT (MQTT Broker offline)",
        });
      }

      const timer = setTimeout(() => {
        if (this.pendingCommands.has(commandId)) {
          this.pendingCommands.delete(commandId);
          resolve({
            status: "TIMEOUT",
            error: "ACK timeout",
            message: "Thiết bị không phản hồi trong 10 giây (ACK Timeout)",
          });
        }
      }, timeoutMs);

      this.pendingCommands.set(commandId, { resolve, timer });

      this.client.publish(topic, message, { qos: 1 }, (err) => {
        if (err) {
          clearTimeout(timer);
          this.pendingCommands.delete(commandId);
          resolve({
            status: "FAILED",
            error: err.message,
            message: "Lỗi gửi lệnh điều khiển đến broker",
          });
        }
      });
    });
  }
}

export const mqttService = new MqttService();
