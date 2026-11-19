package vn.edu.mushroom.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class VerifyEmailRequest {
    @NotBlank(message = "Mã xác minh không được để trống")
    private String token;
}
