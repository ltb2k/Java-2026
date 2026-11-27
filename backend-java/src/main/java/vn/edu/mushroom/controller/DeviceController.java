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
import vn.edu.mushroom.dto.request.DeviceCommandRequest;
import vn.edu.mushroom.dto.request.DeviceRequest;
import vn.edu.mushroom.dto.response.DeviceResponse;
import vn.edu.mushroom.entity.DeviceCommand;
import vn.edu.mushroom.entity.enums.DeviceStatus;
import vn.edu.mushroom.service.DeviceService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/devices")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR')")
@Tag(name = "Devices", description = "Quản lý thiết bị IoT và điều khiển chấp hành thủ công có xác nhận ACK 10 giây")
public class DeviceController {

    private final DeviceService deviceService;

    @GetMapping
    @Operation(summary = "Danh sách thiết bị IoT (lọc theo phòng, loại, trạng thái)")
    public ResponseEntity<List<DeviceResponse>> listDevices(
            @RequestParam(required = false) Integer room_id,
            @RequestParam(required = false) String device_type,
            @RequestParam(required = false) DeviceStatus status
    ) {
        List<DeviceResponse> list = deviceService.listDevices(room_id, device_type, status);
        return ResponseEntity.ok(list);
    }

    @PostMapping
    @Operation(summary = "Đăng ký thiết bị mới theo phòng")
    public ResponseEntity<DeviceResponse> createDevice(@Valid @RequestBody DeviceRequest request) {
        DeviceResponse device = deviceService.createDevice(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(device);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Chi tiết thiết bị theo ID")
    public ResponseEntity<DeviceResponse> getDeviceById(@PathVariable Integer id) {
        DeviceResponse device = deviceService.getDeviceById(id);
        return ResponseEntity.ok(device);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật thông tin thiết bị")
    public ResponseEntity<DeviceResponse> updateDevice(
            @PathVariable Integer id,
            @RequestBody DeviceRequest request
    ) {
        DeviceResponse device = deviceService.updateDevice(id, request);
        return ResponseEntity.ok(device);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa thiết bị")
    public ResponseEntity<Map<String, Object>> deleteDevice(@PathVariable Integer id) {
        Map<String, Object> result = deviceService.deleteDevice(id);
        return ResponseEntity.ok(result);
    }

    @PostMapping("/{id}/command")
    @Operation(summary = "Gửi lệnh điều khiển thiết bị qua MQTT và chờ phản hồi ACK trong 10 giây (SRS: Không có ACK sau 10s không báo thành công)")
    public ResponseEntity<Map<String, Object>> sendCommand(
            @PathVariable Integer id,
            @Valid @RequestBody DeviceCommandRequest request,
            @AuthenticationPrincipal UserPrincipal principal
    ) {
        Map<String, Object> result = deviceService.sendDeviceCommand(id, request, principal.id());
        return ResponseEntity.ok(result);
    }

    @GetMapping("/{id}/commands")
    @Operation(summary = "Lịch sử các lệnh điều khiển đã gửi cho thiết bị")
    public ResponseEntity<List<DeviceCommand>> getCommands(@PathVariable Integer id) {
        List<DeviceCommand> history = deviceService.getDeviceCommandHistory(id);
        return ResponseEntity.ok(history);
    }
}
