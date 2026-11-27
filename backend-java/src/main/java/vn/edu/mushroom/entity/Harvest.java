package vn.edu.mushroom.entity;

import jakarta.persistence.*;
import lombok.*;
import vn.edu.mushroom.entity.enums.HarvestStatus;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;

@Entity
@Table(name = "harvests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Harvest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tray_id")
    private Tray tray;

    @Column(name = "quantity_kg", precision = 10, scale = 2)
    private BigDecimal quantityKg;

    @Column(name = "quality_grade", length = 20)
    @Builder.Default
    private String qualityGrade = "STANDARD";

    @Column(name = "planned_date")
    private LocalDate plannedDate;

    @Column(name = "harvest_date")
    private LocalDate harvestDate;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private HarvestStatus status = HarvestStatus.PLANNED;

    @Column(name = "notes", columnDefinition = "TEXT")
    private String notes;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "recorded_by")
    private User recordedBy;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = OffsetDateTime.now();
        if (status == null) status = HarvestStatus.PLANNED;
        if (qualityGrade == null) qualityGrade = "STANDARD";
    }
}
