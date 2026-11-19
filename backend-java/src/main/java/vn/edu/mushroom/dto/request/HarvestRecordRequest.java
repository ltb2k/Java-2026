package vn.edu.mushroom.dto.request;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDate;

@Data
public class HarvestRecordRequest {
    @NotNull(message = "Sản lượng thu hoạch không được để trống")
    @DecimalMin(value = "0.01", message = "Sản lượng thu hoạch (kg) phải lớn hơn 0")
    private BigDecimal quantity_kg;

    private String quality_grade;

    private LocalDate harvest_date;

    private String notes;
}
