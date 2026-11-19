package vn.edu.mushroom.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.edu.mushroom.entity.SensorReading;
import vn.edu.mushroom.entity.enums.SensorType;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class SensorReadingResponse {
    private Long id;
    private Integer room_id;
    private Integer tray_id;
    private Integer device_id;
    private SensorType sensor_type;
    private BigDecimal value;
    private String unit;
    private String message_id;
    private String room_name;
    private String tray_code;
    private OffsetDateTime recorded_at;

    public static SensorReadingResponse fromEntity(SensorReading r) {
        if (r == null) return null;
        return SensorReadingResponse.builder()
                .id(r.getId())
                .room_id(r.getRoom() != null ? r.getRoom().getId() : null)
                .tray_id(r.getTray() != null ? r.getTray().getId() : null)
                .device_id(r.getDevice() != null ? r.getDevice().getId() : null)
                .sensor_type(r.getSensorType())
                .value(r.getValue())
                .unit(r.getUnit())
                .message_id(r.getMessageId())
                .room_name(r.getRoom() != null ? r.getRoom().getName() : null)
                .tray_code(r.getTray() != null ? r.getTray().getCode() : null)
                .recorded_at(r.getRecordedAt())
                .build();
    }
}
