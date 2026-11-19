package vn.edu.mushroom.dto.request;

import lombok.Data;
import vn.edu.mushroom.entity.enums.Role;
import vn.edu.mushroom.entity.enums.UserStatus;

@Data
public class UpdateUserRequest {
    private String full_name;
    private Role role;
    private UserStatus status;
    private Boolean is_active;
}
