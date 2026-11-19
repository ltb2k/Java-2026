package vn.edu.mushroom.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.edu.mushroom.entity.Tray;
import vn.edu.mushroom.entity.enums.GrowthStage;
import vn.edu.mushroom.entity.enums.TrayStatus;

import java.util.List;
import java.util.Optional;

@Repository
public interface TrayRepository extends JpaRepository<Tray, Integer> {
    Optional<Tray> findByCode(String code);
    boolean existsByCode(String code);

    long countByRoomIdAndIsArchivedFalse(Integer roomId);
    long countByIsArchivedFalse();
    long countByStatusAndIsArchivedFalse(TrayStatus status);

    @Query("SELECT t FROM Tray t WHERE t.isArchived = false " +
           "AND (:roomId IS NULL OR t.room.id = :roomId) " +
           "AND (:status IS NULL OR t.status = :status) " +
           "AND (:stage IS NULL OR t.growthStage = :stage) " +
           "ORDER BY t.id ASC")
    List<Tray> findAllWithFilters(
        @Param("roomId") Integer roomId,
        @Param("status") TrayStatus status,
        @Param("stage") GrowthStage stage
    );

    @Query("SELECT DISTINCT t FROM Tray t " +
           "JOIN t.room r " +
           "WHERE t.isArchived = false " +
           "AND t.id IN (" +
           "  SELECT rt.id FROM Rental rent JOIN rent.assignedTrays rt WHERE rent.customer.id = :customerId AND rent.status = 'ACTIVE' " +
           "  UNION " +
           "  SELECT rent.primaryTray.id FROM Rental rent WHERE rent.customer.id = :customerId AND rent.status = 'ACTIVE' AND rent.primaryTray IS NOT NULL" +
           ") " +
           "AND (:roomId IS NULL OR t.room.id = :roomId) " +
           "AND (:status IS NULL OR t.status = :status) " +
           "AND (:stage IS NULL OR t.growthStage = :stage) " +
           "ORDER BY t.id ASC")
    List<Tray> findCustomerActiveTrays(
        @Param("customerId") Integer customerId,
        @Param("roomId") Integer roomId,
        @Param("status") TrayStatus status,
        @Param("stage") GrowthStage stage
    );
}
