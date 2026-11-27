package vn.edu.mushroom.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import vn.edu.mushroom.dto.request.CreateUserRequest;
import vn.edu.mushroom.dto.request.ResetPasswordRequest;
import vn.edu.mushroom.dto.request.UpdateUserRequest;
import vn.edu.mushroom.dto.response.UserListResponse;
import vn.edu.mushroom.dto.response.UserResponse;
import vn.edu.mushroom.entity.enums.Role;
import vn.edu.mushroom.entity.enums.UserStatus;
import vn.edu.mushroom.service.UserService;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
@Tag(name = "Users (Admin)", description = "Quản lý tài khoản người dùng và vai trò dành cho Quản trị viên")
public class UserController {

    private final UserService userService;

    @GetMapping
    @Operation(summary = "Danh sách người dùng (phân trang, lọc theo vai trò, trạng thái, tìm kiếm)")
    public ResponseEntity<UserListResponse> listUsers(
            @RequestParam(required = false) Role role,
            @RequestParam(required = false) UserStatus status,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "50") int limit,
            @RequestParam(defaultValue = "0") int offset
    ) {
        UserListResponse resp = userService.listUsers(role, status, search, limit, offset);
        return ResponseEntity.ok(resp);
    }

    @PostMapping
    @Operation(summary = "Tạo tài khoản người dùng mới (Admin)")
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody CreateUserRequest request) {
        UserResponse user = userService.createUser(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(user);
    }

    @GetMapping("/{id}")
    @Operation(summary = "Chi tiết người dùng theo ID")
    public ResponseEntity<UserResponse> getUserById(@PathVariable Integer id) {
        UserResponse user = userService.getUserById(id);
        return ResponseEntity.ok(user);
    }

    @PutMapping("/{id}")
    @Operation(summary = "Cập nhật thông tin/trạng thái người dùng")
    public ResponseEntity<UserResponse> updateUser(
            @PathVariable Integer id,
            @RequestBody UpdateUserRequest request
    ) {
        UserResponse user = userService.updateUser(id, request);
        return ResponseEntity.ok(user);
    }

    @PutMapping("/{id}/reset-password")
    @Operation(summary = "Đặt lại mật khẩu cho người dùng (Admin)")
    public ResponseEntity<Map<String, String>> resetPassword(
            @PathVariable Integer id,
            @Valid @RequestBody ResetPasswordRequest request
    ) {
        userService.resetUserPassword(id, request.getNewPassword());
        Map<String, String> resp = new HashMap<>();
        resp.put("message", "Đặt lại mật khẩu thành công");
        return ResponseEntity.ok(resp);
    }
}
