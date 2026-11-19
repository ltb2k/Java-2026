package vn.edu.mushroom.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.edu.mushroom.entity.Tray;
import vn.edu.mushroom.entity.enums.GrowthStage;
import vn.edu.mushroom.entity.enums.RentalStatus;
import vn.edu.mushroom.entity.enums.TrayStatus;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class TrayResponse {
    private Integer id;
    private String code;
    private Integer room_id;
    private Integer package_id;
    private TrayStatus status;
    private GrowthStage growth_stage;
    private Integer growth_day;
    private Integer growth_total_days;
    private String mushroom_variety;
    private Boolean is_archived;
    private String room_name;
    private String package_name;
    private String customer_name;
    private Integer rental_id;
    private RentalStatus rental_status;
    private OffsetDateTime created_at;
    private OffsetDateTime updated_at;

    public static TrayResponse fromEntity(Tray tray) {
        if (tray == null) return null;
        return TrayResponse.builder()
                .id(tray.getId())
                .code(tray.getCode())
                .room_id(tray.getRoom() != null ? tray.getRoom().getId() : null)
                .package_id(tray.getRentalPackage() != null ? tray.getRentalPackage().getId() : null)
                .status(tray.getStatus())
                .growth_stage(tray.getGrowthStage())
                .growth_day(tray.getGrowthDay())
                .growth_total_days(tray.getGrowthTotalDays())
                .mushroom_variety(tray.getMushroomVariety())
                .is_archived(tray.getIsArchived())
                .room_name(tray.getRoom() != null ? tray.getRoom().getName() : null)
                .package_name(tray.getRentalPackage() != null ? tray.getRentalPackage().getName() : null)
                .created_at(tray.getCreatedAt())
                .updated_at(tray.getUpdatedAt())
                .build();
    }
}
