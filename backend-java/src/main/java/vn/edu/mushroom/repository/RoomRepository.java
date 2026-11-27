package vn.edu.mushroom.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.edu.mushroom.entity.Room;
import vn.edu.mushroom.entity.enums.RoomStatus;

import java.util.List;

@Repository
public interface RoomRepository extends JpaRepository<Room, Integer> {
    List<Room> findByIsArchivedFalse();

    @Query("SELECT r FROM Room r WHERE (:includeArchived = true OR r.isArchived = false) " +
           "AND (:status IS NULL OR r.status = :status) ORDER BY r.id ASC")
    List<Room> findRoomsWithFilter(
        @Param("status") RoomStatus status,
        @Param("includeArchived") boolean includeArchived
    );

    long countByStatusAndIsArchivedFalse(RoomStatus status);
    long countByIsArchivedFalse();
}
