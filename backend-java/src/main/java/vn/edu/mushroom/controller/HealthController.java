package vn.edu.mushroom.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RestController;
import vn.edu.mushroom.service.MqttService;

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.Map;

@RestController
@RequiredArgsConstructor
@Tag(name = "Health & Info", description = "Kiểm tra tình trạng hoạt động của API và kết nối MQTT")
public class HealthController {

    private final MqttService mqttService;

    @GetMapping("/")
    @Operation(summary = "Root API info")
    public ResponseEntity<Map<String, Object>> root() {
        Map<String, Object> resp = new HashMap<>();
        resp.put("name", "Mushroom IoT API (Spring Boot)");
        resp.put("version", "2.0.0");
        resp.put("status", "running");
        resp.put("timestamp", OffsetDateTime.now());
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/health")
    @Operation(summary = "Kiểm tra sức khỏe hệ thống")
    public ResponseEntity<Map<String, Object>> health() {
        Map<String, Object> resp = new HashMap<>();
        resp.put("status", "ok");
        resp.put("mqtt_connected", mqttService.isConnected());
        resp.put("timestamp", OffsetDateTime.now());
        return ResponseEntity.ok(resp);
    }
}
