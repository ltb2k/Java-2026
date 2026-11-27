package vn.edu.mushroom.service;

import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.mushroom.config.JwtService;
import vn.edu.mushroom.dto.request.ChangePasswordRequest;
import vn.edu.mushroom.dto.request.LoginRequest;
import vn.edu.mushroom.dto.request.RegisterRequest;
import vn.edu.mushroom.dto.request.UpdateProfileRequest;
import vn.edu.mushroom.dto.response.AuthResponse;
import vn.edu.mushroom.dto.response.UserResponse;
import vn.edu.mushroom.entity.User;
import vn.edu.mushroom.entity.enums.Role;
import vn.edu.mushroom.entity.enums.UserStatus;
import vn.edu.mushroom.exception.AppException;
import vn.edu.mushroom.repository.UserRepository;

import java.time.Duration;
import java.time.OffsetDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    @Transactional
    public UserResponse register(RegisterRequest request) {
        String email = request.getEmail().toLowerCase().trim();

        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw AppException.conflict("Email này đã được đăng ký tài khoản");
        }

        Role role = request.getRole() != null ? request.getRole() : Role.CUSTOMER;
        if (role == Role.ADMIN) {
            role = Role.CUSTOMER; // Admin accounts cannot be self-registered
        }

        String verificationToken = UUID.randomUUID().toString();

        User user = User.builder()
                .fullName(request.getFull_name().trim())
                .email(email)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(role)
                .status(UserStatus.ACTIVE)
                .isActive(true)
                .emailVerified(true) // Active by default in current spec
                .verificationToken(verificationToken)
                .failedLoginAttempts(0)
                .build();

        User saved = userRepository.save(user);
        return UserResponse.fromEntity(saved);
    }

    @Transactional
    public AuthResponse login(LoginRequest request) {
        String email = request.getEmail().toLowerCase().trim();

        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> AppException.unauthorized("Email hoặc mật khẩu không chính xác"));

        // Check account locked
        if (user.getLockedUntil() != null && user.getLockedUntil().isAfter(OffsetDateTime.now())) {
            long remainingMinutes = Duration.between(OffsetDateTime.now(), user.getLockedUntil()).toMinutes() + 1;
            throw AppException.locked(
                "Tài khoản tạm thời bị khóa do nhập sai nhiều lần. Vui lòng thử lại sau " + remainingMinutes + " phút."
            );
        }

        if (!user.getIsActive() || user.getStatus() == UserStatus.DISABLED) {
            throw AppException.forbidden("Tài khoản đã bị vô hiệu hóa hoặc bị khóa. Vui lòng liên hệ quản trị viên.");
        }

        if (!passwordEncoder.matches(request.getPassword(), user.getPasswordHash())) {
            int attempts = user.getFailedLoginAttempts() + 1;
            user.setFailedLoginAttempts(attempts);

            if (attempts >= 5) {
                user.setLockedUntil(OffsetDateTime.now().plusMinutes(15));
                userRepository.save(user);
                throw AppException.locked("Nhập sai 5 lần liên tiếp. Tài khoản đã bị khóa trong 15 phút.");
            }

            userRepository.save(user);
            throw AppException.unauthorized("Email hoặc mật khẩu không chính xác");
        }

        // Reset failed login attempts on success
        if (user.getFailedLoginAttempts() > 0 || user.getLockedUntil() != null) {
            user.setFailedLoginAttempts(0);
            user.setLockedUntil(null);
            userRepository.save(user);
        }

        String accessToken = jwtService.generateAccessToken(user);
        String refreshToken = jwtService.generateRefreshToken(user);

        return AuthResponse.builder()
                .token(accessToken)
                .refreshToken(refreshToken)
                .user(AuthResponse.UserInfo.builder()
                        .id(user.getId())
                        .name(user.getFullName())
                        .email(user.getEmail())
                        .role(user.getRole())
                        .status(user.getStatus())
                        .build())
                .build();
    }

    @Transactional
    public UserResponse verifyEmail(String token) {
        User user = userRepository.findByVerificationToken(token)
                .orElseThrow(() -> AppException.badRequest("Mã xác minh không hợp lệ hoặc đã được sử dụng"));

        user.setEmailVerified(true);
        user.setStatus(UserStatus.ACTIVE);
        user.setVerificationToken(null);
        return UserResponse.fromEntity(userRepository.save(user));
    }

    @Transactional(readOnly = true)
    public UserResponse getProfile(Integer userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> AppException.notFound("Người dùng không tồn tại"));
        return UserResponse.fromEntity(user);
    }

    @Transactional
    public UserResponse updateProfile(Integer userId, UpdateProfileRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> AppException.notFound("Người dùng không tồn tại"));

        user.setFullName(request.getFull_name().trim());
        return UserResponse.fromEntity(userRepository.save(user));
    }

    @Transactional
    public void changePassword(Integer userId, ChangePasswordRequest request) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> AppException.notFound("Người dùng không tồn tại"));

        if (!passwordEncoder.matches(request.getCurrentPassword(), user.getPasswordHash())) {
            throw AppException.badRequest("Mật khẩu hiện tại không chính xác");
        }

        user.setPasswordHash(passwordEncoder.encode(request.getNewPassword()));
        userRepository.save(user);
    }
}
