package vn.edu.mushroom.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import vn.edu.mushroom.config.JwtAuthFilter.UserPrincipal;
import vn.edu.mushroom.dto.request.ThresholdRequest;
import vn.edu.mushroom.dto.response.AlertResponse;
import vn.edu.mushroom.dto.response.ThresholdResponse;
import vn.edu.mushroom.entity.enums.AlertSeverity;
import vn.edu.mushroom.entity.enums.AlertStatus;
import vn.edu.mushroom.entity.enums.SensorType;
import vn.edu.mushroom.service.AlertService;
import vn.edu.mushroom.service.ThresholdService;

import java.util.List;

@RestController
@RequestMapping("/api/alerts")
@RequiredArgsConstructor
@Tag(name = "Alerts & Thresholds", description = "Quản lý cảnh báo môi trường và cấu hình ngưỡng cảnh báo")
public class AlertController {

    private final AlertService alertService;
    private final ThresholdService thresholdService;

    @GetMapping
    @Operation(summary = "Danh sách cảnh báo môi trường (Customer chỉ thấy cảnh báo tại phòng chứa khay của mình)")
    public ResponseEntity<List<AlertResponse>> listAlerts(
            @RequestParam(required = false) Integer room_id,
            @RequestParam(required = false) AlertSeverity severity,
            @RequestParam(required = false) AlertStatus status,
            @RequestParam(required = false) Boolean is_read,
            @RequestParam(defaultValue = "50") int limit,
            @RequestParam(defaultValue = "0") int offset,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        Integer customerId = principal != null ? principal.id() : null;
        String role = principal != null ? principal.role() : null;
        List<AlertResponse> alerts = alertService.listAlerts(room_id, severity, status, is_read, limit, offset, customerId, role);
        return ResponseEntity.ok(alerts);
    }

    @PutMapping("/{id}/read")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR')")
    @Operation(summary = "Đánh dấu cảnh báo đã đọc")
    public ResponseEntity<AlertResponse> markAsRead(@PathVariable Long id) {
        AlertResponse alert = alertService.markAsRead(id);
        return ResponseEntity.ok(alert);
    }

    @PutMapping("/{id}/resolve")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR')")
    @Operation(summary = "Xử lý/đóng cảnh báo môi trường")
    public ResponseEntity<AlertResponse> resolveAlert(@PathVariable Long id) {
        AlertResponse alert = alertService.resolveAlert(id);
        return ResponseEntity.ok(alert);
    }

    @GetMapping("/thresholds")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR')")
    @Operation(summary = "Danh sách ngưỡng cảnh báo môi trường (nhiệt độ, độ ẩm, CO2)")
    public ResponseEntity<List<ThresholdResponse>> listThresholds() {
        List<ThresholdResponse> thresholds = thresholdService.listThresholds();
        return ResponseEntity.ok(thresholds);
    }

    @PutMapping("/thresholds/{metric}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR')")
    @Operation(summary = "Cập nhật ngưỡng môi trường cho một chỉ số (TEMPERATURE, HUMIDITY, CO2)")
    public ResponseEntity<ThresholdResponse> updateThreshold(
            @PathVariable SensorType metric,
            @Valid @RequestBody ThresholdRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        ThresholdResponse threshold = thresholdService.updateThreshold(metric, request, principal.id());
        return ResponseEntity.ok(threshold);
    }
}
