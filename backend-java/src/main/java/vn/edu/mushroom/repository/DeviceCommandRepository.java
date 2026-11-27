package vn.edu.mushroom.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.edu.mushroom.entity.DeviceCommand;

import java.util.List;
import java.util.Optional;

@Repository
public interface DeviceCommandRepository extends JpaRepository<DeviceCommand, Integer> {
    Optional<DeviceCommand> findByCommandId(String commandId);

    @Query("SELECT dc FROM DeviceCommand dc " +
           "LEFT JOIN FETCH dc.issuedBy " +
           "WHERE dc.device.id = :deviceId " +
           "ORDER BY dc.createdAt DESC")
    List<DeviceCommand> findByDeviceIdOrderByCreatedAtDesc(@Param("deviceId") Integer deviceId);
}
