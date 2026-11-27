package vn.edu.mushroom.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import vn.edu.mushroom.config.JwtAuthFilter.UserPrincipal;
import vn.edu.mushroom.dto.request.TrayRequest;
import vn.edu.mushroom.dto.request.UpdateStageRequest;
import vn.edu.mushroom.dto.response.GrowthLogResponse;
import vn.edu.mushroom.dto.response.TrayResponse;
import vn.edu.mushroom.entity.enums.GrowthStage;
import vn.edu.mushroom.entity.enums.TrayStatus;
import vn.edu.mushroom.service.TrayService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/trays")
@RequiredArgsConstructor
@Tag(name = "Trays", description = "Quản lý khay trồng nấm và tiến trình sinh trưởng")
public class TrayController {

    private final TrayService trayService;

    @GetMapping
    @Operation(summary = "Danh sách khay trồng (Customer chỉ thấy khay thuộc hợp đồng thuê ACTIVE của mình)")
    public ResponseEntity<List<TrayResponse>> listTrays(
            @RequestParam(required = false) Integer room_id,
            @RequestParam(required = false) TrayStatus status,
            @RequestParam(required = false) GrowthStage growth_stage,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        Integer customerId = principal != null ? principal.id() : null;
        String role = principal != null ? principal.role() : null;
        List<TrayResponse> trays = trayService.listTrays(room_id, status, growth_stage, customerId, role);
        return ResponseEntity.ok(trays);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR')")
    @Operation(summary = "Tạo khay trồng mới (Operator/Admin)")
    public ResponseEntity<TrayResponse> createTray(@Valid @RequestBody TrayRequest request) {
        TrayResponse tray = trayService.createTray(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(tray);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Chi tiết khay trồng theo ID")
    public ResponseEntity<TrayResponse> getTrayById(
            @PathVariable Integer id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        Integer customerId = principal != null ? principal.id() : null;
        String role = principal != null ? principal.role() : null;
        TrayResponse tray = trayService.getTrayById(id, customerId, role);
        return ResponseEntity.ok(tray);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR')")
    @Operation(summary = "Cập nhật thông tin khay trồng (Operator/Admin)")
    public ResponseEntity<TrayResponse> updateTray(
            @PathVariable Integer id,
            @RequestBody TrayRequest request
    ) {
        TrayResponse tray = trayService.updateTray(id, request);
        return ResponseEntity.ok(tray);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR')")
    @Operation(summary = "Xóa hoặc lưu trữ khay trồng (Operator/Admin)")
    public ResponseEntity<Map<String, Object>> deleteTray(@PathVariable Integer id) {
        Map<String, Object> result = trayService.deleteTray(id);
        return ResponseEntity.ok(result);
    }

    @PutMapping("/{id}/stage")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR')")
    @Operation(summary = "Cập nhật giai đoạn sinh trưởng của khay (PREPARATION → INCUBATION → FRUITING → READY_TO_HARVEST → HARVESTED → COMPLETED)")
    public ResponseEntity<TrayResponse> updateStage(
            @PathVariable Integer id,
            @Valid @RequestBody UpdateStageRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        TrayResponse tray = trayService.updateStage(id, request, principal.id());
        return ResponseEntity.ok(tray);
    }

    @GetMapping("/{id}/growth-logs")
    @Operation(summary = "Lịch sử chuyển giai đoạn sinh trưởng của khay")
    public ResponseEntity<List<GrowthLogResponse>> getGrowthLogs(@PathVariable Integer id) {
        List<GrowthLogResponse> logs = trayService.getGrowthLogs(id);
        return ResponseEntity.ok(logs);
    }
}
