package vn.edu.mushroom.dto.request;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;
import vn.edu.mushroom.entity.enums.PackageStatus;

import java.math.BigDecimal;

@Data
public class RentalPackageRequest {
    @NotBlank(message = "Tên gói không được để trống")
    private String name;

    @NotNull(message = "Thời gian thuê (ngày) không được để trống")
    @Min(value = 1, message = "Thời gian thuê phải ít nhất 1 ngày")
    private Integer duration_days;

    @NotNull(message = "Giá gói thuê không được để trống")
    @Min(value = 0, message = "Giá gói thuê không được âm")
    private BigDecimal price;

    private String description;

    private PackageStatus status;
}
