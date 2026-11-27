package vn.edu.mushroom.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.edu.mushroom.entity.Device;
import vn.edu.mushroom.entity.enums.DeviceStatus;

import java.util.List;

@Repository
public interface DeviceRepository extends JpaRepository<Device, Integer> {
    long countByRoomId(Integer roomId);
    long countByIsOnTrue();

    @Query("SELECT d FROM Device d " +
           "LEFT JOIN FETCH d.room " +
           "LEFT JOIN FETCH d.tray " +
           "WHERE (:roomId IS NULL OR d.room.id = :roomId) " +
           "AND (:deviceType IS NULL OR d.deviceType = :deviceType) " +
           "AND (:status IS NULL OR d.status = :status) " +
           "ORDER BY d.id ASC")
    List<Device> findWithFilters(
        @Param("roomId") Integer roomId,
        @Param("deviceType") String deviceType,
        @Param("status") DeviceStatus status
    );
}
