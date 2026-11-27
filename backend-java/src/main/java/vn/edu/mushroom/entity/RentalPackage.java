package vn.edu.mushroom.entity;

import jakarta.persistence.*;
import lombok.*;
import vn.edu.mushroom.entity.enums.PackageStatus;

import java.math.BigDecimal;
import java.time.OffsetDateTime;

@Entity
@Table(name = "rental_packages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class RentalPackage {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "name", nullable = false, length = 120)
    private String name;

    @Column(name = "duration_days", nullable = false)
    private Integer durationDays;

    @Column(name = "price", nullable = false, precision = 12, scale = 2)
    @Builder.Default
    private BigDecimal price = BigDecimal.ZERO;

    @Column(name = "description", columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 20)
    @Builder.Default
    private PackageStatus status = PackageStatus.ACTIVE;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = OffsetDateTime.now();
        if (status == null) status = PackageStatus.ACTIVE;
        if (price == null) price = BigDecimal.ZERO;
    }
}
