package vn.edu.mushroom.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import vn.edu.mushroom.entity.GrowthLog;

import java.util.List;

@Repository
public interface GrowthLogRepository extends JpaRepository<GrowthLog, Integer> {
    @Query("SELECT gl FROM GrowthLog gl " +
           "LEFT JOIN FETCH gl.createdBy " +
           "WHERE gl.tray.id = :trayId " +
           "ORDER BY gl.createdAt ASC")
    List<GrowthLog> findByTrayIdOrderByCreatedAtAsc(@Param("trayId") Integer trayId);
}
