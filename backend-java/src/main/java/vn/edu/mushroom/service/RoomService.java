package vn.edu.mushroom.service;

import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.mushroom.dto.request.RoomRequest;
import vn.edu.mushroom.dto.response.RoomResponse;
import vn.edu.mushroom.entity.Room;
import vn.edu.mushroom.entity.enums.RoomStatus;
import vn.edu.mushroom.entity.enums.TrayStatus;
import vn.edu.mushroom.exception.AppException;
import vn.edu.mushroom.repository.DeviceRepository;
import vn.edu.mushroom.repository.RoomRepository;
import vn.edu.mushroom.repository.TrayRepository;

import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class RoomService {

    private final RoomRepository roomRepository;
    private final TrayRepository trayRepository;
    private final DeviceRepository deviceRepository;

    @Transactional(readOnly = true)
    public List<RoomResponse> listRooms(RoomStatus status, boolean includeArchived) {
        List<Room> rooms = roomRepository.findRoomsWithFilter(status, includeArchived);
        return rooms.stream().map(r -> {
            long totalTrays = trayRepository.countByRoomIdAndIsArchivedFalse(r.getId());
            long totalDevices = deviceRepository.countByRoomId(r.getId());
            return RoomResponse.fromEntity(r, totalTrays, 0L, totalDevices);
        }).toList();
    }

    @Transactional(readOnly = true)
    public RoomResponse getRoomById(Integer id) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> AppException.notFound("Phòng trồng không tồn tại"));

        long totalTrays = trayRepository.countByRoomIdAndIsArchivedFalse(room.getId());
        long totalDevices = deviceRepository.countByRoomId(room.getId());
        return RoomResponse.fromEntity(room, totalTrays, 0L, totalDevices);
    }

    @Transactional
    public RoomResponse createRoom(RoomRequest request) {
        Room room = Room.builder()
                .name(request.getName().trim())
                .location(request.getLocation() != null ? request.getLocation().trim() : null)
                .status(request.getStatus() != null ? request.getStatus() : RoomStatus.ACTIVE)
                .isArchived(false)
                .build();

        Room saved = roomRepository.save(room);
        return RoomResponse.fromEntity(saved, 0L, 0L, 0L);
    }

    @Transactional
    public RoomResponse updateRoom(Integer id, RoomRequest request) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> AppException.notFound("Phòng trồng không tồn tại"));

        if (request.getName() != null) room.setName(request.getName().trim());
        if (request.getLocation() != null) room.setLocation(request.getLocation().trim());
        if (request.getStatus() != null) room.setStatus(request.getStatus());

        Room updated = roomRepository.save(room);
        long totalTrays = trayRepository.countByRoomIdAndIsArchivedFalse(updated.getId());
        long totalDevices = deviceRepository.countByRoomId(updated.getId());
        return RoomResponse.fromEntity(updated, totalTrays, 0L, totalDevices);
    }

    @Transactional
    public Map<String, Object> deleteRoom(Integer id) {
        Room room = roomRepository.findById(id)
                .orElseThrow(() -> AppException.notFound("Phòng trồng không tồn tại"));

        long trayCount = trayRepository.countByRoomIdAndIsArchivedFalse(id);
        long deviceCount = deviceRepository.countByRoomId(id);

        Map<String, Object> result = new HashMap<>();
        if (trayCount > 0 || deviceCount > 0) {
            // Soft archive as mandated by SRS specification
            room.setIsArchived(true);
            room.setStatus(RoomStatus.INACTIVE);
            roomRepository.save(room);
            result.put("message", "Phòng đang có khay hoặc thiết bị liên kết, đã chuyển sang trạng thái lưu trữ (Archived) thay vì xóa vĩnh viễn.");
            result.put("archived", true);
        } else {
            roomRepository.delete(room);
            result.put("message", "Xóa phòng trồng thành công");
            result.put("archived", false);
        }
        return result;
    }
}
