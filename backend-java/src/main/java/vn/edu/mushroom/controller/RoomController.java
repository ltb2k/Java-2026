package vn.edu.mushroom.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.edu.mushroom.dto.request.RoomRequest;
import vn.edu.mushroom.dto.response.RoomResponse;
import vn.edu.mushroom.entity.enums.RoomStatus;
import vn.edu.mushroom.service.RoomService;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/rooms")
@RequiredArgsConstructor
@PreAuthorize("hasAnyRole('ADMIN', 'OPERATOR')")
@Tag(name = "Rooms", description = "Quản lý phòng nuôi trồng nấm")
public class RoomController {

    private final RoomService roomService;

    @GetMapping
    @Operation(summary = "Danh sách phòng trồng")
    public ResponseEntity<List<RoomResponse>> listRooms(
            @RequestParam(required = false) RoomStatus status,
            @RequestParam(defaultValue = "false") boolean includeArchived
    ) {
        List<RoomResponse> rooms = roomService.listRooms(status, includeArchived);
        return ResponseEntity.ok(rooms);
    }

    @PostMapping
    @Operation(summary = "Tạo phòng trồng mới")
    public ResponseEntity<RoomResponse> createRoom(@Valid @RequestBody RoomRequest request) {
        RoomResponse room = roomService.createRoom(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(room);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Chi tiết phòng trồng theo ID")
    public ResponseEntity<RoomResponse> getRoomById(@PathVariable Integer id) {
        RoomResponse room = roomService.getRoomById(id);
        return ResponseEntity.ok(room);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật thông tin phòng trồng")
    public ResponseEntity<RoomResponse> updateRoom(
            @PathVariable Integer id,
            @RequestBody RoomRequest request
    ) {
        RoomResponse room = roomService.updateRoom(id, request);
        return ResponseEntity.ok(room);
    }

    @DeleteMapping("/{id}")
    @Operation(summary = "Xóa hoặc lưu trữ phòng trồng (soft-archive nếu đang có khay/thiết bị)")
    public ResponseEntity<Map<String, Object>> deleteRoom(@PathVariable Integer id) {
        Map<String, Object> result = roomService.deleteRoom(id);
        return ResponseEntity.ok(result);
    }
}
