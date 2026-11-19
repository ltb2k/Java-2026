package vn.edu.mushroom.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.edu.mushroom.entity.Harvest;
import vn.edu.mushroom.entity.enums.HarvestStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class HarvestResponse {
    private Integer id;
    private Integer tray_id;
    private String tray_code;
    private String mushroom_variety;
    private String room_name;
    private BigDecimal quantity_kg;
    private String quality_grade;
    private LocalDate planned_date;
    private LocalDate harvest_date;
    private HarvestStatus status;
    private String notes;
    private Integer recorded_by;
    private String recorded_by_name;
    private OffsetDateTime created_at;

    public static HarvestResponse fromEntity(Harvest h) {
        if (h == null) return null;
        return HarvestResponse.builder()
                .id(h.getId())
                .tray_id(h.getTray() != null ? h.getTray().getId() : null)
                .tray_code(h.getTray() != null ? h.getTray().getCode() : null)
                .mushroom_variety(h.getTray() != null ? h.getTray().getMushroomVariety() : null)
                .room_name(h.getTray() != null && h.getTray().getRoom() != null ? h.getTray().getRoom().getName() : null)
                .quantity_kg(h.getQuantityKg())
                .quality_grade(h.getQualityGrade())
                .planned_date(h.getPlannedDate())
                .harvest_date(h.getHarvestDate())
                .status(h.getStatus())
                .notes(h.getNotes())
                .recorded_by(h.getRecordedBy() != null ? h.getRecordedBy().getId() : null)
                .recorded_by_name(h.getRecordedBy() != null ? h.getRecordedBy().getFullName() : null)
                .created_at(h.getCreatedAt())
                .build();
    }
}
