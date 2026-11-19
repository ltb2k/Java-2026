package vn.edu.mushroom.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.edu.mushroom.entity.GrowthLog;
import vn.edu.mushroom.entity.enums.GrowthStage;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class GrowthLogResponse {
    private Integer id;
    private Integer tray_id;
    private GrowthStage stage;
    private String notes;
    private Integer created_by;
    private String recorder_name;
    private OffsetDateTime created_at;

    public static GrowthLogResponse fromEntity(GrowthLog gl) {
        if (gl == null) return null;
        return GrowthLogResponse.builder()
                .id(gl.getId())
                .tray_id(gl.getTray() != null ? gl.getTray().getId() : null)
                .stage(gl.getStage())
                .notes(gl.getNotes())
                .created_by(gl.getCreatedBy() != null ? gl.getCreatedBy().getId() : null)
                .recorder_name(gl.getCreatedBy() != null ? gl.getCreatedBy().getFullName() : null)
                .created_at(gl.getCreatedAt())
                .build();
    }
}
