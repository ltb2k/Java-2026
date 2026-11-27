package vn.edu.mushroom.service;

import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import jakarta.annotation.PreDestroy;
import org.eclipse.paho.client.mqttv3.*;
import org.eclipse.paho.client.mqttv3.persist.MemoryPersistence;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Lazy;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.*;

@Service
public class MqttService {

    private static final Logger log = LoggerFactory.getLogger(MqttService.class);

    @Value("${app.mqtt.broker-url:}")
    private String brokerUrl;

    @Value("${app.mqtt.client-id:mushroom_spring_backend}")
    private String clientIdPrefix;

    private MqttClient client;
    private final ObjectMapper objectMapper = new ObjectMapper();
    private final Map<String, CompletableFuture<Map<String, Object>>> pendingCommands = new ConcurrentHashMap<>();

    @Autowired
    @Lazy
    private SensorService sensorService;

    @PostConstruct
    public void init() {
        if (brokerUrl == null || brokerUrl.isBlank()) {
            log.info("[MQTT] No broker URL configured. MQTT service disabled.");
            return;
        }

        try {
            String clientId = clientIdPrefix + "_" + UUID.randomUUID().toString().substring(0, 8);
            client = new MqttClient(brokerUrl, clientId, new MemoryPersistence());

            MqttConnectOptions options = new MqttConnectOptions();
            options.setAutomaticReconnect(true);
            options.setCleanSession(true);
            options.setConnectionTimeout(5);
            options.setKeepAliveInterval(30);

            client.setCallback(new MqttCallbackExtended() {
                @Override
                public void connectComplete(boolean reconnect, String serverURI) {
                    log.info("[MQTT] Connected to broker: {} (reconnect={})", serverURI, reconnect);
                    subscribeToTopics();
                }

                @Override
                public void connectionLost(Throwable cause) {
                    log.warn("[MQTT] Connection lost to broker: {}", cause != null ? cause.getMessage() : "unknown");
                }

                @Override
                public void messageArrived(String topic, MqttMessage message) {
                    handleIncomingMessage(topic, message);
                }

                @Override
                public void deliveryComplete(IMqttDeliveryToken token) {
                }
            });

            log.info("[MQTT] Connecting to broker at {}", brokerUrl);
            client.connect(options);
        } catch (Exception e) {
            log.warn("[MQTT] Failed to initialize MQTT client: {}. Express/Spring Boot continues running.", e.getMessage());
        }
    }

    private void subscribeToTopics() {
        try {
            if (client != null && client.isConnected()) {
                client.subscribe("mushroom/telemetry/#", 1);
                client.subscribe("mushroom/devices/+/ack", 1);
                log.info("[MQTT] Subscribed to telemetry and device ACK topics.");
            }
        } catch (MqttException e) {
            log.error("[MQTT] Failed to subscribe: {}", e.getMessage());
        }
    }

    private void handleIncomingMessage(String topic, MqttMessage message) {
        try {
            String payloadStr = new String(message.getPayload(), StandardCharsets.UTF_8);
            @SuppressWarnings("unchecked")
            Map<String, Object> data = objectMapper.readValue(payloadStr, Map.class);

            if (topic.startsWith("mushroom/telemetry")) {
                if (sensorService != null) {
                    sensorService.handleMqttTelemetry(data);
                }
            } else if (topic.contains("/ack")) {
                String commandId = (String) data.get("command_id");
                if (commandId != null && pendingCommands.containsKey(commandId)) {
                    CompletableFuture<Map<String, Object>> future = pendingCommands.remove(commandId);
                    if (future != null) {
                        future.complete(data);
                    }
                }
            }
        } catch (Exception e) {
            log.warn("[MQTT] Error processing message from topic {}: {}", topic, e.getMessage());
        }
    }

    /**
     * Publishes a downlink command and awaits ACK up to timeoutSeconds (SRS requires 10s timeout).
     */
    public CompletableFuture<Map<String, Object>> sendCommand(
            Integer deviceId,
            String commandId,
            String action,
            Object payload,
            long timeoutSeconds
    ) {
        CompletableFuture<Map<String, Object>> future = new CompletableFuture<>();

        if (client == null || !client.isConnected()) {
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("status", "FAILED");
            errorResult.put("message", "Không thể kết nối đến thiết bị IoT (MQTT Broker offline)");
            future.complete(errorResult);
            return future;
        }

        try {
            Map<String, Object> msg = new HashMap<>();
            msg.put("command_id", commandId);
            msg.put("action", action);
            msg.put("payload", payload);

            String topic = "mushroom/devices/" + deviceId + "/commands";
            byte[] bytes = objectMapper.writeValueAsBytes(msg);

            pendingCommands.put(commandId, future);

            // Timeout after specified seconds (10s)
            future.orTimeout(timeoutSeconds, TimeUnit.SECONDS)
                    .whenComplete((res, ex) -> {
                        pendingCommands.remove(commandId);
                    });

            MqttMessage mqttMessage = new MqttMessage(bytes);
            mqttMessage.setQos(1);
            client.publish(topic, mqttMessage);

        } catch (Exception e) {
            pendingCommands.remove(commandId);
            Map<String, Object> errorResult = new HashMap<>();
            errorResult.put("status", "FAILED");
            errorResult.put("message", "Lỗi gửi lệnh điều khiển đến broker: " + e.getMessage());
            future.complete(errorResult);
        }

        return future;
    }

    public boolean isConnected() {
        return client != null && client.isConnected();
    }

    @PreDestroy
    public void cleanup() {
        try {
            if (client != null && client.isConnected()) {
                client.disconnect();
                client.close();
            }
        } catch (Exception ignored) {
        }
    }
}
