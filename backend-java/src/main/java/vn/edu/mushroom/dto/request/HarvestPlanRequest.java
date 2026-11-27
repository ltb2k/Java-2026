package vn.edu.mushroom.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalDate;

@Data
public class HarvestPlanRequest {
    @NotNull(message = "ID khay trồng không được để trống")
    private Integer tray_id;

    private LocalDate planned_date;

    private String notes;
}
