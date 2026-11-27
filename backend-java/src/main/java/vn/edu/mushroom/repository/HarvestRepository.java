package vn.edu.mushroom.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.edu.mushroom.entity.Harvest;
import vn.edu.mushroom.entity.enums.HarvestStatus;

import java.util.List;

@Repository
public interface HarvestRepository extends JpaRepository<Harvest, Integer> {
    long countByTrayId(Integer trayId);

    @Query("SELECT h FROM Harvest h " +
           "LEFT JOIN FETCH h.tray t " +
           "LEFT JOIN FETCH t.room " +
           "LEFT JOIN FETCH h.recordedBy " +
           "WHERE (:trayId IS NULL OR h.tray.id = :trayId) " +
           "AND (:status IS NULL OR h.status = :status) " +
           "ORDER BY COALESCE(h.harvestDate, h.plannedDate, cast(h.createdAt as date)) DESC")
    List<Harvest> findHarvests(
        @Param("trayId") Integer trayId,
        @Param("status") HarvestStatus status
    );

    @Query("SELECT h FROM Harvest h " +
           "LEFT JOIN FETCH h.tray t " +
           "LEFT JOIN FETCH t.room " +
           "LEFT JOIN FETCH h.recordedBy " +
           "WHERE h.tray.id IN (" +
           "  SELECT rt.id FROM Rental rent JOIN rent.assignedTrays rt WHERE rent.customer.id = :customerId " +
           "  UNION " +
           "  SELECT rent.primaryTray.id FROM Rental rent WHERE rent.customer.id = :customerId AND rent.primaryTray IS NOT NULL" +
           ") " +
           "AND (:trayId IS NULL OR h.tray.id = :trayId) " +
           "AND (:status IS NULL OR h.status = :status) " +
           "ORDER BY COALESCE(h.harvestDate, h.plannedDate, cast(h.createdAt as date)) DESC")
    List<Harvest> findHarvestsForCustomer(
        @Param("customerId") Integer customerId,
        @Param("trayId") Integer trayId,
        @Param("status") HarvestStatus status
    );
}
