package vn.edu.mushroom.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.edu.mushroom.entity.User;
import vn.edu.mushroom.entity.enums.Role;
import vn.edu.mushroom.entity.enums.UserStatus;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserResponse {
    private Integer id;
    private String full_name;
    private String email;
    private Role role;
    private UserStatus status;
    private Boolean is_active;
    private Boolean email_verified;
    private OffsetDateTime created_at;
    private OffsetDateTime updated_at;

    public static UserResponse fromEntity(User user) {
        if (user == null) return null;
        return UserResponse.builder()
                .id(user.getId())
                .full_name(user.getFullName())
                .email(user.getEmail())
                .role(user.getRole())
                .status(user.getStatus())
                .is_active(user.getIsActive())
                .email_verified(user.getEmailVerified())
                .created_at(user.getCreatedAt())
                .updated_at(user.getUpdatedAt())
                .build();
    }
}
