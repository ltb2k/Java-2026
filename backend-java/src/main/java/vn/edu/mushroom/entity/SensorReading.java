package vn.edu.mushroom.entity;

import jakarta.persistence.*;
import lombok.*;
import vn.edu.mushroom.entity.enums.SensorType;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(
    name = "sensor_readings",
    indexes = {
        @Index(name = "idx_sensor_time", columnList = "sensor_type, recorded_at"),
        @Index(name = "idx_sensor_room_time", columnList = "room_id, sensor_type, recorded_at")
    }
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class SensorReading {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id")
    private Room room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tray_id")
    private Tray tray;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "device_id")
    private Device device;

    @Enumerated(EnumType.STRING)
    @Column(name = "sensor_type", nullable = false, length = 30)
    private SensorType sensorType;

    @Column(name = "value", nullable = false, precision = 10, scale = 2)
    private BigDecimal value;

    @Column(name = "unit", length = 20)
    private String unit;

    @Column(name = "message_id", length = 64)
    private String messageId;

    @Column(name = "recorded_at", nullable = false, updatable = false)
    private OffsetDateTime recordedAt;

    @PrePersist
    protected void onCreate() {
        if (recordedAt == null) recordedAt = OffsetDateTime.now();
    }
}
