package vn.edu.mushroom.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

@Data
public class ThresholdRequest {
    @NotNull(message = "Ngưỡng dưới (lower_bound) không được để trống")
    private BigDecimal lower_bound;

    @NotNull(message = "Ngưỡng trên (upper_bound) không được để trống")
    private BigDecimal upper_bound;

    private String unit;
}
