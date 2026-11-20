package vn.edu.mushroom.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import vn.edu.mushroom.config.JwtAuthFilter.UserPrincipal;
import vn.edu.mushroom.dto.request.SensorIngestRequest;
import vn.edu.mushroom.dto.response.DashboardSummaryResponse;
import vn.edu.mushroom.dto.response.SensorReadingResponse;
import vn.edu.mushroom.entity.enums.SensorType;
import vn.edu.mushroom.service.SensorService;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/sensors")
@RequiredArgsConstructor
@Tag(name = "Sensors", description = "Thu thập và truy vấn dữ liệu cảm biến môi trường (nhiệt độ, độ ẩm, CO2)")
public class SensorController {

    private final SensorService sensorService;

    @GetMapping("/latest")
    @Operation(summary = "Lấy dữ liệu cảm biến mới nhất (theo phòng)")
    public ResponseEntity<DashboardSummaryResponse.EnvironmentStats> getLatestReadings(
            @RequestParam(required = false) Integer room_id
    ) {
        DashboardSummaryResponse.EnvironmentStats stats = sensorService.getLatestReadings(room_id);
        return ResponseEntity.ok(stats);
    }

    @GetMapping("/history")
    @Operation(summary = "Lịch sử số đo cảm biến (Customer chỉ thấy môi trường phòng có khay mình đang thuê)")
    public ResponseEntity<List<SensorReadingResponse>> getHistory(
            @RequestParam(required = false) Integer room_id,
            @RequestParam(required = false) Integer tray_id,
            @RequestParam(required = false) SensorType sensor_type,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime from,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE_TIME) OffsetDateTime to,
            @RequestParam(defaultValue = "200") int limit,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        Integer customerId = principal != null ? principal.id() : null;
        String role = principal != null ? principal.role() : null;
        List<SensorReadingResponse> history = sensorService.getSensorHistory(
                room_id, tray_id, sensor_type, from, to, limit, customerId, role
        );
        return ResponseEntity.ok(history);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR')")
    @Operation(summary = "Nhập dữ liệu cảm biến (loại trùng message_id và đánh giá cảnh báo 2 mẫu liên tiếp)")
    public ResponseEntity<Map<String, Object>> ingestReading(@Valid @RequestBody SensorIngestRequest request) {
        Map<String, Object> result = sensorService.ingestReading(request);
        if (Boolean.TRUE.equals(result.get("duplicate"))) {
            return ResponseEntity.ok(result);
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(result);
    }
}
