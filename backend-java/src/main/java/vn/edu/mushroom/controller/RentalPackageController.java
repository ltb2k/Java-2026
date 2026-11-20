package vn.edu.mushroom.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;
import vn.edu.mushroom.dto.request.RentalPackageRequest;
import vn.edu.mushroom.entity.RentalPackage;
import vn.edu.mushroom.service.RentalPackageService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/packages")
@RequiredArgsConstructor
@Tag(name = "Rental Packages", description = "Quản lý gói dịch vụ thuê khay trồng")
public class RentalPackageController {

    private final RentalPackageService packageService;

    @GetMapping
    @Operation(summary = "Danh sách gói thuê (công khai khi là khách, đầy đủ khi là Admin)")
    public ResponseEntity<List<RentalPackage>> listPackages(Authentication authentication) {
        boolean isAdmin = authentication != null && authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));
        List<RentalPackage> list = packageService.listPackages(!isAdmin);
        return ResponseEntity.ok(list);
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Tạo gói thuê mới (Admin)")
    public ResponseEntity<RentalPackage> createPackage(@Valid @RequestBody RentalPackageRequest request) {
        RentalPackage pkg = packageService.createPackage(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(pkg);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Chi tiết gói thuê theo ID")
    public ResponseEntity<RentalPackage> getPackageById(@PathVariable Integer id) {
        RentalPackage pkg = packageService.getPackageById(id);
        return ResponseEntity.ok(pkg);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Cập nhật gói thuê (Admin)")
    public ResponseEntity<RentalPackage> updatePackage(
            @PathVariable Integer id,
            @RequestBody RentalPackageRequest request
    ) {
        RentalPackage pkg = packageService.updatePackage(id, request);
        return ResponseEntity.ok(pkg);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Xóa hoặc ngưng hoạt động gói thuê (Admin)")
    public ResponseEntity<Map<String, Object>> deletePackage(@PathVariable Integer id) {
        Map<String, Object> result = packageService.deletePackage(id);
        return ResponseEntity.ok(result);
    }
}
