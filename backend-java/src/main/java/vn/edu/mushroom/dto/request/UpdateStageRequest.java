package vn.edu.mushroom.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;
import vn.edu.mushroom.entity.enums.GrowthStage;

@Data
public class UpdateStageRequest {
    @NotNull(message = "Giai đoạn phát triển không được để trống")
    private GrowthStage stage;

    private String notes;
}
