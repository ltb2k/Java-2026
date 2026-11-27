package vn.edu.mushroom.entity;

import jakarta.persistence.*;
import lombok.*;
import vn.edu.mushroom.entity.enums.GrowthStage;
import vn.edu.mushroom.entity.enums.TrayStatus;

import java.time.OffsetDateTime;

@Entity
@Table(name = "trays")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Tray {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "code", nullable = false, unique = true, length = 50)
    private String code;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id")
    private Room room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "package_id")
    private RentalPackage rentalPackage;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private TrayStatus status = TrayStatus.AVAILABLE;

    @Enumerated(EnumType.STRING)
    @Column(name = "growth_stage", nullable = false, length = 30)
    @Builder.Default
    private GrowthStage growthStage = GrowthStage.PREPARATION;

    @Column(name = "growth_day", nullable = false)
    @Builder.Default
    private Integer growthDay = 1;

    @Column(name = "growth_total_days", nullable = false)
    @Builder.Default
    private Integer growthTotalDays = 30;

    @Column(name = "mushroom_variety", nullable = false, length = 120)
    @Builder.Default
    private String mushroomVariety = "Nấm Bào Ngư Xám";

    @Column(name = "is_archived", nullable = false)
    @Builder.Default
    private Boolean isArchived = false;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        if (createdAt == null) createdAt = now;
        if (updatedAt == null) updatedAt = now;
        if (status == null) status = TrayStatus.AVAILABLE;
        if (growthStage == null) growthStage = GrowthStage.PREPARATION;
        if (growthDay == null) growthDay = 1;
        if (growthTotalDays == null) growthTotalDays = 30;
        if (mushroomVariety == null) mushroomVariety = "Nấm Bào Ngư Xám";
        if (isArchived == null) isArchived = false;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
