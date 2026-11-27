package vn.edu.mushroom.controller;

import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;
import vn.edu.mushroom.config.JwtAuthFilter.UserPrincipal;
import vn.edu.mushroom.dto.request.*;
import vn.edu.mushroom.dto.response.AuthResponse;
import vn.edu.mushroom.dto.response.UserResponse;
import vn.edu.mushroom.service.AuthService;

import java.util.HashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
@Tag(name = "Authentication", description = "Đăng ký, đăng nhập và thông tin tài khoản")
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    @Operation(summary = "Đăng ký tài khoản người dùng mới")
    public ResponseEntity<Map<String, Object>> register(@Valid @RequestBody RegisterRequest request) {
        UserResponse user = authService.register(request);
        Map<String, Object> resp = new HashMap<>();
        resp.put("message", "Đăng ký tài khoản thành công");
        resp.put("user", user);
        return ResponseEntity.status(HttpStatus.CREATED).body(resp);
    }

    @PostMapping("/login")
    @Operation(summary = "Đăng nhập và nhận JWT access/refresh token")
    public ResponseEntity<AuthResponse> login(@Valid @RequestBody LoginRequest request) {
        AuthResponse resp = authService.login(request);
        return ResponseEntity.ok(resp);
    }

    @PostMapping("/verify-email")
    @Operation(summary = "Xác minh email qua token")
    public ResponseEntity<Map<String, Object>> verifyEmail(@Valid @RequestBody VerifyEmailRequest request) {
        UserResponse user = authService.verifyEmail(request.getToken());
        Map<String, Object> resp = new HashMap<>();
        resp.put("message", "Xác minh email thành công");
        resp.put("user", user);
        return ResponseEntity.ok(resp);
    }

    @GetMapping("/me")
    @Operation(summary = "Lấy thông tin tài khoản hiện tại")
    public ResponseEntity<UserResponse> getProfile(@AuthenticationPrincipal UserPrincipal principal) {
        UserResponse profile = authService.getProfile(principal.id());
        return ResponseEntity.ok(profile);
    }

    @PutMapping("/me")
    @Operation(summary = "Cập nhật thông tin hồ sơ tài khoản")
    public ResponseEntity<UserResponse> updateProfile(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody UpdateProfileRequest request
    ) {
        UserResponse profile = authService.updateProfile(principal.id(), request);
        return ResponseEntity.ok(profile);
    }

    @PutMapping("/change-password")
    @Operation(summary = "Đổi mật khẩu")
    public ResponseEntity<Map<String, String>> changePassword(
            @AuthenticationPrincipal UserPrincipal principal,
            @Valid @RequestBody ChangePasswordRequest request
    ) {
        authService.changePassword(principal.id(), request);
        Map<String, String> resp = new HashMap<>();
        resp.put("message", "Đổi mật khẩu thành công");
        return ResponseEntity.ok(resp);
    }
}
