package vn.edu.mushroom.service;

import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.mushroom.dto.request.CreateUserRequest;
import vn.edu.mushroom.dto.request.UpdateUserRequest;
import vn.edu.mushroom.dto.response.UserListResponse;
import vn.edu.mushroom.dto.response.UserResponse;
import vn.edu.mushroom.entity.User;
import vn.edu.mushroom.entity.enums.Role;
import vn.edu.mushroom.entity.enums.UserStatus;
import vn.edu.mushroom.exception.AppException;
import vn.edu.mushroom.repository.UserRepository;

import java.util.List;

@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final PasswordEncoder passwordEncoder;

    @Transactional(readOnly = true)
    public UserListResponse listUsers(Role role, UserStatus status, String search, int limit, int offset) {
        int page = offset / Math.max(limit, 1);
        PageRequest pageRequest = PageRequest.of(page, Math.max(limit, 1), Sort.by(Sort.Direction.DESC, "id"));

        Page<User> usersPage = userRepository.searchUsers(role, status, search, pageRequest);
        List<UserResponse> list = usersPage.getContent().stream()
                .map(UserResponse::fromEntity)
                .toList();

        return UserListResponse.builder()
                .users(list)
                .total(usersPage.getTotalElements())
                .build();
    }

    @Transactional(readOnly = true)
    public UserResponse getUserById(Integer id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> AppException.notFound("Người dùng không tồn tại"));
        return UserResponse.fromEntity(user);
    }

    @Transactional
    public UserResponse createUser(CreateUserRequest request) {
        String email = request.getEmail().toLowerCase().trim();

        if (userRepository.existsByEmailIgnoreCase(email)) {
            throw AppException.conflict("Email này đã được sử dụng");
        }

        User user = User.builder()
                .fullName(request.getFull_name().trim())
                .email(email)
                .passwordHash(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole() != null ? request.getRole() : Role.OPERATOR)
                .status(UserStatus.ACTIVE)
                .isActive(true)
                .emailVerified(true)
                .build();

        return UserResponse.fromEntity(userRepository.save(user));
    }

    @Transactional
    public UserResponse updateUser(Integer id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> AppException.notFound("Người dùng không tồn tại"));

        if (request.getFull_name() != null) user.setFullName(request.getFull_name().trim());
        if (request.getRole() != null) user.setRole(request.getRole());
        if (request.getStatus() != null) user.setStatus(request.getStatus());
        if (request.getIs_active() != null) user.setIsActive(request.getIs_active());

        return UserResponse.fromEntity(userRepository.save(user));
    }

    @Transactional
    public void resetUserPassword(Integer id, String newPassword) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> AppException.notFound("Người dùng không tồn tại"));

        user.setPasswordHash(passwordEncoder.encode(newPassword));
        user.setFailedLoginAttempts(0);
        user.setLockedUntil(null);
        userRepository.save(user);
    }
}
