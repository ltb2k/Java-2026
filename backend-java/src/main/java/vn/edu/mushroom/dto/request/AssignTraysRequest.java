package vn.edu.mushroom.dto.request;

import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

@Data
public class AssignTraysRequest {
    @NotEmpty(message = "Danh sách ID khay gán không được để trống")
    private List<Integer> tray_ids;
}
