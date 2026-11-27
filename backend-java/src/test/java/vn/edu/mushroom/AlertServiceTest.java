package vn.edu.mushroom;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.ActiveProfiles;
import org.springframework.transaction.annotation.Transactional;
import vn.edu.mushroom.entity.Alert;
import vn.edu.mushroom.entity.EnvThreshold;
import vn.edu.mushroom.entity.Room;
import vn.edu.mushroom.entity.enums.AlertStatus;
import vn.edu.mushroom.entity.enums.RoomStatus;
import vn.edu.mushroom.entity.enums.SensorType;
import vn.edu.mushroom.repository.AlertRepository;
import vn.edu.mushroom.repository.ConsecutiveViolationRepository;
import vn.edu.mushroom.repository.EnvThresholdRepository;
import vn.edu.mushroom.repository.RoomRepository;
import vn.edu.mushroom.service.AlertService;

import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest
@ActiveProfiles("test")
@Transactional
class AlertServiceTest {

    @Autowired
    private AlertService alertService;

    @Autowired
    private RoomRepository roomRepository;

    @Autowired
    private EnvThresholdRepository thresholdRepository;

    @Autowired
    private AlertRepository alertRepository;

    @Autowired
    private ConsecutiveViolationRepository violationRepository;

    private Room room;

    @BeforeEach
    void setUp() {
        alertRepository.deleteAll();
        violationRepository.deleteAll();
        thresholdRepository.deleteAll();
        roomRepository.deleteAll();

        room = roomRepository.save(Room.builder()
                .name("Phòng Test 01")
                .location("Khu A")
                .status(RoomStatus.ACTIVE)
                .build());

        // Configure threshold for TEMPERATURE: 20.0 to 30.0 °C
        thresholdRepository.save(EnvThreshold.builder()
                .metric(SensorType.TEMPERATURE)
                .lowerBound(new BigDecimal("20.0"))
                .upperBound(new BigDecimal("30.0"))
                .unit("°C")
                .build());
    }

    @Test
    void testUnconfiguredMetricReturnsUnconfigured() {
        Map<String, Object> result = alertService.evaluateReading(room.getId(), SensorType.CO2, new BigDecimal("600"));
        assertEquals("UNCONFIGURED", result.get("status"));
    }

    @Test
    void testFirstViolationDoesNotGenerateAlert() {
        // Temperature 35 > 30 (1st violation)
        Map<String, Object> result = alertService.evaluateReading(room.getId(), SensorType.TEMPERATURE, new BigDecimal("35.0"));

        assertEquals("FIRST_VIOLATION_PENDING_CONFIRMATION", result.get("status"));
        assertEquals(1, result.get("violationCount"));

        List<Alert> alerts = alertRepository.findAll();
        assertTrue(alerts.isEmpty(), "1st sample violation must NOT generate an alert yet!");
    }

    @Test
    void testSecondConsecutiveViolationGeneratesAlert() {
        // Sample 1: 35 > 30
        alertService.evaluateReading(room.getId(), SensorType.TEMPERATURE, new BigDecimal("35.0"));

        // Sample 2: 36 > 30 (2nd consecutive sample)
        Map<String, Object> result2 = alertService.evaluateReading(room.getId(), SensorType.TEMPERATURE, new BigDecimal("36.0"));

        assertEquals("ALERT_GENERATED", result2.get("status"));
        assertEquals(2, result2.get("violationCount"));

        List<Alert> alerts = alertRepository.findAll();
        assertEquals(1, alerts.size(), "2nd consecutive violation MUST generate an alert!");
        assertEquals(AlertStatus.ACTIVE, alerts.get(0).getStatus());
    }

    @Test
    void testNormalReadingResolvesActiveAlert() {
        // Sample 1 & 2 -> alert generated
        alertService.evaluateReading(room.getId(), SensorType.TEMPERATURE, new BigDecimal("35.0"));
        alertService.evaluateReading(room.getId(), SensorType.TEMPERATURE, new BigDecimal("36.0"));

        // Sample 3: back to normal 25 °C
        Map<String, Object> normalResult = alertService.evaluateReading(room.getId(), SensorType.TEMPERATURE, new BigDecimal("25.0"));
        assertEquals("NORMAL", normalResult.get("status"));

        List<Alert> alerts = alertRepository.findAll();
        assertEquals(1, alerts.size());
        assertEquals(AlertStatus.RESOLVED, alerts.get(0).getStatus(), "Alert should be auto-resolved when reading is normal!");
    }
}
