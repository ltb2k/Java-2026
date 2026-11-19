package vn.edu.mushroom.entity;

import jakarta.persistence.*;
import lombok.*;
import vn.edu.mushroom.entity.enums.DeviceStatus;

import java.time.OffsetDateTime;

@Entity
@Table(name = "devices")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Device {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "name", nullable = false, length = 120)
    private String name;

    @Column(name = "device_type", nullable = false, length = 50)
    private String deviceType;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "room_id")
    private Room room;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "tray_id")
    private Tray tray;

    @Column(name = "is_on", nullable = false)
    @Builder.Default
    private Boolean isOn = false;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private DeviceStatus status = DeviceStatus.ONLINE;

    @Column(name = "last_seen_at")
    private OffsetDateTime lastSeenAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        if (updatedAt == null) updatedAt = now;
        if (isOn == null) isOn = false;
        if (status == null) status = DeviceStatus.ONLINE;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
