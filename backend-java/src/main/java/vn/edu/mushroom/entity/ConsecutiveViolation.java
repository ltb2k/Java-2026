package vn.edu.mushroom.entity;

import jakarta.persistence.*;
import lombok.*;
import vn.edu.mushroom.entity.enums.SensorType;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(
    name = "consecutive_violations",
    uniqueConstraints = @UniqueConstraint(name = "uq_room_metric", columnNames = {"room_id", "metric"})
)
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConsecutiveViolation {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id", nullable = false)
    private Room room;

    @Enumerated(EnumType.STRING)
    @Column(name = "metric", nullable = false, length = 30)
    private SensorType metric;

    @Column(name = "count", nullable = false)
    @Builder.Default
    private Integer count = 0;

    @Column(name = "last_value", precision = 10, scale = 2)
    private BigDecimal lastValue;

    @Column(name = "last_recorded_at", nullable = false)
    private OffsetDateTime lastRecordedAt;

    @PrePersist
    @PreUpdate
    protected void onPersistOrUpdate() {
        if (lastRecordedAt == null) lastRecordedAt = OffsetDateTime.now();
        if (count == null) count = 0;
    }
}
