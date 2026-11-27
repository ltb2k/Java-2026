package vn.edu.mushroom.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import vn.edu.mushroom.entity.Room;
import vn.edu.mushroom.entity.enums.RoomStatus;

import java.time.OffsetDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RoomResponse {
    private Integer id;
    private String name;
    private String location;
    private RoomStatus status;
    private Boolean is_archived;
    private Long total_trays;
    private Long rented_trays;
    private Long total_devices;
    private OffsetDateTime created_at;
    private OffsetDateTime updated_at;

    public static RoomResponse fromEntity(Room room, Long totalTrays, Long rentedTrays, Long totalDevices) {
        if (room == null) return null;
        return RoomResponse.builder()
                .id(room.getId())
                .name(room.getName())
                .location(room.getLocation())
                .status(room.getStatus())
                .is_archived(room.getIsArchived())
                .total_trays(totalTrays != null ? totalTrays : 0L)
                .rented_trays(rentedTrays != null ? rentedTrays : 0L)
                .total_devices(totalDevices != null ? totalDevices : 0L)
                .created_at(room.getCreatedAt())
                .updated_at(room.getUpdatedAt())
                .build();
    }
}
