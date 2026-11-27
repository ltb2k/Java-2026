package vn.edu.mushroom.entity;

import jakarta.persistence.*;
import lombok.*;
import vn.edu.mushroom.entity.enums.SensorType;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "env_thresholds")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class EnvThreshold {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Enumerated(EnumType.STRING)
    @Column(name = "metric", nullable = false, unique = true, length = 30)
    private SensorType metric;

    @Column(name = "lower_bound", nullable = false, precision = 10, scale = 2)
    private BigDecimal lowerBound;

    @Column(name = "upper_bound", nullable = false, precision = 10, scale = 2)
    private BigDecimal upperBound;

    @Column(name = "unit", nullable = false, length = 20)
    private String unit;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "updated_by")
    private User updatedBy;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    @PreUpdate
    protected void onPersistOrUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
