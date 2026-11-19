package vn.edu.mushroom.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import vn.edu.mushroom.entity.enums.TrayStatus;

@Data
public class TrayRequest {
    @NotBlank(message = "Mã khay không được để trống")
    private String code;

    private Integer room_id;

    private Integer package_id;

    private TrayStatus status;

    private Integer growth_day;

    private Integer growth_total_days;

    private String mushroom_variety;
}
