package vn.edu.mushroom.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.edu.mushroom.entity.Device;
import vn.edu.mushroom.entity.enums.DeviceStatus;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class DeviceResponse {
    private Integer id;
    private String name;
    private String device_type;
    private Integer room_id;
    private Integer tray_id;
    private Boolean is_on;
    private DeviceStatus status;
    private String room_name;
    private String tray_code;
    private OffsetDateTime last_seen_at;
    private OffsetDateTime updated_at;

    public static DeviceResponse fromEntity(Device d) {
        if (d == null) return null;
        return DeviceResponse.builder()
                .id(d.getId())
                .name(d.getName())
                .device_type(d.getDeviceType())
                .room_id(d.getRoom() != null ? d.getRoom().getId() : null)
                .tray_id(d.getTray() != null ? d.getTray().getId() : null)
                .is_on(d.getIsOn())
                .status(d.getStatus())
                .room_name(d.getRoom() != null ? d.getRoom().getName() : null)
                .tray_code(d.getTray() != null ? d.getTray().getCode() : null)
                .last_seen_at(d.getLastSeenAt())
                .updated_at(d.getUpdatedAt())
                .build();
    }
}
