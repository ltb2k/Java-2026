package vn.edu.mushroom.entity;

import jakarta.persistence.*;
import lombok.*;
import vn.edu.mushroom.entity.enums.CommandStatus;

import java.time.OffsetDateTime;

@Entity
@Table(name = "device_commands")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DeviceCommand {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "command_id", nullable = false, unique = true, length = 64)
    private String commandId;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "device_id", nullable = false)
    private Device device;

    @Column(name = "action", nullable = false, length = 50)
    private String action;

    @Column(name = "payload", columnDefinition = "TEXT")
    private String payload;

    @Enumerated(EnumType.STRING)
    @Column(name = "status", nullable = false, length = 30)
    @Builder.Default
    private CommandStatus status = CommandStatus.PENDING;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "issued_by")
    private User issuedBy;

    @Column(name = "result", columnDefinition = "TEXT")
    private String result;

    @Column(name = "acked_at")
    private OffsetDateTime ackedAt;

    @Column(name = "created_at", nullable = false, updatable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) createdAt = OffsetDateTime.now();
        if (status == null) status = CommandStatus.PENDING;
    }
}
