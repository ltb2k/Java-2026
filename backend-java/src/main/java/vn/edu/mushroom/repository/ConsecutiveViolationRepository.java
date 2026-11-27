package vn.edu.mushroom.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.edu.mushroom.entity.ConsecutiveViolation;
import vn.edu.mushroom.entity.enums.SensorType;

import java.util.Optional;

@Repository
public interface ConsecutiveViolationRepository extends JpaRepository<ConsecutiveViolation, Integer> {
    Optional<ConsecutiveViolation> findByRoomIdAndMetric(Integer roomId, SensorType metric);
}
