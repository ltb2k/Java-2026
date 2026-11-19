package vn.edu.mushroom.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import vn.edu.mushroom.entity.EnvThreshold;
import vn.edu.mushroom.entity.enums.SensorType;

import java.util.Optional;

@Repository
public interface EnvThresholdRepository extends JpaRepository<EnvThreshold, Integer> {
    Optional<EnvThreshold> findByMetric(SensorType metric);
}
