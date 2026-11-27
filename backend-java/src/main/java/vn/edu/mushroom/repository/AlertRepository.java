package vn.edu.mushroom.repository;

import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.edu.mushroom.entity.Alert;
import vn.edu.mushroom.entity.enums.AlertSeverity;
import vn.edu.mushroom.entity.enums.AlertStatus;
import vn.edu.mushroom.entity.enums.SensorType;

import java.util.List;
import java.util.Optional;

@Repository
public interface AlertRepository extends JpaRepository<Alert, Long> {

    @Query("SELECT a FROM Alert a " +
           "LEFT JOIN FETCH a.room " +
           "WHERE (:roomId IS NULL OR a.room.id = :roomId) " +
           "AND (:severity IS NULL OR a.severity = :severity) " +
           "AND (:status IS NULL OR a.status = :status) " +
           "AND (:isRead IS NULL OR a.isRead = :isRead) " +
           "ORDER BY a.createdAt DESC")
    List<Alert> findAlerts(
        @Param("roomId") Integer roomId,
        @Param("severity") AlertSeverity severity,
        @Param("status") AlertStatus status,
        @Param("isRead") Boolean isRead,
        Pageable pageable
    );

    @Query("SELECT a FROM Alert a " +
           "LEFT JOIN FETCH a.room " +
           "WHERE a.room.id IN (" +
           "  SELECT DISTINCT t.room.id FROM Rental rent JOIN rent.assignedTrays t " +
           "  WHERE rent.customer.id = :customerId AND rent.status = 'ACTIVE'" +
           ") " +
           "AND (:roomId IS NULL OR a.room.id = :roomId) " +
           "AND (:severity IS NULL OR a.severity = :severity) " +
           "AND (:status IS NULL OR a.status = :status) " +
           "AND (:isRead IS NULL OR a.isRead = :isRead) " +
           "ORDER BY a.createdAt DESC")
    List<Alert> findAlertsForCustomer(
        @Param("customerId") Integer customerId,
        @Param("roomId") Integer roomId,
        @Param("severity") AlertSeverity severity,
        @Param("status") AlertStatus status,
        @Param("isRead") Boolean isRead,
        Pageable pageable
    );

    Optional<Alert> findFirstByRoomIdAndMetricAndStatus(Integer roomId, SensorType metric, AlertStatus status);

    default Optional<Alert> findActiveByRoomIdAndMetric(Integer roomId, SensorType metric) {
        return findFirstByRoomIdAndMetricAndStatus(roomId, metric, AlertStatus.ACTIVE);
    }

    long countByStatusAndIsReadFalse(AlertStatus status);
}
