package vn.edu.mushroom.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;
import vn.edu.mushroom.entity.enums.RoomStatus;

@Data
public class RoomRequest {
    @NotBlank(message = "Tên phòng không được để trống")
    private String name;

    private String location;

    private RoomStatus status;
}
