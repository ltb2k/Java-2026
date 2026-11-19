package vn.edu.mushroom.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.edu.mushroom.entity.Rental;
import vn.edu.mushroom.entity.enums.RentalStatus;

import java.util.List;

@Repository
public interface RentalRepository extends JpaRepository<Rental, Integer> {

    @Query("SELECT r FROM Rental r " +
           "LEFT JOIN FETCH r.customer " +
           "LEFT JOIN FETCH r.rentalPackage " +
           "WHERE (:customerId IS NULL OR r.customer.id = :customerId) " +
           "AND (:status IS NULL OR r.status = :status) " +
           "ORDER BY r.id DESC")
    List<Rental> findRentalsWithFilters(
        @Param("customerId") Integer customerId,
        @Param("status") RentalStatus status
    );

    long countByStatus(RentalStatus status);

    @Query("SELECT COUNT(r) FROM Rental r WHERE r.rentalPackage.id = :packageId AND r.status IN ('PENDING', 'APPROVED', 'ASSIGNED', 'ACTIVE')")
    long countActiveByPackageId(@Param("packageId") Integer packageId);

    @Query("SELECT COUNT(r) FROM Rental r WHERE (r.primaryTray.id = :trayId OR :trayId IN (SELECT t.id FROM r.assignedTrays t)) AND r.status = 'ACTIVE'")
    long countActiveByTrayId(@Param("trayId") Integer trayId);

    @Query("SELECT CASE WHEN COUNT(r) > 0 THEN true ELSE false END FROM Rental r " +
           "JOIN r.assignedTrays t " +
           "WHERE r.customer.id = :customerId AND r.status = 'ACTIVE' AND t.room.id = :roomId")
    boolean hasCustomerActiveLeaseInRoom(@Param("customerId") Integer customerId, @Param("roomId") Integer roomId);
}
