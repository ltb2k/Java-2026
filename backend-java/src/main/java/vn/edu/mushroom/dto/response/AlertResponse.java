package vn.edu.mushroom.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.edu.mushroom.entity.Alert;
import vn.edu.mushroom.entity.enums.AlertSeverity;
import vn.edu.mushroom.entity.enums.AlertStatus;
import vn.edu.mushroom.entity.enums.SensorType;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AlertResponse {
    private Long id;
    private Integer room_id;
    private Integer tray_id;
    private SensorType metric;
    private AlertSeverity severity;
    private String title;
    private String message;
    private AlertStatus status;
    private Boolean is_read;
    private String room_name;
    private OffsetDateTime resolved_at;
    private OffsetDateTime created_at;

    public static AlertResponse fromEntity(Alert a) {
        if (a == null) return null;
        return AlertResponse.builder()
                .id(a.getId())
                .room_id(a.getRoom() != null ? a.getRoom().getId() : null)
                .tray_id(a.getTray() != null ? a.getTray().getId() : null)
                .metric(a.getMetric())
                .severity(a.getSeverity())
                .title(a.getTitle())
                .message(a.getMessage())
                .status(a.getStatus())
                .is_read(a.getIsRead())
                .room_name(a.getRoom() != null ? a.getRoom().getName() : null)
                .resolved_at(a.getResolvedAt())
                .created_at(a.getCreatedAt())
                .build();
    }
}
