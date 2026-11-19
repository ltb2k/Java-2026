package vn.edu.mushroom.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

import java.util.Map;

@Data
public class DeviceCommandRequest {
    @NotBlank(message = "Lệnh điều khiển (action) không được để trống")
    private String action;

    private Map<String, Object> payload;
}
