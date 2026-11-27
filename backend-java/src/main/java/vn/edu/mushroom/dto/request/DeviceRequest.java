package vn.edu.mushroom.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import vn.edu.mushroom.entity.enums.DeviceStatus;

@Data
public class DeviceRequest {
    @NotBlank(message = "Tên thiết bị không được để trống")
    private String name;

    @NotBlank(message = "Loại thiết bị không được để trống")
    private String device_type;

    private Integer room_id;

    private Integer tray_id;

    private Boolean is_on;

    private DeviceStatus status;
}
