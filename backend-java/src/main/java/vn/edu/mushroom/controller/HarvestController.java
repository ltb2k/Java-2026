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
import vn.edu.mushroom.dto.request.HarvestPlanRequest;
import vn.edu.mushroom.dto.request.HarvestRecordRequest;
import vn.edu.mushroom.dto.response.HarvestResponse;
import vn.edu.mushroom.entity.enums.HarvestStatus;
import vn.edu.mushroom.service.HarvestService;

import java.util.List;

@RestController
@RequestMapping("/api/harvests")
@RequiredArgsConstructor
@Tag(name = "Harvests", description = "Quản lý kế hoạch và ghi nhận kết quả thu hoạch nấm")
public class HarvestController {

    private final HarvestService harvestService;

    @GetMapping
    @Operation(summary = "Danh sách thu hoạch (Customer chỉ xem các khay thuộc hợp đồng của mình)")
    public ResponseEntity<List<HarvestResponse>> listHarvests(
            @RequestParam(required = false) Integer tray_id,
            @RequestParam(required = false) HarvestStatus status,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        Integer customerId = principal != null ? principal.id() : null;
        String role = principal != null ? principal.role() : null;
        List<HarvestResponse> harvests = harvestService.listHarvests(tray_id, status, customerId, role);
        return ResponseEntity.ok(harvests);
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR')")
    @Operation(summary = "Lập kế hoạch thu hoạch dự kiến cho khay (Operator/Admin)")
    public ResponseEntity<HarvestResponse> createPlan(
            @Valid @RequestBody HarvestPlanRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        HarvestResponse harvest = harvestService.createHarvestPlan(request, principal.id());
        return ResponseEntity.status(HttpStatus.CREATED).body(harvest);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Chi tiết thu hoạch theo ID")
    public ResponseEntity<HarvestResponse> getHarvestById(
            @PathVariable Integer id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        Integer customerId = principal != null ? principal.id() : null;
        String role = principal != null ? principal.role() : null;
        HarvestResponse harvest = harvestService.getHarvestById(id, customerId, role);
        return ResponseEntity.ok(harvest);
    }

    @PutMapping("/{id}/record")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR')")
    @Operation(summary = "Ghi nhận sản lượng thu hoạch thực tế (chuyển trạng thái COMPLETED và cập nhật khay sang HARVESTED)")
    public ResponseEntity<HarvestResponse> recordHarvest(
            @PathVariable Integer id,
            @Valid @RequestBody HarvestRecordRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        HarvestResponse harvest = harvestService.recordHarvest(id, request, principal.id());
        return ResponseEntity.ok(harvest);
    }
}
