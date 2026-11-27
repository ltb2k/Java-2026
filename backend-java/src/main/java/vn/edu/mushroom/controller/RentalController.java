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
import vn.edu.mushroom.dto.request.*;
import vn.edu.mushroom.dto.response.RentalResponse;
import vn.edu.mushroom.entity.enums.RentalStatus;
import vn.edu.mushroom.service.RentalService;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rentals")
@RequiredArgsConstructor
@Tag(name = "Rentals", description = "Quy trình thuê khay, duyệt thuê, gán khay và liên kết bằng mã 24h")
public class RentalController {

    private final RentalService rentalService;

    @GetMapping
    @Operation(summary = "Danh sách yêu cầu/hợp đồng thuê (Customer chỉ thấy của mình; Operator/Admin thấy tất cả)")
    public ResponseEntity<List<RentalResponse>> listRentals(
            @RequestParam(required = false) RentalStatus status,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        Integer customerId = principal != null ? principal.id() : null;
        String role = principal != null ? principal.role() : null;
        List<RentalResponse> rentals = rentalService.listRentals(customerId, status, role);
        return ResponseEntity.ok(rentals);
    }

    @PostMapping
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Gửi yêu cầu thuê khay (Customer) - trạng thái khởi tạo PENDING")
    public ResponseEntity<RentalResponse> requestRental(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody RentalRequest request
    ) {
        RentalResponse rental = rentalService.requestRental(principal.id(), request);
        return ResponseEntity.status(HttpStatus.CREATED).body(rental);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Chi tiết yêu cầu/hợp đồng thuê theo ID")
    public ResponseEntity<RentalResponse> getRentalById(
            @PathVariable Integer id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        Integer customerId = principal != null ? principal.id() : null;
        String role = principal != null ? principal.role() : null;
        RentalResponse rental = rentalService.getRentalById(id, customerId, role);
        return ResponseEntity.ok(rental);
    }

    @PostMapping("/{id}/approve")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR')")
    @Operation(summary = "Duyệt yêu cầu thuê (PENDING → APPROVED)")
    public ResponseEntity<RentalResponse> approveRental(
            @PathVariable Integer id,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        RentalResponse rental = rentalService.approveRental(id, principal.id());
        return ResponseEntity.ok(rental);
    }

    @PostMapping("/{id}/reject")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR')")
    @Operation(summary = "Từ chối yêu cầu thuê (PENDING → REJECTED)")
    public ResponseEntity<RentalResponse> rejectRental(
            @PathVariable Integer id,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody(required = false) RejectRentalRequest request
    ) {
        RentalResponse rental = rentalService.rejectRental(id, principal.id(), request);
        return ResponseEntity.ok(rental);
    }

    @PostMapping("/{id}/assign-trays")
    @PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR')")
    @Operation(summary = "Gán khay và cấp mã liên kết dùng một lần (có hiệu lực 24h)")
    public ResponseEntity<Map<String, Object>> assignTrays(
            @PathVariable Integer id,
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody AssignTraysRequest request
    ) {
        Map<String, Object> result = rentalService.assignTrays(id, principal.id(), request);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/link")
    @PreAuthorize("hasRole('CUSTOMER')")
    @Operation(summary = "Khách hàng nhập mã liên kết kích hoạt hợp đồng (ASSIGNED → ACTIVE)")
    public ResponseEntity<Map<String, Object>> linkWithCode(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody LinkTrayRequest request
    ) {
        RentalResponse rental = rentalService.linkWithCode(principal.id(), request.getCode());
        Map<String, Object> resp = new HashMap<>();
        resp.put("message", "Liên kết khay thành công! Hợp đồng thuê đã được kích hoạt.");
        resp.put("rental", rental);
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/{id}/cancel")
    @Operation(summary = "Hủy yêu cầu thuê (Customer chỉ được hủy khi PENDING; Staff có thể hủy kèm lý do)")
    public ResponseEntity<Map<String, Object>> cancelRental(
            @PathVariable Integer id,
            @AuthenticationPrincipal UserPrincipal principal,
            @RequestBody(required = false) CancelRentalRequest request
    ) {
        RentalResponse rental = rentalService.cancelRental(id, principal.id(), principal.role(), request);
        Map<String, Object> resp = new HashMap<>();
        resp.put("message", "Đã hủy yêu cầu thuê.");
        resp.put("rental", rental);
        return ResponseEntity.ok(resp);
    }
}
