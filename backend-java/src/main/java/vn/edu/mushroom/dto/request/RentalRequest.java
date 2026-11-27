package vn.edu.mushroom.dto.request;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class RentalRequest {
    @NotNull(message = "Gói thuê không được để trống")
    private Integer package_id;

    @Min(value = 1, message = "Số lượng khay thuê tối thiểu là 1")
    @Max(value = 5, message = "Số lượng khay thuê tối đa là 5")
    private Integer quantity = 1;

    private String notes;
}
