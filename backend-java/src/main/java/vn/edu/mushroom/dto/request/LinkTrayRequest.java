package vn.edu.mushroom.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

@Data
public class LinkTrayRequest {
    @NotBlank(message = "Mã liên kết không được để trống")
    private String code;
}
