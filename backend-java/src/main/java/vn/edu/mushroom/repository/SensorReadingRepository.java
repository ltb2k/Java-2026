package vn.edu.mushroom.repository;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.edu.mushroom.entity.SensorReading;
import vn.edu.mushroom.entity.enums.SensorType;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;

@Repository
public interface SensorReadingRepository extends JpaRepository<SensorReading, Long> {
    boolean existsByMessageId(String messageId);

    @Query("SELECT sr FROM SensorReading sr " +
           "LEFT JOIN FETCH sr.room " +
           "LEFT JOIN FETCH sr.tray " +
           "WHERE (:roomId IS NULL OR sr.room.id = :roomId) " +
           "AND (:trayId IS NULL OR sr.tray.id = :trayId) " +
           "AND (:sensorType IS NULL OR sr.sensorType = :sensorType) " +
           "AND (cast(:fromDate as timestamp) IS NULL OR sr.recordedAt >= :fromDate) " +
           "AND (cast(:toDate as timestamp) IS NULL OR sr.recordedAt <= :toDate) " +
           "ORDER BY sr.recordedAt DESC")
    List<SensorReading> findHistory(
        @Param("roomId") Integer roomId,
        @Param("trayId") Integer trayId,
        @Param("sensorType") SensorType sensorType,
        @Param("fromDate") OffsetDateTime fromDate,
        @Param("toDate") OffsetDateTime toDate,
        Pageable pageable
    );

    @Query("SELECT sr FROM SensorReading sr WHERE sr.sensorType = :sensorType " +
           "AND (:roomId IS NULL OR sr.room.id = :roomId) " +
           "ORDER BY sr.recordedAt DESC LIMIT 1")
    Optional<SensorReading> findLatestBySensorTypeAndRoomId(
        @Param("sensorType") SensorType sensorType,
        @Param("roomId") Integer roomId
    );
}
